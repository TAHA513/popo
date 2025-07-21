import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStreamSchema, insertGiftSchema, insertChatMessageSchema, users, insertMemoryFragmentSchema, insertMemoryInteractionSchema } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
// @ts-ignore
import { checkSuperAdmin } from "./middleware/checkSuperAdmin.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import fs from 'fs/promises';

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
  streamId?: number;
}

const connectedClients = new Map<string, ConnectedClient>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize gift characters
  await initializeGiftCharacters();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
  app.post('/api/memories', isAuthenticated, upload.array('media', 5), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        memoryType: memoryType || 'fleeting',
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

  app.get('/api/memories/user/:userId?', async (req, res) => {
    try {
      const userId = req.params.userId || req.user?.claims?.sub;
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

  // Follow/Unfollow user
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followedId = req.params.userId;
      
      if (followerId === followedId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      await storage.followUser(followerId, followedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.post('/api/users/:userId/unfollow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followedId = req.params.userId;
      
      await storage.unfollowUser(followerId, followedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
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

  app.post('/api/memories/:id/interact', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fragmentId = parseInt(req.params.id);
      const { type } = req.body; // 'like', 'view', 'share', 'gift'
      
      const energyBoost = type === 'view' ? 1 : type === 'like' ? 2 : type === 'share' ? 3 : type === 'gift' ? 5 : 1;
      
      await storage.addMemoryInteraction({
        fragmentId,
        userId,
        type,
        energyBoost
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding interaction:", error);
      res.status(500).json({ message: "Failed to add interaction" });
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

  app.post('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const streamData = insertStreamSchema.parse({
        ...req.body,
        hostId: req.user.claims.sub,
      });
      const stream = await storage.createStream(streamData);
      res.json(stream);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  app.get('/api/streams/:id', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const stream = await storage.getStreamById(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  app.post('/api/streams/:id/end', isAuthenticated, async (req: any, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const stream = await storage.getStreamById(streamId);
      
      if (!stream || stream.hostId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.endStream(streamId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ message: "Failed to end stream" });
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

  app.post('/api/gifts/send', isAuthenticated, async (req: any, res) => {
    try {
      const giftData = insertGiftSchema.parse({
        ...req.body,
        senderId: req.user.claims.sub,
      });
      
      // Check if user has enough points
      const userPoints = await storage.getUserPointBalance(giftData.senderId);
      if (userPoints < giftData.pointCost) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      const gift = await storage.sendGift(giftData);
      
      // Broadcast gift to stream viewers
      broadcastToStream(giftData.streamId!, {
        type: 'gift_sent',
        gift,
        sender: req.user.claims,
      });
      
      res.json(gift);
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Failed to send gift" });
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
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
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
  app.get('/admin', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/api/login');
    }
    
    try {
      const userId = (req.user as any)?.claims?.sub;
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
  app.get('/panel-9bd2f2-control', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/api/login');
    }
    
    try {
      const userId = (req.user as any)?.claims?.sub;
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
  app.post('/api/memories', isAuthenticated, upload.array('media', 5), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/memories/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
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

  app.post('/api/memories/:id/interact', isAuthenticated, async (req: any, res) => {
    try {
      const fragmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
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
  app.get('/api/user/stats/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
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
  if (!client) return;

  switch (message.type) {
    case 'join_stream':
      client.streamId = message.streamId;
      client.userId = message.userId;
      
      // Update viewer count
      if (message.streamId) {
        const currentCount = Array.from(connectedClients.values())
          .filter(c => c.streamId === message.streamId).length;
        await storage.updateStreamViewerCount(message.streamId, currentCount);
        
        broadcastToStream(message.streamId, {
          type: 'viewer_count_update',
          count: currentCount,
        });
      }
      break;

    case 'leave_stream':
      if (client.streamId) {
        const currentCount = Array.from(connectedClients.values())
          .filter(c => c.streamId === client.streamId).length - 1;
        await storage.updateStreamViewerCount(client.streamId, Math.max(0, currentCount));
        
        broadcastToStream(client.streamId, {
          type: 'viewer_count_update',
          count: Math.max(0, currentCount),
        });
      }
      client.streamId = undefined;
      break;

    case 'chat_message':
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
      }
      break;
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
