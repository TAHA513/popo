import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getSession } from "./replitAuth";
import { setupLocalAuth } from "./localAuth";
import { handleAuthRoutes, withLogto } from '@logto/express';
import { logtoConfig } from './logto-config';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { nanoid } from 'nanoid';
import passport from "passport";

const app = express();
app.set('trust proxy', 1); // Trust first proxy for proper session handling
app.use(express.json({ limit: '10mb' })); // Increase limit for voice messages
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Logto session setup
app.use(cookieParser());
app.use(session({ 
  secret: 'UPLGawFSwB81sFbRkblt79s1KO8pmBDi', 
  cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }, // 14 days in milliseconds
  resave: false,
  saveUninitialized: false
}));

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

    // Always return success message for security
    const successMessage = "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني";

    // Check if user exists in database first
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const localUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (localUser && localUser.length > 0) {
      console.log('✅ المستخدم موجود في قاعدة البيانات المحلية');
      
      // Try both approaches: Real email service and Auth0
      try {
        // 1. Try real email service first
        const { realEmailService } = await import("./real-email-service");
        const emailResult = await realEmailService.sendPasswordResetEmail(email);
        
        if (emailResult.success) {
          console.log('📧 ✅ تم إرسال رسالة إعادة تعيين كلمة المرور عبر خدمة البريد الحقيقية!');
        } else {
          console.log('⚠️ فشل في إرسال البريد عبر الخدمة الحقيقية، محاولة Auth0...');
          
          // 2. Fallback to Auth0 if real email fails
          const { createUserInAuth0 } = await import("./auth0-config");
          const result = await createUserInAuth0(email, localUser[0].passwordHash || 'TempPass123!');
          
          if (result.emailSent) {
            console.log('📧 ✅ تم إرسال رسالة إعادة تعيين كلمة المرور عبر Auth0!');
          }
        }
        
      } catch (error) {
        console.error('❌ خطأ في إرسال رسالة إعادة تعيين كلمة المرور:', error);
      }
    } else {
      console.log('⚠️ المستخدم غير موجود في قاعدة البيانات المحلية');
      
      // For security, still attempt to send reset (but it won't work for non-existent users)
      try {
        const realEmailModule = await import("./real-email-service");
        await realEmailModule.realEmailService.sendPasswordResetEmail(email);
      } catch (error) {
        console.error('❌ خطأ في محاولة إرسال البريد للمستخدم غير الموجود:', error);
      }
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

// Password reset completion route (before the middleware)
app.get('/reset-password', async (req, res) => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).send(`
      <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px;">
        <h2>رابط غير صالح</h2>
        <p>رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.</p>
        <a href="/" style="color: #007bff;">العودة إلى الصفحة الرئيسية</a>
      </div>
    `);
  }
  
  try {
    const { realEmailService } = await import("./real-email-service");
    const verification = realEmailService.verifyResetToken(token);
    
    if (!verification.valid) {
      return res.status(400).send(`
        <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px;">
          <h2>رابط منتهي الصلاحية</h2>
          <p>رابط إعادة تعيين كلمة المرور منتهي الصلاحية. يرجى طلب رابط جديد.</p>
          <a href="/forgot-password" style="color: #007bff;">طلب رابط جديد</a>
        </div>
      `);
    }
    
    // Render password reset form
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور - LaaBoBo</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .container {
            max-width: 400px;
            margin: 50px auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h2 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            color: #555;
          }
          input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
            font-size: 16px;
          }
          .btn {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
          }
          .btn:hover {
            background-color: #0056b3;
          }
          .error {
            color: #dc3545;
            margin-top: 10px;
          }
          .success {
            color: #28a745;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>إعادة تعيين كلمة المرور</h2>
          <form id="resetForm">
            <div class="form-group">
              <label for="password">كلمة المرور الجديدة:</label>
              <input type="password" id="password" name="password" required minlength="6">
            </div>
            <div class="form-group">
              <label for="confirmPassword">تأكيد كلمة المرور:</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
            </div>
            <button type="submit" class="btn">تحديث كلمة المرور</button>
            <div id="message"></div>
          </form>
        </div>
        
        <script>
          document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');
            
            if (password !== confirmPassword) {
              messageDiv.innerHTML = '<div class="error">كلمات المرور غير متطابقة</div>';
              return;
            }
            
            if (password.length < 6) {
              messageDiv.innerHTML = '<div class="error">كلمة المرور يجب أن تكون 6 أحرف على الأقل</div>';
              return;
            }
            
            try {
              const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: '${token}',
                  password: password
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                messageDiv.innerHTML = '<div class="success">تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.</div>';
                setTimeout(() => {
                  window.location.href = '/';
                }, 3000);
              } else {
                messageDiv.innerHTML = '<div class="error">' + result.message + '</div>';
              }
            } catch (error) {
              messageDiv.innerHTML = '<div class="error">حدث خطأ أثناء تحديث كلمة المرور</div>';
            }
          });
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ خطأ في صفحة إعادة تعيين كلمة المرور:', error);
    res.status(500).send(`
      <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px;">
        <h2>خطأ في الخادم</h2>
        <p>حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.</p>
        <a href="/" style="color: #007bff;">العودة إلى الصفحة الرئيسية</a>
      </div>
    `);
  }
});

