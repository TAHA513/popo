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

    // Import Auth0 functions and storage
    const { sendPasswordResetEmail } = await import("./auth0-config");
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
        // Send password reset email via Auth0 directly
        console.log('🔍 إرسال رسالة إعادة التعيين عبر Auth0...');
        const resetResult = await sendPasswordResetEmail(email);
        
        if (resetResult && resetResult.success) {
          console.log('✅ تم إرسال رسالة إعادة التعيين عبر Auth0 بنجاح!');
        }
        
      } catch (error) {
        console.error('❌ خطأ في إرسال رسالة Auth0:', error);
      }
    } else {
      console.log('⚠️ المستخدم غير موجود في قاعدة البيانات المحلية');
      
      // Still try Auth0 for security (don't reveal if user exists locally)
      try {
        console.log('🔍 إرسال رسالة إعادة التعيين عبر Auth0...');
        await sendPasswordResetEmail(email);
      } catch (error) {
        console.error('❌ خطأ في إرسال رسالة Auth0:', error);
      }
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
