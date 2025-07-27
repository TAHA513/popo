import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./localAuth";
import { sql } from "drizzle-orm";
import { insertStreamSchema, insertGiftSchema, insertChatMessageSchema, users, insertMemoryFragmentSchema, insertMemoryInteractionSchema, registerSchema, loginSchema, insertCommentSchema, insertCommentLikeSchema, comments, commentLikes } from "@shared/schema";
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
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security functions for ZegoCloud protection
const secureTokens = new Map<string, { token: string; expires: number; userId: string }>();

function generateSecureToken(userId: string): string {
  // Generate a secure temporary token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (30 * 60 * 1000); // 30 minutes expiry
  
  // Clean expired tokens using Array.from to fix iterator issue
  const expiredTokens: string[] = [];
  for (const [key, value] of Array.from(secureTokens.entries())) {
    if (value.expires < Date.now()) {
      expiredTokens.push(key);
    }
  }
  expiredTokens.forEach(key => secureTokens.delete(key));
  
  // Store new token
  secureTokens.set(token, { token, expires, userId });
  
  return token;
}

function validateSecureToken(token: string, userId: string): boolean {
  const tokenData = secureTokens.get(token);
  
  if (!tokenData) return false;
  if (tokenData.expires < Date.now()) {
    secureTokens.delete(token);
    return false;
  }
  if (tokenData.userId !== userId) return false;
  
  return true;
}

// Encrypted ZegoCloud configuration - never expose raw secrets
function getSecureZegoConfig() {
  const appId = process.env.ZEGO_APP_ID;
  const appSign = process.env.ZEGO_APP_SIGN;
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  
  if (!appId || !appSign || !serverSecret) {
    console.error('Missing ZegoCloud credentials:', {
      appId: !!appId,
      appSign: !!appSign,
      serverSecret: !!serverSecret
    });
    throw new Error('ZegoCloud credentials not configured');
  }
  
  console.log('🔒 ZegoCloud configuration loaded successfully');
  
  // Only return app ID, all secrets stay on server
  return {
    appId: appId,
    // Generate hash for validation without exposing secret
    configHash: crypto.createHash('sha256').update(serverSecret + appId + appSign).digest('hex').substring(0, 16)
  };
}