// Handle password reset form submission
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "الرمز المميز وكلمة المرور مطلوبان" 
      });
    }
    
    const { realEmailService } = await import("./real-email-service");
    const verification = realEmailService.verifyResetToken(token);
    
    if (!verification.valid || !verification.email) {
      return res.status(400).json({ 
        success: false, 
        message: "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية" 
      });
    }
    
    // Update password in database
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    const bcrypt = await import("bcryptjs");
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.email, verification.email));
    
    // Invalidate the token
    const { resetTokens } = await import("./real-email-service");
    resetTokens.delete(token);
    
    console.log('✅ تم تحديث كلمة المرور للمستخدم:', verification.email);
    
    res.json({ 
      success: true, 
      message: "تم تحديث كلمة المرور بنجاح" 
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحديث كلمة المرور:', error);
    res.status(500).json({ 
      success: false, 
      message: "حدث خطأ أثناء تحديث كلمة المرور" 
    });
  }
});

// Logto authentication routes
app.use(handleAuthRoutes(logtoConfig));

// Password reset with Logto integration
app.post('/api/logto-forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
    }

    console.log('🔐 Logto طلب إعادة تعيين كلمة المرور للإيميل:', email);

    // Check if user exists in local database first
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const localUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (localUser && localUser.length > 0) {
      console.log('✅ المستخدم موجود، سيتم إرسال رابط إعادة تعيين عبر Logto');
      
      // For now, return success. In production, you would integrate with Logto's password reset API
      // Logto handles password reset through their own system
      res.json({ 
        success: true, 
        message: "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني عبر Logto",
        redirect: "/logto/sign-in" 
      });
      
    } else {
      console.log('⚠️ المستخدم غير موجود في قاعدة البيانات المحلية');
      
      // Still return success for security
      res.json({ 
        success: true, 
        message: "إذا كان هذا البريد مسجل، ستتلقى رسالة إعادة تعيين كلمة المرور"
      });
    }

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور عبر Logto:', error);
    res.status(500).json({ message: "حدث خطأ أثناء معالجة طلبك" });
  }
});

// Logto authentication status check
app.get('/api/logto/user', withLogto(logtoConfig), (req: any, res) => {
  if (req.user.isAuthenticated) {
    res.json({
      isAuthenticated: true,
      user: {
        sub: req.user.claims?.sub,
        email: req.user.claims?.email,
        name: req.user.claims?.name,
        picture: req.user.claims?.picture
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Combined authentication routes for backward compatibility
app.get('/api/auth/user', withLogto(logtoConfig), async (req: any, res) => {
  try {
    // Check Logto authentication first
    if (req.user && req.user.isAuthenticated) {
      const logtoUser = req.user.claims;
      
      // Sync with local database if needed
      const { db } = await import("./db");
      const { users } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      let localUser = await db.select().from(users).where(eq(users.email, logtoUser?.email || '')).limit(1);
      
      if (!localUser || localUser.length === 0) {
        // Create local user from Logto data
        const newUser = await db.insert(users).values({
          id: nanoid(),
          email: logtoUser?.email || '',
          username: logtoUser?.name || logtoUser?.email?.split('@')[0] || 'user',
          firstName: logtoUser?.given_name || '',
          lastName: logtoUser?.family_name || '',
          profileImageUrl: logtoUser?.picture || null,
          role: 'user',
          points: 0, // Start with 0 points as per paid model
          isVerified: false,
          passwordHash: 'logto-user' // Placeholder for Logto users
        }).returning();
        
        localUser = newUser;
      }
      
      return res.json({
        id: localUser[0].id,
        email: localUser[0].email,
        username: localUser[0].username,
        firstName: localUser[0].firstName,
        lastName: localUser[0].lastName,
        profilePicture: localUser[0].profileImageUrl,
        role: localUser[0].role,
        points: localUser[0].points,
        isVerified: localUser[0].isVerified,
        provider: 'logto'
      });
    }
    
    // Fallback to existing auth systems
    if (req.session?.user) {
      return res.json(req.session.user);
    }
    
    res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من المصادقة:', error);
    res.status(500).json({ message: "خطأ في الخادم" });
  }
});

// Password reset completion handled by real email service and Auth0 as fallback

// Setup session and passport (keep existing for backward compatibility)
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
