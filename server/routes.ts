import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./localAuth";
import { sql } from "drizzle-orm";
import { users, insertMemoryFragmentSchema, insertMemoryInteractionSchema, registerSchema, loginSchema, insertCommentSchema, insertCommentLikeSchema, comments, commentLikes } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import bcrypt from "bcryptjs";
import passport from "passport";
// @ts-ignore
import { checkSuperAdmin } from "./middleware/checkSuperAdmin.js";
import { trackUserActivity, cleanupStaleOnlineUsers } from "./middleware/activityTracker";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import fs from 'fs/promises';
import { setupMessageRoutes } from './routes/messages';
import { updateSupporterLevel, updateGiftsReceived } from './supporter-system';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
}

const connectedClients = new Map<string, ConnectedClient>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize gift characters
  await initializeGiftCharacters();
  
  // Setup activity tracking for all authenticated routes
  app.use('/api', trackUserActivity);
  
  // Setup periodic cleanup of stale online users (every 2 minutes)
  setInterval(cleanupStaleOnlineUsers, 2 * 60 * 1000);
  
  // Setup message routes
  setupMessageRoutes(app);

  // Local authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username is available
      const isAvailable = await storage.isUsernameAvailable(validatedData.username);
      if (!isAvailable) {
        return res.status(400).json({ message: "اسم المستخدم غير متاح" });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

      // Create user
      const userData = {
        username: validatedData.username,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        passwordHash: passwordHash,
        bio: null,
        profileImageUrl: null,
        points: 100, // Starting points
        totalEarnings: "0",
        totalGiftsReceived: "0",
        totalGiftsSent: "0",
        supporterLevel: 0,
        supporterBadge: null,
        isStreamer: false,
        isAdmin: false,
        role: "user" as const,
        isPrivateAccount: false,
        allowDirectMessages: true,
        allowGiftsFromStrangers: true,
        showLastSeen: true,
        isOnline: false
      };

      const user = await storage.createUser(userData);
      
      res.status(201).json({ 
        message: 'تم إنشاء الحساب بنجاح',
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: error.errors[0]?.message || "بيانات غير صالحة" 
        });
      }
      res.status(500).json({ message: "خطأ في إنشاء الحساب" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      // Store user in session
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      };

      res.json({ 
        message: 'تم تسجيل الدخول بنجاح',
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: error.errors[0]?.message || "بيانات غير صالحة" 
        });
      }
      res.status(500).json({ message: "خطأ في تسجيل الدخول" });
    }
  });

  app.post('/api/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    const user = (req as any).session?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: "غير مصرح" });
    }
  });

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // Don't return sensitive information
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المستخدم" });
    }
  });

  app.patch('/api/users/me', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      // Don't allow updating sensitive fields
      const { id, passwordHash, createdAt, updatedAt, ...allowedUpdates } = updates;
      
      const updatedUser = await storage.updateUser(userId, allowedUpdates);
      const { passwordHash: _, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "خطأ في تحديث بيانات المستخدم" });
    }
  });

  app.post('/api/users/me/profile-image', requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      // Save image file
      const fileName = `profile-${userId}-${Date.now()}-${file.originalname}`;
      const filePath = path.join('uploads', fileName);
      
      await fs.rename(file.path, filePath);
      const imageUrl = `/uploads/${fileName}`;
      
      // Update user profile
      await storage.updateUser(userId, { profileImageUrl: imageUrl });
      
      res.json({ 
        message: 'Profile image updated successfully',
        profileImageUrl: imageUrl 
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Live streaming endpoints
  app.get('/api/streams', async (req, res) => {
    try {
      // Simple in-memory streams for demo
      const activeStreams = (global as any).activeStreams || {};
      const streamsList = Object.values(activeStreams).map((stream: any) => ({
        ...stream,
        viewerCount: Math.floor(Math.random() * 50) + 5
      }));
      res.json(streamsList);
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ message: "Failed to fetch streams" });
    }
  });

  app.post('/api/streams', async (req: any, res) => {
    try {
      console.log('Stream creation request:', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? req.user.id : 'none',
        body: req.body
      });

      // Check authentication manually
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const userId = req.user.id;
      const user = req.user;
      const { title, category } = req.body;
      
      // Initialize global streams if not exists
      if (!(global as any).activeStreams) {
        (global as any).activeStreams = {};
      }
      
      const streamData = {
        id: Date.now(),
        hostId: userId,
        hostName: user.username || user.firstName || 'مستخدم',
        hostAvatar: '🐰',
        title: title || 'بث مباشر',
        category: category || 'general',
        isActive: true,
        viewerCount: 1,
        createdAt: new Date().toISOString()
      };

      // Store in global memory
      (global as any).activeStreams[userId] = streamData;
      
      console.log('Stream created successfully:', streamData);
      res.json(streamData);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  app.post('/api/streams/end', async (req: any, res) => {
    try {
      // Check authentication manually
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const userId = req.user.id;
      
      // Remove from global memory
      if ((global as any).activeStreams && (global as any).activeStreams[userId]) {
        delete (global as any).activeStreams[userId];
        console.log('Stream ended for user:', userId);
      }
      
      res.json({ message: "Stream ended successfully" });
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ message: "Failed to end stream" });
    }
  });

  // Memory fragments routes
  app.post('/api/memories', requireAuth, upload.array('media', 5), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, caption, memoryType, visibilityLevel, allowComments, allowSharing, allowGifts } = req.body;
      
      // Process uploaded files
      const mediaUrls: string[] = [];
      const files = req.files as Express.Multer.File[];
      
      if (files && files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join('uploads', fileName);
          
          await fs.rename(file.path, filePath);
          mediaUrls.push(`/uploads/${fileName}`);
        }
      }

      // Create memory fragment
      const memoryData = {
        authorId: userId,
        type: files?.[0]?.mimetype?.startsWith('video') ? 'video' : 'image',
        title: title || '',
        caption: caption || '',
        mediaUrls,
        thumbnailUrl: mediaUrls[0] || null,
        memoryType: memoryType || 'star',
        visibilityLevel: visibilityLevel || 'public',
        allowComments: allowComments !== 'false',
        allowSharing: allowSharing !== 'false',
        allowGifts: allowGifts !== 'false',
        currentEnergy: 100,
        initialEnergy: 100,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        giftCount: 0,
      };

      const memory = await storage.createMemoryFragment(memoryData);
      res.json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(500).json({ message: "Failed to create memory" });
    }
  });

  app.get('/api/memories/user/:userId?', requireAuth, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId || req.user.id;
      const memories = await storage.getUserMemoryFragments(targetUserId);
      
      res.json(memories);
    } catch (error) {
      console.error("Error fetching user memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.get('/api/memories/public', async (req, res) => {
    try {
      const memories = await storage.getPublicMemoryFragments();
      res.json(memories);
    } catch (error) {
      console.error("Error fetching public memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.get('/api/memories/:id', async (req, res) => {
    try {
      const memory = await storage.getMemoryFragmentById(parseInt(req.params.id));
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }
      res.json(memory);
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  app.post('/api/memories/:id/interactions', requireAuth, async (req: any, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      const { type, giftCharacterId } = req.body;
      
      const interactionData = {
        userId: req.user.id,
        memoryFragmentId: memoryId,
        type,
        giftCharacterId: giftCharacterId || null,
      };

      const interaction = await storage.addMemoryInteraction(interactionData);
      res.json(interaction);
    } catch (error) {
      console.error("Error adding memory interaction:", error);
      res.status(500).json({ message: "Failed to add interaction" });
    }
  });

  // Gift characters route
  app.get('/api/gifts/characters', async (req, res) => {
    try {
      const characters = await storage.getGiftCharacters();
      res.json(characters);
    } catch (error) {
      console.error("Error fetching gift characters:", error);
      res.status(500).json({ message: "Failed to fetch gift characters" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAppStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Serve static files
  const expressModule = await import('express');
  app.use('/uploads', expressModule.static('uploads'));
  
  // Serve HTML files from public directory
  app.use(expressModule.static('public'));

  // ZEGO Token endpoint for secure authentication  
  app.get('/api/zego/token', async (req: any, res) => {
    try {
      console.log('ZEGO Token request:', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, username: req.user.username } : null,
        sessionID: req.sessionID,
        session: req.session ? Object.keys(req.session) : null,
        passport: req.session?.passport
      });

      // Check session authentication (custom auth system)
      let userId = null;
      let user = null;
      
      if (req.user?.id) {
        userId = req.user.id;
        user = req.user;
      } else if (req.session?.user?.id) {
        // Custom session auth system
        userId = req.session.user.id;
        user = req.session.user;
        req.user = user; // Set for consistency
      }

      console.log('Auth check result:', {
        sessionUser: req.session?.user ? { id: req.session.user.id, username: req.session.user.username } : null,
        finalUserId: userId,
        hasUser: !!user
      });

      if (!userId || !user) {
        return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
      }

      const { generateZegoToken } = await import('./zego-token');
      const appId = parseInt(process.env.VITE_ZEGOCLOUD_APP_ID || '1034062164');
      const serverSecret = process.env.ZEGO_SERVER_SECRET;
      
      if (!serverSecret) {
        return res.status(500).json({ message: 'ZEGO Server Secret not configured' });
      }

      const token = generateZegoToken(appId, serverSecret, userId);
      
      console.log('ZEGO Token generated successfully for user:', userId);
      
      res.json({ 
        token,
        appId,
        userId,
        expires: Math.floor(Date.now() / 1000) + 7200 // 2 hours
      });
    } catch (error) {
      console.error('Error generating ZEGO token:', error);
      res.status(500).json({ message: 'Failed to generate authentication token' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const server = createServer(app);
  
  return server;
}

// Initialize gift characters if they don't exist
async function initializeGiftCharacters() {
  try {
    const existingCharacters = await storage.getGiftCharacters();
    if (existingCharacters.length === 0) {
      console.log("No gift characters found, initializing default ones...");
      // Gift characters can be initialized here if needed
    }
  } catch (error) {
    console.error("Error checking gift characters:", error);
  }
}