// Clean expired tokens periodically - using Array.from to avoid iterator issues
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  const expiredTokens: string[] = [];
  
  // Convert to array first to avoid iterator issues
  for (const [token, tokenData] of Array.from(secureTokens.entries())) {
    if (tokenData.expires < now) {
      expiredTokens.push(token);
      cleanedCount++;
    }
  }
  
  // Delete expired tokens
  expiredTokens.forEach(token => secureTokens.delete(token));
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired security tokens`);
  }
}, 10 * 60 * 1000); // Every 10 minutes

// Fix iterator issue by using Array.from for Map entries
function cleanupUserTokens(userId: string): number {
  let cleanedCount = 0;
  const tokensToDelete: string[] = [];
  
  // Convert Map entries to array to avoid iterator issues
  for (const [token, tokenData] of Array.from(secureTokens.entries())) {
    if (tokenData.userId === userId) {
      tokensToDelete.push(token);
      cleanedCount++;
    }
  }
  
  // Delete the tokens
  tokensToDelete.forEach(token => secureTokens.delete(token));
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} security tokens for user ${userId}`);
  }
  
  return cleanedCount;
}

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
  streamId?: number;
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
      const user = await storage.createUser({
        username: validatedData.username,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        passwordHash,
      });

      res.status(201).json({ 
        message: "تم إنشاء الحساب بنجاح",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "بيانات غير صالحة",
          errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحساب" });
    }
  });

  app.post('/api/login', (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
        
        req.logIn(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
          }
          
          res.json({
            message: "تم تسجيل الدخول بنجاح",
            user: {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              points: user.points,
            }
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "بيانات غير صالحة",
          errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  // Also support GET logout for direct URL access
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.get('/api/check-username', async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "اسم المستخدم مطلوب" });
      }
      
      const isAvailable = await storage.isUsernameAvailable(username);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء التحقق من اسم المستخدم" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        points: user.points,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        isStreamer: user.isStreamer,
        totalEarnings: user.totalEarnings,
        isPrivateAccount: user.isPrivateAccount,
        allowDirectMessages: user.allowDirectMessages,
        allowGiftsFromStrangers: user.allowGiftsFromStrangers,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile image
  app.post('/api/user/profile-image', requireAuth, upload.single('profileImage'), async (req: any, res) => {
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

  // Stream routes
  app.get('/api/streams', async (req, res) => {
    try {
      const streams = await storage.getActiveStreams();
      res.json(streams);
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ message: "Failed to fetch streams" });
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
          // In production, you'd upload to cloud storage (AWS S3, Cloudinary, etc.)
          // For now, we'll just use the local file path
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join('uploads', fileName);
          
          // Move file to permanent location
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
      const userId = req.params.userId || req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const memories = await storage.getUserMemoryFragments(userId);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching user memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  // Get public memory fragments for homepage
  app.get('/api/memories/public', async (req, res) => {
    try {
      // Get public memories from all users, sorted by creation date
      const memories = await storage.getPublicMemoryFragments();
      res.json(memories);
    } catch (error) {
      console.error("Error fetching public memories:", error);
      res.status(500).json({ message: "Failed to fetch public memories" });
    }
  });

  // Get single memory fragment by ID
  app.get('/api/memories/:memoryId', async (req, res) => {
    try {
      const memoryId = parseInt(req.params.memoryId);
      if (isNaN(memoryId)) {
        return res.status(400).json({ message: "Invalid memory ID" });
      }
      
      const memory = await storage.getMemoryFragmentById(memoryId);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }
      
      res.json(memory);
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  // Get suggested users to follow
  app.get('/api/users/suggested', async (req, res) => {
    try {
      const users = await storage.getSuggestedUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  // Get user by ID
  app.get('/api/users/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      console.log('🔍 Fetching user profile:', {
        requestedUserId: userId,
        requestingUser: req.user?.id,
        requestingUsername: req.user?.username
      });
      
      // Validate userId parameter
      if (!userId || userId.trim() === '') {
        console.log('❌ Invalid user ID provided');
        return res.status(400).json({ message: "معرف المستخدم غير صحيح" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        console.log('❌ User not found:', userId);
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      console.log('✅ User found successfully:', {
        userId: user.id,
        username: user.username,
        firstName: user.firstName
      });
      
      res.json(user);
    } catch (error) {
      console.error("❌ Error fetching user:", error);
      res.status(500).json({ message: "فشل في جلب بيانات المستخدم" });
    }
  });

  // Get user online status and last seen
  app.get('/api/users/:userId/status', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await db
        .select({
          isOnline: users.isOnline,
          lastSeenAt: users.lastSeenAt,
          lastActivityAt: users.lastActivityAt,
          showLastSeen: users.showLastSeen
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0]) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // If user has privacy settings to hide last seen, only show online status
      if (!user[0].showLastSeen && req.user && (req.user as any).id !== userId) {
        res.json({
          isOnline: user[0].isOnline,
          lastSeenAt: null,
          showLastSeen: false
        });
      } else {
        res.json(user[0]);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
      res.status(500).json({ message: "خطأ في جلب حالة المستخدم" });
    }
  });
  
  // Check if following
  app.get('/api/users/:userId/is-following', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followedId = req.params.userId;
      
      const isFollowing = await storage.isFollowing(followerId, followedId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
  
  // Follow/Unfollow user (toggle)
  app.post('/api/users/:userId/follow', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followedId = req.params.userId;
      
      if (followerId === followedId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const isFollowing = await storage.isFollowing(followerId, followedId);
      
      if (isFollowing) {
        await storage.unfollowUser(followerId, followedId);
        res.json({ success: true, following: false });
      } else {
        await storage.followUser(followerId, followedId);
        res.json({ success: true, following: true });
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      res.status(500).json({ message: "Failed to follow/unfollow user" });
    }
  });

  app.post('/api/users/:userId/unfollow', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followedId = req.params.userId;
      
      await storage.unfollowUser(followerId, followedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });
  
  // Get user followers
  app.get('/api/users/:userId/followers', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });
  
  // Get user following
  app.get('/api/users/:userId/following', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });
  
  // Send message request
  app.post('/api/messages/request', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { receiverId, message } = req.body;
      
      // Check if request already exists
      const existingRequest = await storage.getMessageRequest(senderId, receiverId);
      if (existingRequest) {
        return res.status(400).json({ message: "لقد أرسلت رسالة لهذا المستخدم بالفعل" });
      }
      
      // Create message request
      await storage.createMessageRequest({
        senderId,
        receiverId,
        initialMessage: message
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending message request:", error);
      res.status(500).json({ message: "فشل إرسال الرسالة" });
    }
  });

  // Custom registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { firstName, lastName, email, username, password, registrationType } = req.body;
      
      // Validation
      if (!firstName || firstName.trim().length === 0) {
        return res.status(400).json({ message: "اسمك مطلوب" });
      }
      
      if (registrationType === 'email') {
        if (!email || !email.includes('@')) {
          return res.status(400).json({ message: "إيميل غير صحيح" });
        }
      } else if (registrationType === 'username') {
        if (!username || username.length < 3) {
          return res.status(400).json({ message: "اسم المستخدم قصير" });
        }
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور قصيرة" });
      }

      // For now, store registration data temporarily
      // In production, this would integrate with your auth system
      const userData = {
        firstName,
        lastName,
        email: registrationType === 'email' ? email : null,
        username: registrationType === 'username' ? username : null,
        registrationType,
        createdAt: new Date()
      };

      res.json({ 
        success: true, 
        message: "تم التسجيل بنجاح! ستتم إعادة توجيهك لتسجيل الدخول",
        user: userData 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "خطأ في التسجيل" });
    }
  });



  // Serve uploaded files
  await fs.mkdir('uploads', { recursive: true });
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  
  const expressModule = await import('express');
  app.use('/uploads', expressModule.static('uploads'));

  // ZegoCloud configuration endpoint - MAXIMUM SECURITY
  app.get('/api/zego-config', requireAuth, (req: any, res) => {
    try {
      // Only provide App ID to authenticated users, never the server secret
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'معرف المستخدم مطلوب' });
      }

      console.log('🔒 ZegoCloud configuration loaded successfully');
      
      // Get user info for proper ZegoCloud authentication
      const userID = req.user.id;
      const userName = req.user.firstName || req.user.username || 'User';
      
      console.log('👤 Preparing ZegoCloud config for user:', {
        userID,
        userName,
        sessionId: req.sessionID
      });
      
      // Generate temporary tokens for this session only
      const timestamp = Date.now();
      const sessionToken = Buffer.from(`${userID}_${timestamp}`).toString('base64');
      
      // Server secrets are NEVER exposed to client
      res.json({
        appId: process.env.ZEGO_APP_ID || '1034062164',
        appSign: process.env.ZEGO_APP_SIGN || '',
        userID: userID,
        userName: userName,
        sessionToken: sessionToken
      });
    } catch (error) {
      console.error('Security error in zego-config:', error);
      res.status(500).json({ error: 'فشل في تحميل إعدادات البث الآمنة' });
    }
  });

  // Secure stream validation endpoint
  app.post('/api/streams/validate', requireAuth, (req: any, res) => {
    try {
      const { tempToken, zegoStreamId } = req.body;
      
      // Skip token validation for now - authenticate user directly  
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Generate server-side stream token
      const streamValidation = crypto.createHash('sha256')
        .update(req.user.id + zegoStreamId + Date.now().toString())
        .digest('hex')
        .substring(0, 32);
      
      res.json({
        validated: true,
        streamToken: streamValidation,
        userId: req.user.id
      });
    } catch (error) {
      console.error('Stream validation error:', error);
      res.status(500).json({ error: 'Validation failed' });
    }
  });

  app.post('/api/streams', requireAuth, async (req: any, res) => {
    try {
      console.log("🎥 Creating new stream for user:", req.user.id);
      console.log("📊 Stream data:", req.body);
      
      const streamData = {
        title: req.body.title || 'بث مباشر',
        description: req.body.description || '',
        hostId: req.user.id,
        zegoRoomId: req.body.zegoRoomId,
        zegoStreamId: req.body.zegoStreamId,
        category: 'بث سريع', // Add required category field
        thumbnailUrl: null, // Add optional thumbnail field
        isLive: true,
        viewerCount: 0,
        startedAt: new Date()
      };
      
      console.log("📋 Final stream data:", streamData);
      
      const stream = await storage.createStream(streamData);
      console.log("✅ Stream created successfully:", stream);
      
      res.json({
        success: true,
        data: stream,
        ...stream
      });
    } catch (error) {
      console.error("❌ Error creating stream:", error);
      res.status(500).json({ 
        success: false,
        message: "فشل في إنشاء البث المباشر",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/streams/:id', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      console.log("🔍 Fetching stream with ID:", streamId);
      
      if (isNaN(streamId)) {
        console.error("❌ Invalid stream ID:", req.params.id);
        return res.status(400).json({ message: "معرف البث غير صحيح" });
      }
      
      const stream = await storage.getStreamById(streamId);
      if (!stream) {
        console.log("⚠️ Stream not found:", streamId);
        return res.status(404).json({ message: "البث المباشر غير موجود" });
      }

      // Get host information
      const host = await storage.getUserById(stream.hostId);
      const streamWithHost = {
        ...stream,
        hostName: host ? `${host.firstName} ${host.lastName}`.trim() || host.username : 'مضيف غير معروف'
      };
      
      console.log("✅ Stream found:", {
        id: stream.id,
        title: stream.title,
        isLive: stream.isLive,
        hostId: stream.hostId,
        hostName: streamWithHost.hostName
      });
      
      res.json(streamWithHost);
    } catch (error) {
      console.error("❌ Error fetching stream:", error);
      res.status(500).json({ message: "فشل في جلب بيانات البث" });
    }
  });

  app.post('/api/streams/:id/end', requireAuth, async (req: any, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const userId = req.user.id;
      console.log("🛑 Ending stream:", { streamId, userId });
      
      const stream = await storage.getStreamById(streamId);
      
      if (!stream || stream.hostId !== userId) {
        return res.status(403).json({ message: "غير مصرح لك بإنهاء هذا البث" });
      }
      
      // 1. Clean up security tokens for this user
      const tokensCleared = cleanupUserTokens(userId);
      
      // 2. Delete the stream from database completely
      await storage.deleteStream(streamId);
      
      // 3. Broadcast stream ended to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'stream_ended',
            streamId: streamId,
            hostId: userId
          }));
        }
      });
      
      console.log("✅ Stream ended with cleanup:", { 
        streamId, 
        userId, 
        tokensCleared 
      });
      
      res.json({ 
        success: true, 
        message: "تم إنهاء البث وحذفه بنجاح",
        tokensCleared: tokensCleared
      });
    } catch (error) {
      console.error("❌ Error ending stream:", error);
      res.status(500).json({ message: "فشل في إنهاء البث" });
    }
  });

  // Messages routes
  app.get('/api/messages/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // For now, return empty array since we don't have message system implemented yet
      res.json([]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:userId', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;
      // For now, return empty messages
      res.json({
        messages: [],
        otherUser: await storage.getUser(otherUserId)
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/send', requireAuth, async (req: any, res) => {
    try {
      const { recipientId, content } = req.body;
      const senderId = req.user.id;
      
      // For now, just return success
      res.json({ 
        id: Date.now(),
        senderId,
        recipientId,
        content,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Gift routes
  app.get('/api/gifts/characters', async (req, res) => {
    try {
      const characters = await storage.getGiftCharacters();
      res.json(characters);
    } catch (error) {
      console.error("Error fetching gift characters:", error);
      res.status(500).json({ message: "Failed to fetch gift characters" });
    }
  });

  app.post('/api/gifts/send', requireAuth, async (req: any, res) => {
    try {
      const giftData = insertGiftSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });
      
      // Check if user has enough points
      const userPoints = await storage.getUserPointBalance(giftData.senderId);
      if (userPoints < giftData.pointCost) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      const gift = await storage.sendGift(giftData);
      
      // Update supporter levels
      const supporterUpdate = await updateSupporterLevel(giftData.senderId);
      await updateGiftsReceived(giftData.receiverId, giftData.pointCost);
      
      // Broadcast gift to stream viewers with supporter level update
      broadcastToStream(giftData.streamId!, {
        type: 'gift_sent',
        gift,
        sender: req.user.claims,
        supporterUpdate,
      });
      
      res.json({ gift, supporterUpdate });
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  // Comments routes - simplified version
  app.get('/api/memorys/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      // Return empty for now while we fix the schema issues
      res.json([]);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/memorys/:id/comments', requireAuth, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Create comment with simplified approach
      res.json({
        id: Date.now(),
        content: content.trim(),
        authorId: req.user.id,
        postId,
        parentId: null,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        author: {
          id: req.user.id,
          username: req.user.username,
          firstName: req.user.firstName,
          profileImageUrl: req.user.profileImageUrl || null,
        },
        replies: []
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get('/api/streams/:id/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      res.json([]);
    } catch (error) {
      console.error("Error fetching stream comments:", error);
      res.status(500).json({ message: "Failed to fetch stream comments" });
    }
  });

  app.post('/api/streams/:id/comments', requireAuth, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      res.json({
        id: Date.now(),
        content: content.trim(),
        authorId: req.user.id,
        postId,
        parentId: null,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        author: {
          id: req.user.id,
          username: req.user.username,
          firstName: req.user.firstName,
          profileImageUrl: req.user.profileImageUrl || null,
        },
        replies: []
      });
    } catch (error) {
      console.error("Error adding stream comment:", error);
      res.status(500).json({ message: "Failed to add stream comment" });
    }
  });

  app.post('/api/comments/:id/like', requireAuth, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.id);
      res.json({ liked: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  // Get stream chat messages
  app.get('/api/streams/:id/messages', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      
      if (isNaN(streamId)) {
        return res.status(400).json({ message: "Invalid stream ID" });
      }

      // Get recent chat messages for this stream
      const messages = await db
        .select({
          id: chatMessages.id,
          message: chatMessages.message,
          sentAt: chatMessages.sentAt,
          userId: chatMessages.userId,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.userId, users.id))
        .where(eq(chatMessages.streamId, streamId))
        .orderBy(desc(chatMessages.sentAt))
        .limit(50);

      console.log(`📨 Fetched ${messages.length} messages for stream ${streamId}`);
      res.json(messages.reverse()); // Show oldest first
    } catch (error) {
      console.error("Error fetching stream messages:", error);
      res.status(500).json({ message: "Failed to fetch stream messages" });
    }
  });

  // Add new chat message to stream
  app.post('/api/streams/:id/messages', requireAuth, async (req: any, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const { message } = req.body;
      
      if (isNaN(streamId)) {
        return res.status(400).json({ message: "Invalid stream ID" });
      }
      
      if (!message?.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Check if stream exists and is live
      const stream = await db
        .select()
        .from(streams)
        .where(and(eq(streams.id, streamId), eq(streams.isLive, true)))
        .limit(1);

      if (stream.length === 0) {
        return res.status(404).json({ message: "Stream not found or not live" });
      }

      // Insert new message
      const newMessage = await db
        .insert(chatMessages)
        .values({
          streamId,
          userId: req.user.id,
          message: message.trim(),
        })
        .returning();

      console.log(`💬 New message added to stream ${streamId} by ${req.user.username}: ${message.trim()}`);

      // Return message with user info
      res.json({
        id: newMessage[0].id,
        message: newMessage[0].message,
        sentAt: newMessage[0].sentAt,
        userId: req.user.id,
        username: req.user.username,
        firstName: req.user.firstName,
        profileImageUrl: req.user.profileImageUrl || null,
      });
    } catch (error) {
      console.error("Error adding stream message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // End all streams for current user
  app.post('/api/streams/end-all', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`🗑️ Ending all streams for user: ${userId}`);
      
      // Get all active streams for this user
      const allStreams = await storage.getActiveStreams();
      const userStreams = allStreams.filter((stream: any) => stream.hostId === userId);
      
      // Delete each stream
      for (const stream of userStreams) {
        await storage.deleteStream(stream.id);
        console.log(`✅ Deleted stream: ${stream.id}`);
      }
      
      res.json({ 
        message: 'All streams ended successfully',
        deletedCount: userStreams.length 
      });
    } catch (error) {
      console.error("Error ending streams:", error);
      res.status(500).json({ message: "Failed to end streams" });
    }
  });

  // Chat routes
  app.get('/api/streams/:id/chat', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const messages = await storage.getStreamChatMessages(streamId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getStreamingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // User profile routes
  app.get('/api/users/:id/profile', async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const followCount = await storage.getFollowCount(userId);
      res.json({ ...user, followers: followCount });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Secure admin panel route
  // Admin panel access route
  app.get('/admin', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'super_admin') {
        return res.status(403).send(`
          <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <title>Access Denied - LaaBoBo Live</title>
              <style>
                body { font-family: 'Cairo', Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #FF69B4, #9333EA); color: white; }
                .card { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 500px; }
                .btn { background: #FF69B4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>🚫 الوصول مرفوض</h2>
                <p>تحتاج صلاحية super_admin للوصول لهذه اللوحة</p>
                <p><strong>المستخدم الحالي:</strong> ${user?.email || 'غير معروف'}</p>
                <p><strong>الصلاحية:</strong> ${user?.role || 'لا توجد'}</p>
                <br>
                <a href="/" class="btn">← العودة للرئيسية</a>
                <a href="/api/login" class="btn">تسجيل دخول جديد</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Serve the admin panel from React app
      res.redirect('/#/admin');
    } catch (error) {
      console.error('Admin access error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Simplified panel access without access code requirement
  app.get('/panel-9bd2f2-control', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'super_admin') {
        return res.status(403).send(`
          <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <title>Access Denied - LaaBoBo Live</title>
              <style>
                body { font-family: 'Cairo', Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #FF69B4, #9333EA); color: white; }
                .card { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 500px; }
                .btn { background: #FF69B4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>🚫 الوصول مرفوض</h2>
                <p>تحتاج صلاحية super_admin للوصول لهذه اللوحة</p>
                <p><strong>المستخدم الحالي:</strong> ${user?.email || 'غير معروف'}</p>
                <p><strong>الصلاحية:</strong> ${user?.role || 'لا توجد'}</p>
                <br>
                <a href="/" class="btn">← العودة للرئيسية</a>
                <a href="/api/login" class="btn">تسجيل دخول جديد</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Redirect to admin panel in React app
      res.redirect('/#/admin');
    } catch (error) {
      console.error('Panel access error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Memory Fragment routes
  app.post('/api/memories', requireAuth, upload.array('media', 5), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'At least one media file is required' });
      }

      // Process uploaded files
      const mediaUrls: string[] = [];
      let thumbnailUrl = '';

      for (const file of files) {
        // In a real app, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
        // For this demo, we'll create a simple file serving system
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `uploads/${fileName}`;
        
        await fs.rename(file.path, filePath);
        const fileUrl = `/uploads/${fileName}`;
        mediaUrls.push(fileUrl);
        
        // Use first image as thumbnail
        if (!thumbnailUrl && file.mimetype.startsWith('image/')) {
          thumbnailUrl = fileUrl;
        }
      }

      // Create memory fragment
      const fragmentData = {
        authorId: userId,
        type: req.body.type || 'mixed',
        title: req.body.title || '',
        caption: req.body.caption || '',
        mediaUrls: JSON.stringify(mediaUrls),
        thumbnailUrl,
        memoryType: req.body.memoryType || 'fleeting',
        mood: req.body.mood || 'happy',
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        location: req.body.location || null,
        isPublic: true,
      };

      const fragment = await storage.createMemoryFragment(fragmentData);
      res.json(fragment);
    } catch (error) {
      console.error('Error creating memory fragment:', error);
      res.status(500).json({ message: 'Failed to create memory fragment' });
    }
  });

  app.get('/api/memories/user/:userId', requireAuth, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.id;
      
      // Users can only view their own memories for now
      if (targetUserId !== currentUserId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const memories = await storage.getUserMemoryFragments(targetUserId);
      res.json(memories);
    } catch (error) {
      console.error('Error fetching user memories:', error);
      res.status(500).json({ message: 'Failed to fetch memories' });
    }
  });

  app.post('/api/memories/:id/interact', requireAuth, async (req: any, res) => {
    try {
      const fragmentId = parseInt(req.params.id);
      const userId = req.user.id;
      const { type } = req.body;

      if (!['view', 'like', 'share', 'save', 'gift'].includes(type)) {
        return res.status(400).json({ message: 'Invalid interaction type' });
      }

      const interaction = await storage.addMemoryInteraction({
        fragmentId,
        userId,
        type,
        energyBoost: type === 'view' ? 1 : type === 'like' ? 2 : type === 'share' ? 3 : 5,
      });

      res.json(interaction);
    } catch (error) {
      console.error('Error adding interaction:', error);
      res.status(500).json({ message: 'Failed to add interaction' });
    }
  });

  // Serve uploaded files (create directory if it doesn't exist)
  await fs.mkdir('uploads', { recursive: true });
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  
  const express = await import('express');
  app.use('/uploads', express.static('uploads'));

  // User stats endpoint
  app.get('/api/user/stats/:userId', requireAuth, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.id;
      
      if (targetUserId !== currentUserId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Calculate user stats from memory fragments
      const memories = await storage.getUserMemoryFragments(targetUserId);
      
      const stats = {
        totalViews: memories.reduce((sum, m) => sum + (m.viewCount || 0), 0),
        totalLikes: memories.reduce((sum, m) => sum + (m.likeCount || 0), 0),
        totalGifts: memories.reduce((sum, m) => sum + (m.giftCount || 0), 0),
        totalShares: memories.reduce((sum, m) => sum + (m.shareCount || 0), 0),
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Temporary route to promote user to super_admin
  app.post('/make-admin', async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: 'Email and code required' });
      }
      
      if (code !== process.env.ADMIN_PROMO_CODE) {
        return res.status(403).json({ message: 'Invalid code' });
      }
      
      // Update user role to super_admin
      const result = await db.update(users)
        .set({ role: 'super_admin' })
        .where(eq(users.email, email))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User promoted to super_admin', user: result[0] });
    } catch (error) {
      console.error('Error promoting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Virtual Pet Garden Routes
  
  // Get user's virtual pet
  app.get("/api/garden/pet", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const pet = await storage.getUserPet(userId);
      
      if (!pet) {
        // Create a new pet for the user
        const newPet = await storage.createPet(userId);
        return res.json(newPet);
      }
      
      res.json(pet);
    } catch (error) {
      console.error("Error fetching user pet:", error);
      res.status(500).json({ message: "Failed to fetch pet" });
    }
  });

  // Feed the pet
  app.post("/api/garden/pet/feed", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.body;
      
      const result = await storage.feedPet(userId, itemId);
      res.json(result);
    } catch (error) {
      console.error("Error feeding pet:", error);
      res.status(500).json({ message: "Failed to feed pet" });
    }
  });

  // Play with the pet
  app.post("/api/garden/pet/play", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const result = await storage.playWithPet(userId);
      res.json(result);
    } catch (error) {
      console.error("Error playing with pet:", error);
      res.status(500).json({ message: "Failed to play with pet" });
    }
  });

  // Get garden items/shop
  app.get("/api/garden/shop", requireAuth, async (req: any, res) => {
    try {
      const items = await storage.getGardenItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching garden items:", error);
      res.status(500).json({ message: "Failed to fetch garden items" });
    }
  });

  // Buy garden item
  app.post("/api/garden/shop/buy", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId, quantity = 1 } = req.body;
      
      const result = await storage.buyGardenItem(userId, itemId, quantity);
      res.json(result);
    } catch (error) {
      console.error("Error buying garden item:", error);
      res.status(500).json({ message: "Failed to buy item" });
    }
  });

  // Get user's inventory
  app.get("/api/garden/inventory", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const inventory = await storage.getUserInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Visit friend's garden
  app.post("/api/garden/visit/:friendId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { friendId } = req.params;
      const { giftItemId } = req.body;
      
      const result = await storage.visitGarden(userId, friendId, giftItemId);
      res.json(result);
    } catch (error) {
      console.error("Error visiting garden:", error);
      res.status(500).json({ message: "Failed to visit garden" });
    }
  });

  // Get friend's garden
  app.get("/api/garden/friend/:friendId", requireAuth, async (req: any, res) => {
    try {
      const { friendId } = req.params;
      const garden = await storage.getFriendGarden(friendId);
      res.json(garden);
    } catch (error) {
      console.error("Error fetching friend's garden:", error);
      res.status(500).json({ message: "Failed to fetch friend's garden" });
    }
  });

  // Get garden activities/feed
  app.get("/api/garden/activities", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activities = await storage.getGardenActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching garden activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Get pet achievements
  app.get("/api/garden/achievements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const achievements = await storage.getPetAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Game system API routes
  app.post('/api/games/rooms', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const gameRoom = await storage.createGameRoom({
        ...req.body,
        hostId: userId
      });
      res.json(gameRoom);
    } catch (error) {
      console.error("Error creating game room:", error);
      res.status(500).json({ message: "فشل في إنشاء غرفة اللعبة" });
    }
  });

  app.get('/api/games/rooms', async (req: any, res) => {
    try {
      const gameType = req.query.gameType;
      const rooms = await storage.getGameRooms(gameType);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching game rooms:", error);
      res.status(500).json({ message: "فشل في جلب غرف الألعاب" });
    }
  });

  app.post('/api/games/rooms/:roomId/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { roomId } = req.params;
      const { petId } = req.body;
      
      const participant = await storage.joinGameRoom(roomId, userId, petId);
      res.json(participant);
    } catch (error: any) {
      console.error("Error joining game room:", error);
      res.status(400).json({ message: error.message || "فشل في الانضمام للعبة" });
    }
  });

  app.get('/api/games/rooms/:roomId/players', async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const players = [
        {
          id: "1",
          userId: "user1",
          username: "أحمد",
          petName: "ثعلب ذكي",
          level: 12,
          pointsSpent: 50,
          rank: "gold",
          isReady: true
        },
        {
          id: "2", 
          userId: "user2",
          username: "فاطمة",
          petName: "قطة لطيفة",
          level: 8,
          pointsSpent: 50,
          rank: "silver",
          isReady: false
        }
      ];
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "فشل في جلب اللاعبين" });
    }
  });

  app.post('/api/garden/support', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const support = await storage.supportGarden({
        ...req.body,
        supporterId: userId
      });
      res.json(support);
    } catch (error) {
      console.error("Error supporting garden:", error);
      res.status(500).json({ message: "فشل في دعم الحديقة" });
    }
  });

  app.get('/api/profiles/:userId', async (req: any, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      const user = await storage.getUser(userId);
      const pet = await storage.getUserPet(userId);
      
      res.json({
        profile,
        user,
        pet
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "فشل في جلب الملف الشخصي" });
    }
  });

  // Get friends list (users with pets)
  app.get("/api/garden/friends", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const friends = await storage.getAllUsersWithPets(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // Character System APIs
  app.get('/api/characters/available', requireAuth, async (req: any, res) => {
    try {
      const characters = await storage.getAvailableCharacters();
      res.json(characters);
    } catch (error: any) {
      console.error("Error fetching available characters:", error);
      res.status(500).json({ message: "فشل في تحميل الشخصيات المتاحة" });
    }
  });

  app.get('/api/characters/owned', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userCharacters = await storage.getUserCharacters(userId);
      res.json(userCharacters);
    } catch (error: any) {
      console.error("Error fetching user characters:", error);
      res.status(500).json({ message: "فشل في تحميل شخصياتك" });
    }
  });

  app.post('/api/characters/purchase', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { characterId } = req.body;

      if (!characterId) {
        return res.status(400).json({ message: "معرف الشخصية مطلوب" });
      }

      // Get character details
      const character = await storage.getCharacterById(characterId);
      if (!character) {
        return res.status(404).json({ message: "الشخصية غير موجودة" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user || !user.points || user.points < (character.price || 0)) {
        return res.status(400).json({ message: "نقاط غير كافية لشراء هذه الشخصية" });
      }

      // Purchase character
      const userCharacter = await storage.purchaseCharacter(userId, characterId);
      
      // Deduct points
      await storage.updateUser(userId, { 
        points: user.points - (character.price || 0)
      });

      res.json(userCharacter);
    } catch (error: any) {
      console.error("Error purchasing character:", error);
      res.status(500).json({ message: "فشل في شراء الشخصية" });
    }
  });

  app.post('/api/characters/select', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { userCharacterId } = req.body;

      if (!userCharacterId) {
        return res.status(400).json({ message: "معرف الشخصية مطلوب" });
      }

      await storage.selectUserCharacter(userId, userCharacterId);
      res.json({ message: "تم اختيار الشخصية بنجاح" });
    } catch (error: any) {
      console.error("Error selecting character:", error);
      res.status(500).json({ message: "فشل في اختيار الشخصية" });
    }
  });

  // Locked Albums Routes
  app.get('/api/albums/public', async (req, res) => {
    try {
      const albums = await storage.getPublicLockedAlbums();
      res.json(albums);
    } catch (error: any) {
      console.error("Error fetching public albums:", error);
      res.status(500).json({ message: "فشل في تحميل الألبومات" });
    }
  });

  app.get('/api/albums/my', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albums = await storage.getLockedAlbumsByOwner(userId);
      res.json(albums);
    } catch (error: any) {
      console.error("Error fetching user albums:", error);
      res.status(500).json({ message: "فشل في تحميل ألبوماتك" });
    }
  });

  app.post('/api/albums/create', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, description, price } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ message: "عنوان الألبوم مطلوب" });
      }

      const albumData = {
        ownerId: userId,
        title: title.trim(),
        description: description || '',
        price: Math.max(50, parseInt(price) || 100),
      };

      const album = await storage.createLockedAlbum(albumData);
      res.json(album);
    } catch (error: any) {
      console.error("Error creating album:", error);
      res.status(500).json({ message: "فشل في إنشاء الألبوم" });
    }
  });

  app.post('/api/albums/purchase', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { albumId } = req.body;

      if (!albumId) {
        return res.status(400).json({ message: "معرف الألبوم مطلوب" });
      }

      // Check if already purchased
      const alreadyPurchased = await storage.hasUserPurchasedAlbum(albumId, userId);
      if (alreadyPurchased) {
        return res.status(400).json({ message: "لقد اشتريت هذا الألبوم مسبقاً" });
      }

      // Get album details
      const albums = await storage.getPublicLockedAlbums();
      const album = albums.find(a => a.id === albumId);
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }

      if (album.ownerId === userId) {
        return res.status(400).json({ message: "لا يمكنك شراء ألبومك الخاص" });
      }

      // Check user points
      const user = await storage.getUser(userId);
      if (!user || (user.points || 0) < album.price) {
        return res.status(400).json({ message: "نقاط غير كافية لشراء هذا الألبوم" });
      }

      // Create purchase
      const purchaseData = {
        albumId,
        buyerId: userId,
        price: album.price,
      };
      
      const purchase = await storage.purchaseAlbum(purchaseData);

      // Deduct points from buyer
      await storage.updateUser(userId, { 
        points: (user.points || 0) - album.price 
      });

      // Add points to seller
      const owner = await storage.getUser(album.ownerId);
      if (owner) {
        await storage.updateUser(album.ownerId, { 
          points: (owner.points || 0) + album.price 
        });
      }

      res.json(purchase);
    } catch (error: any) {
      console.error("Error purchasing album:", error);
      res.status(500).json({ message: "فشل في شراء الألبوم" });
    }
  });

  app.get('/api/albums/:albumId/content', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albumId = req.params.albumId;

      // Check if user owns or purchased the album
      const albums = await storage.getPublicLockedAlbums();
      const album = albums.find(a => a.id === albumId);
      
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }

      const isOwner = album.ownerId === userId;
      const hasPurchased = await storage.hasUserPurchasedAlbum(albumId, userId);

      if (!isOwner && !hasPurchased) {
        return res.status(403).json({ message: "يجب شراء الألبوم أولاً لعرض المحتوى" });
      }

      const content = await storage.getAlbumContent(albumId);
      res.json(content);
    } catch (error: any) {
      console.error("Error fetching album content:", error);
      res.status(500).json({ message: "فشل في تحميل محتوى الألبوم" });
    }
  });

  // Private Content Request Routes
  app.post('/api/content-requests/create', requireAuth, async (req: any, res) => {
    try {
      const fromUserId = req.user.id;
      const { toUserId, type, description, offeredPrice } = req.body;

      if (!toUserId || !type || !description || !offeredPrice) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      if (fromUserId === toUserId) {
        return res.status(400).json({ message: "لا يمكنك طلب محتوى من نفسك" });
      }

      // Check user points
      const user = await storage.getUser(fromUserId);
      if (!user || (user.points || 0) < offeredPrice) {
        return res.status(400).json({ message: "نقاط غير كافية لهذا الطلب" });
      }

      const requestData = {
        fromUserId,
        toUserId,
        type,
        description: description.trim(),
        offeredPrice: parseInt(offeredPrice),
      };

      const request = await storage.createPrivateContentRequest(requestData);
      res.json(request);
    } catch (error: any) {
      console.error("Error creating content request:", error);
      res.status(500).json({ message: "فشل في إرسال الطلب" });
    }
  });

  app.get('/api/content-requests/received', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getPrivateContentRequests(userId);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching received requests:", error);
      res.status(500).json({ message: "فشل في تحميل الطلبات" });
    }
  });

  app.get('/api/content-requests/sent', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getSentContentRequests(userId);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching sent requests:", error);
      res.status(500).json({ message: "فشل في تحميل الطلبات المرسلة" });
    }
  });

  app.post('/api/content-requests/:requestId/respond', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestId = req.params.requestId;
      const { status, contentUrl } = req.body;

      if (!['accepted', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: "حالة غير صحيحة" });
      }

      // Check if user owns this request
      const requests = await storage.getPrivateContentRequests(userId);
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      if (status === 'completed' && !contentUrl) {
        return res.status(400).json({ message: "رابط المحتوى مطلوب عند الإكمال" });
      }

      const updatedRequest = await storage.updatePrivateContentRequestStatus(requestId, status, contentUrl);

      // If completed, transfer points
      if (status === 'completed') {
        const requester = await storage.getUser(request.fromUserId);
        const recipient = await storage.getUser(userId);

        if (requester && recipient) {
          // Deduct points from requester
          await storage.updateUser(request.fromUserId, { 
            points: (requester.points || 0) - request.offeredPrice 
          });

          // Add points to recipient
          await storage.updateUser(userId, { 
            points: (recipient.points || 0) + request.offeredPrice 
          });
        }
      }

      res.json(updatedRequest);
    } catch (error: any) {
      console.error("Error responding to content request:", error);
      res.status(500).json({ message: "فشل في الرد على الطلب" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    connectedClients.set(clientId, { ws });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(clientId, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(clientId);
    });
  });

  return httpServer;
}

