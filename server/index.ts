import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { clerk, sendPasswordResetEmail } from "./clerk-config.js";
import { requireAuth, optionalAuth } from "./middleware/clerkAuth.js";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for proper session handling
app.use(express.json({ limit: '10mb' })); // Increase limit for voice messages
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Password reset routes (now using Clerk)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
    }

    console.log('🔐 طلب إعادة تعيين كلمة المرور للإيميل:', email);

    // Use Clerk for password reset
    const result = await sendPasswordResetEmail(email);
    
    if (result.success) {
      console.log('📧 ✅ تم إرسال رسالة إعادة تعيين كلمة المرور بنجاح!');
      return res.status(200).json({ 
        message: "إذا كان هذا البريد الإلكتروني مسجلاً في النظام، ستتلقى رسالة إعادة تعيين كلمة المرور" 
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({ message: "حدث خطأ أثناء معالجة طلبك" });
  }
});

// Use Clerk middleware instead of session/passport
app.use(optionalAuth);

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
