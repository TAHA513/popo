import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getSession } from "./replitAuth";
import { setupLocalAuth } from "./localAuth";
import passport from "passport";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for proper session handling
app.use(express.json({ limit: '10mb' })); // Increase limit for voice messages
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Password reset routes (before middleware)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
    }

    console.log('🔐 طلب إعادة تعيين كلمة المرور للإيميل:', email);

    // Import required modules
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    const { emailService } = await import("./email-service");
    const { nanoid } = await import("nanoid");
    
    // Always return success message for security
    const successMessage = "إذا كان هذا البريد الإلكتروني مسجلاً في النظام، ستتلقى رسالة إعادة تعيين كلمة المرور";

    // Check if user exists in database
    const localUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (localUser && localUser.length > 0) {
      console.log('✅ المستخدم موجود في قاعدة البيانات المحلية');
      const userData = localUser[0];
      
      try {
        // Generate reset token (valid for 24 hours)
        const resetToken = nanoid(32);
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 24); // 24 hours from now
        
        // Update user with reset token
        await db.update(users)
          .set({ 
            passwordResetToken: resetToken,
            passwordResetExpiry: resetExpiry.toISOString()
          })
          .where(eq(users.email, email));
          
        console.log('🔐 تم إنشاء رمز إعادة التعيين:', resetToken);
        
        // Create reset URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        // Try to send password reset email
        try {
          const emailSent = await emailService.sendPasswordReset(email, resetToken, resetUrl);
          
          if (emailSent) {
            console.log('📧 ✅ تم إرسال رسالة إعادة تعيين كلمة المرور بنجاح!');
          } else {
            console.log('❌ فشل في إرسال رسالة البريد الإلكتروني');
          }
        } catch (emailError: any) {
          console.log('⚠️ إعدادات البريد الإلكتروني غير متاحة - رابط إعادة التعيين:');
          console.log('🔗 رابط إعادة تعيين كلمة المرور:', resetUrl);
          console.log('📧 البريد الإلكتروني:', email);
          console.log('🔐 الرمز:', resetToken);
          console.log('⏰ صالح حتى:', resetExpiry.toLocaleString('ar-EG'));
        }
        
      } catch (error) {
        console.error('❌ خطأ في إنشاء رمز الإعادة وإرسال البريد:', error);
      }
    } else {
      console.log('⚠️ المستخدم غير موجود في قاعدة البيانات المحلية');
    }

    // Always return success for security (don't reveal if email exists)
    res.json({ 
      success: true, 
      message: successMessage
    });

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({ message: "حدث خطأ أثناء معالجة طلبك" });
  }
});

// Password reset verification and completion route
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }

    console.log('🔄 طلب إعادة تعيين كلمة المرور:', email);

    // Import required modules
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq, and } = await import("drizzle-orm");
    const bcrypt = await import("bcryptjs");
    
    // Find user with valid reset token
    const user = await db.select().from(users)
      .where(and(
        eq(users.email, email),
        eq(users.passwordResetToken, token)
      ))
      .limit(1);
    
    if (!user || user.length === 0) {
      return res.status(400).json({ message: "رمز إعادة التعيين غير صحيح أو منتهي الصلاحية" });
    }
    
    const userData = user[0];
    
    // Check if token is expired
    if (userData.passwordResetExpiry) {
      const expiryDate = new Date(userData.passwordResetExpiry);
      const now = new Date();
      
      if (now > expiryDate) {
        console.log('⏰ رمز إعادة التعيين منتهي الصلاحية');
        
        // Clear expired token
        await db.update(users)
          .set({ 
            passwordResetToken: null,
            passwordResetExpiry: null
          })
          .where(eq(users.email, email));
          
        return res.status(400).json({ message: "رمز إعادة التعيين منتهي الصلاحية" });
      }
    }
    
    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password and clear reset token
    await db.update(users)
      .set({ 
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiry: null
      })
      .where(eq(users.email, email));
      
    console.log('✅ تم تحديث كلمة المرور بنجاح للمستخدم:', email);
    
    res.json({ 
      success: true, 
      message: "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن بكلمة المرور الجديدة."
    });

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث كلمة المرور" });
  }
});

// Validate reset token route  
app.get('/api/validate-reset-token', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ message: "الرمز والبريد الإلكتروني مطلوبان" });
    }

    // Import required modules
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    // Find user with valid reset token
    const user = await db.select().from(users)
      .where(and(
        eq(users.email, email as string),
        eq(users.passwordResetToken, token as string)
      ))
      .limit(1);
    
    if (!user || user.length === 0) {
      return res.status(400).json({ valid: false, message: "رمز إعادة التعيين غير صحيح" });
    }
    
    const userData = user[0];
    
    // Check if token is expired
    if (userData.passwordResetExpiry) {
      const expiryDate = new Date(userData.passwordResetExpiry);
      const now = new Date();
      
      if (now > expiryDate) {
        // Clear expired token
        await db.update(users)
          .set({ 
            passwordResetToken: null,
            passwordResetExpiry: null
          })
          .where(eq(users.email, email as string));
          
        return res.status(400).json({ valid: false, message: "رمز إعادة التعيين منتهي الصلاحية" });
      }
    }
    
    res.json({ 
      valid: true, 
      message: "الرمز صحيح"
    });

  } catch (error) {
    console.error('❌ خطأ في التحقق من الرمز:', error);
    res.status(500).json({ valid: false, message: "حدث خطأ أثناء التحقق من الرمز" });
  }
});

// Password reset completion handled locally instead of Auth0

// Setup session and passport
app.use(getSession());
app.use(passport.initialize());
app.use(passport.session());
setupLocalAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
