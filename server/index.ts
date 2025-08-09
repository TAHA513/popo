import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getSession } from "./replitAuth";
import { setupLocalAuth } from "./localAuth";
import passport from "passport";
import fs from 'fs';
import path from 'path';

const app = express();
app.set('trust proxy', 1); // Trust first proxy for proper session handling
app.set('etag', false); // Disable ETags to prevent 304 responses for API endpoints
app.use(express.json({ limit: '10mb' })); // Increase limit for voice messages
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cross-platform file serving with automatic fallback
app.use('/uploads', async (req, res, next) => {
  const requestedFile = req.path;
  const localFilePath = path.join(process.cwd(), 'uploads', requestedFile);
  
  // First try to serve file locally
  if (fs.existsSync(localFilePath)) {
    return express.static('uploads')(req, res, next);
  }
  
  // If file doesn't exist locally, try to fetch from alternative platforms
  const alternativeUrls = [
    `https://laabolive.replit.app/uploads${requestedFile}`,
    `https://laabo-render.onrender.com/uploads${requestedFile}`,
    // Add direct file access with different encoding
    `https://laabolive.replit.app/uploads/${encodeURIComponent(requestedFile.substring(1))}`,
    `https://laabo-render.onrender.com/uploads/${encodeURIComponent(requestedFile.substring(1))}`
  ];
  
  console.log(`🔍 File not found locally: ${requestedFile}, trying alternatives...`);
  
  for (const url of alternativeUrls) {
    try {
      console.log(`📥 Attempting to fetch: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Found file at: ${url}`);
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Cache the file locally for future requests
        try {
          await fs.promises.writeFile(localFilePath, Buffer.from(buffer));
          console.log(`💾 Cached file locally: ${localFilePath}`);
        } catch (cacheError) {
          console.log(`⚠️ Could not cache file: ${cacheError}`);
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(Buffer.from(buffer));
        return;
      }
    } catch (error: any) {
      console.log(`❌ Failed to fetch from ${url}:`, error?.message || 'Unknown error');
    }
  }
  
  console.log(`❌ File not found on any platform: ${requestedFile}`);
  res.status(404).send('File not found');
});

// Disable caching for all API endpoints to ensure fresh data
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Last-Modified', new Date().toUTCString());
  next();
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
