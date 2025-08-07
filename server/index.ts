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

    // Import storage and email service
    const { storage } = await import("./storage");
    const { emailService } = await import("./email-service");
    
    // Check if user exists in our database
    const user = await storage.getUserByEmailAddress(email);
    
    // Always return success message for security (don't reveal if email exists)
    const successMessage = "إذا كان البريد الإلكتروني مسجل لدينا، ستصلك رسالة إعادة تعيين كلمة المرور";

    if (!user) {
      console.log('⚠️ البريد الإلكتروني غير مسجل:', email);
      return res.json({ 
        success: true, 
        message: successMessage
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    await storage.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetTokenExpiry.toISOString()
    });

    console.log('🔑 تم إنشاء رمز إعادة التعيين:', { userId: user.id, resetToken: resetToken.substring(0, 8) + '...' });

    // Generate reset URL
    const resetUrl = `${req.get('host') ? `http://${req.get('host')}` : 'http://localhost:5000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // Try to send email if email service is configured
    let emailSent = false;
    if (emailService.isConfigured()) {
      try {
        emailSent = await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);
      } catch (error) {
        console.error('❌ فشل في إرسال البريد الإلكتروني:', error);
      }
    }

    if (emailSent) {
      res.json({ 
        success: true, 
        message: "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
      });
    } else {
      res.json({ 
        success: true, 
        message: "تم إنشاء رابط إعادة تعيين كلمة المرور",
        resetUrl, // Remove in production when email service is working
        resetToken // For testing purposes
      });
    }

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({ message: "حدث خطأ أثناء معالجة طلبك" });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: "جميع البيانات مطلوبة" });
    }

    console.log('🔐 محاولة إعادة تعيين كلمة المرور:', { email, token: token.substring(0, 8) + '...' });

    // Import storage and bcrypt here to avoid circular dependency
    const { storage } = await import("./storage");
    const bcrypt = await import("bcryptjs");

    // Find user by email and validate reset token
    const user = await storage.getUserByEmailAddress(email);
    if (!user) {
      return res.status(400).json({ message: "رمز إعادة التعيين غير صحيح أو منتهي الصلاحية" });
    }

    // Check if token matches and hasn't expired
    if (user.passwordResetToken !== token) {
      return res.status(400).json({ message: "رمز إعادة التعيين غير صحيح" });
    }

    if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
      return res.status(400).json({ message: "رمز إعادة التعيين منتهي الصلاحية" });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    await storage.updateUser(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null
    });

    console.log('✅ تم تحديث كلمة المرور للمستخدم:', user.id);

    res.json({ 
      success: true, 
      message: "تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول" 
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث كلمة المرور:', error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث كلمة المرور" });
  }
});

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