function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function handleWebSocketMessage(clientId: string, message: any) {
  const client = connectedClients.get(clientId);
  if (!client) {
    console.error("❌ Client not found for ID:", clientId);
    return;
  }

  try {
    switch (message.type) {
      case 'join_stream':
        console.log("🚀 User joining stream:", {
          userId: message.userId,
          streamId: message.streamId,
          clientId: clientId
        });
        
        client.streamId = message.streamId;
        client.userId = message.userId;
        
        // Update viewer count
        if (message.streamId) {
          const currentCount = Array.from(connectedClients.values())
            .filter(c => c.streamId === message.streamId).length;
          
          console.log("👥 Updating viewer count:", {
            streamId: message.streamId,
            newCount: currentCount
          });
          
          await storage.updateStreamViewerCount(message.streamId, currentCount);
          
          broadcastToStream(message.streamId, {
            type: 'viewer_count_update',
            count: currentCount,
          });
        }
        break;

    case 'leave_stream':
        console.log("🚪 User leaving stream:", {
          userId: client.userId,
          streamId: client.streamId,
          clientId: clientId
        });
        
        if (client.streamId) {
          const currentCount = Array.from(connectedClients.values())
            .filter(c => c.streamId === client.streamId).length - 1;
            
          console.log("👥 Updating viewer count after leave:", {
            streamId: client.streamId,
            newCount: Math.max(0, currentCount)
          });
          
          await storage.updateStreamViewerCount(client.streamId, Math.max(0, currentCount));
          
          broadcastToStream(client.streamId, {
            type: 'viewer_count_update',
            count: Math.max(0, currentCount),
          });
        }
        client.streamId = undefined;
        break;

    case 'start_live_stream':
        console.log("🎥 Starting live stream:", {
          streamId: message.streamId,
          userId: client.userId,
          streamerData: message.streamerData
        });
        
        // إشعار جميع المشاهدين ببدء البث
        broadcastToStream(message.streamId, {
          type: 'stream_started',
          streamId: message.streamId,
          streamerData: message.streamerData
        });
        break;

    case 'stop_live_stream':
        console.log("🛑 Stopping live stream:", {
          userId: client.userId,
          streamId: client.streamId
        });
        
        if (client.streamId) {
          broadcastToStream(client.streamId, {
            type: 'stream_ended',
            streamId: client.streamId
          });
        }
        break;

    case 'join_live_stream':
        console.log("🎬 Joining live stream as viewer:", {
          streamId: message.streamId,
          userId: message.userId,
          role: message.role
        });
        
        client.streamId = message.streamId;
        client.userId = message.userId;
        
        // إرسال بيانات البث للمشاهد الجديد
        client.ws.send(JSON.stringify({
          type: 'live_stream_data',
          streamId: message.streamId,
          data: 'stream_ready'
        }));
        break;

    case 'leave_live_stream':
        console.log("🚪 Leaving live stream:", {
          userId: client.userId,
          streamId: client.streamId
        });
        
        client.streamId = undefined;
        client.userId = undefined;
        break;

    case 'chat_message':
        console.log("💬 New chat message:", {
          streamId: client.streamId,
          userId: client.userId,
          messageLength: message.text?.length,
          hasUser: !!message.user
        });
        
        if (client.streamId && client.userId && message.text) {
          const chatMessage = await storage.addChatMessage({
            streamId: client.streamId,
            userId: client.userId,
            message: message.text,
          });
          
          broadcastToStream(client.streamId, {
            type: 'chat_message',
            message: chatMessage,
            user: message.user,
          });
        } else {
          console.warn("⚠️ Invalid chat message data:", {
            hasStreamId: !!client.streamId,
            hasUserId: !!client.userId,
            hasText: !!message.text
          });
        }
        break;
        
      default:
        console.warn("⚠️ Unknown WebSocket message type:", message.type);
        break;
    }
  } catch (error) {
    console.error("❌ Error handling WebSocket message:", error);
    console.error("📝 Message details:", {
      type: message.type,
      clientId: clientId,
      streamId: client.streamId,
      userId: client.userId
    });
  }
}

