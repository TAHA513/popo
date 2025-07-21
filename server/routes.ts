import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertStreamSchema, insertGiftSchema, insertChatMessageSchema, users } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
// @ts-ignore
import { checkSuperAdmin } from "./middleware/checkSuperAdmin.js";
import path from 'path';

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
      
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } catch (error) {
      console.error('Admin access error:', error);
      res.status(500).send('Internal server error');
    }
  });

  app.get('/panel-9bd2f2-control', checkSuperAdmin, (req, res) => {
    // This serves the admin panel - redirect to frontend admin route
    res.redirect('/admin');
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
