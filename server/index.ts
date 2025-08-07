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
app.get('/api/validate-reset-token/:token', async (req, res) => {
  try {
    const { validateResetToken } = await import("./email-service");
    const { token } = req.params;
    
    const email = validateResetToken(token);
    
    if (email) {
      res.json({ valid: true, email });
    } else {
      res.status(400).json({ valid: false, message: "رابط غير صالح أو منتهي الصلاحية" });
    }
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ valid: false, message: "خطأ في التحقق من الرابط" });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "التوكن وكلمة المرور الجديدة مطلوبان" });
    }
    
    const { validateResetToken, deleteResetToken } = await import("./email-service");
    const { storage } = await import("./storage");
    
    const email = validateResetToken(token);
    
    if (!email) {
      return res.status(400).json({ message: "رابط غير صالح أو منتهي الصلاحية" });
    }
    
    // تحديث كلمة المرور في قاعدة البيانات
    const success = await storage.updateUserPassword(email, newPassword);
    
    if (success) {
      deleteResetToken(token);
      console.log('✅ تم تحديث كلمة المرور بنجاح للمستخدم:', email);
      res.json({ success: true, message: "تم تحديث كلمة المرور بنجاح" });
    } else {
      res.status(400).json({ message: "فشل في تحديث كلمة المرور" });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: "خطأ في إعادة تعيين كلمة المرور" });
  }
});

// Password reset routes (before middleware)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
    }

    console.log('🔐 طلب إعادة تعيين كلمة المرور للإيميل:', email);

    // Import email service and storage
    const { emailService, generateResetToken } = await import("./email-service");
    const { storage } = await import("./storage");
    
    // Always return success message for security
    const successMessage = "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني";

    // Check if user exists in database first
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const localUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (localUser && localUser.length > 0) {
      console.log('✅ المستخدم موجود في قاعدة البيانات المحلية');
      
      try {
        // إنشاء توكن إعادة التعيين
        const token = generateResetToken(email);
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        
        console.log('🔗 رابط إعادة التعيين:', resetLink);
        
        // محاولة إرسال البريد الإلكتروني إذا كان معداً
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
          emailService.configure({
            from: process.env.GMAIL_USER,
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
          });
          
          const result = await emailService.sendPasswordReset(email, resetLink);
          console.log('📧 ✅ تم إرسال رسالة إعادة تعيين كلمة المرور بنجاح!');
        } else {
          console.log('⚠️ إعدادات Gmail غير موجودة - الرابط جاهز للاستخدام اليدوي');
          console.log('🔗 استخدم هذا الرابط لإعادة التعيين:', resetLink);
        }
        
      } catch (error) {
        console.error('❌ خطأ في إرسال رسالة البريد:', error);
        console.log('📋 يمكن إعداد Gmail SMTP للحصول على رسائل فعلية');
      }
    } else {
      console.log('⚠️ المستخدم غير موجود في قاعدة البيانات المحلية');
    }

    // Always return success for security (don't reveal if email exists or if Auth0 failed)
    res.json({ 
      success: true, 
      message: successMessage
    });

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({ message: "حدث خطأ أثناء معالجة طلبك" });
  }
});

// Password reset completion handled by Auth0 directly

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