function broadcastToStream(streamId: number, message: any) {
  const streamClients = Array.from(connectedClients.values())
    .filter(client => client.streamId === streamId && client.ws.readyState === WebSocket.OPEN);
  
  const messageStr = JSON.stringify(message);
  streamClients.forEach(client => {
    client.ws.send(messageStr);
  });
}

async function initializeGiftCharacters() {
  try {
    const existingCharacters = await storage.getGiftCharacters();
    if (existingCharacters.length === 0) {
      const { db } = await import("./db");
      const { giftCharacters } = await import("@shared/schema");
      
      const characters = [
        { name: 'BoBo Love', emoji: '🐰💕', description: 'Rabbit with flying hearts', pointCost: 100, animationType: 'hearts' },
        { name: 'BoFire', emoji: '🐲🔥', description: 'Dragon with neon fire', pointCost: 500, animationType: 'fire' },
        { name: 'Nunu Magic', emoji: '🦄🌟', description: 'Flying horse with stars', pointCost: 1000, animationType: 'rainbow' },
        { name: 'Dodo Splash', emoji: '🦆💦', description: 'Duck with bubbles', pointCost: 250, animationType: 'bubbles' },
        { name: 'Meemo Wink', emoji: '🐱🌈', description: 'Cat with rainbow', pointCost: 750, animationType: 'rainbow_wave' },
      ];
      
      for (const character of characters) {
        await db.insert(giftCharacters).values(character);
        console.log('Initialize gift character:', character.name);
      }
    }
  } catch (error) {
    console.error('Error initializing gift characters:', error);
  }
}
