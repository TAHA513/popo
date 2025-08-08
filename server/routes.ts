import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./localAuth";
import { sql } from "drizzle-orm";
import { insertStreamSchema, insertGiftSchema, insertChatMessageSchema, users, streams, memoryFragments, memoryInteractions, insertMemoryFragmentSchema, insertMemoryInteractionSchema, registerSchema, loginSchema, insertCommentSchema, insertCommentLikeSchema, comments, commentLikes, chatMessages, giftCharacters, gifts, notifications, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { eq, and, desc, ne } from "drizzle-orm";
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
import { setupDirectMessageRoutes } from './routes/direct-messages';
import { setupPrivateRoomRoutes } from './routes/private-rooms';
import { setupGroupRoomRoutes } from './routes/group-rooms';
import { setupWalletRoutes } from './routes/wallet';
import { registerStripeRoutes } from './routes/stripe';
import { updateSupporterLevel, updateGiftsReceived } from './supporter-system';
import { initializePointPackages } from './init-point-packages';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security functions for ZegoCloud protection
const secureTokens = new Map<string, { token: string; expires: number; userId: string }>();

// Notification helper function
async function createNotification(data: {
  userId: string;
  fromUserId: string;
  type: 'comment' | 'like' | 'gift' | 'share' | 'follow' | 'message';
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId: data.userId,
      fromUserId: data.fromUserId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      isRead: false
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

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

// Configure multer for file uploads with better filename generation
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
      cb(null, filename);
    }
  }),
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

  // Initialize point packages
  await initializePointPackages();
  
  // Setup activity tracking for all authenticated routes
  app.use('/api', trackUserActivity);
  
  // Setup periodic cleanup of stale online users (every 2 minutes)
  setInterval(cleanupStaleOnlineUsers, 2 * 60 * 1000);
  
  // Setup message routes
  setupDirectMessageRoutes(app);
  
  // Setup private room routes
  setupPrivateRoomRoutes(app);
  
  // Setup group room routes
  setupGroupRoomRoutes(app);
  
  // Setup wallet routes
  setupWalletRoutes(app);

  // Setup Stripe payment routes
  registerStripeRoutes(app);

  // Wallet API endpoints
  // Get user transactions
  app.get('/api/users/:userId/transactions', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.id;
      
      // Users can only view their own transactions
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "ليس لديك إذن لعرض هذه المعاملات" });
      }
      
      // For now, return an empty array since we don't have a transactions table yet
      // In future, this would fetch from a transactions table
      res.json([]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "فشل في جلب المعاملات" });
    }
  });

  // Get sent gifts for user
  app.get('/api/gifts/sent/:userId', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.id;
      
      // Users can only view their own sent gifts
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "ليس لديك إذن لعرض هذه الهدايا" });
      }
      
      const sentGifts = await db.select({
        id: gifts.id,
        senderId: gifts.senderId,
        receiverId: gifts.receiverId,
        characterId: gifts.characterId,
        pointCost: gifts.pointCost,
        message: gifts.message,
        sentAt: gifts.sentAt,
        giftCharacterName: giftCharacters.name,
        giftCharacterEmoji: giftCharacters.emoji,
        giftCharacterPointCost: giftCharacters.pointCost,
        receiverUsername: users.username,
        receiverFirstName: users.firstName
      })
      .from(gifts)
      .leftJoin(giftCharacters, eq(gifts.characterId, giftCharacters.id))
      .leftJoin(users, eq(gifts.receiverId, users.id))
      .where(eq(gifts.senderId, userId))
      .orderBy(desc(gifts.sentAt));
      
      res.json(sentGifts);
    } catch (error) {
      console.error("Error fetching sent gifts:", error);
      res.status(500).json({ message: "فشل في جلب الهدايا المرسلة" });
    }
  });

  // Get received gifts for user
  app.get('/api/gifts/received/:userId', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.id;
      
      // Users can only view their own received gifts
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "ليس لديك إذن لعرض هذه الهدايا" });
      }
      
      const receivedGifts = await db.select({
        id: gifts.id,
        senderId: gifts.senderId,
        receiverId: gifts.receiverId,
        characterId: gifts.characterId,
        pointCost: gifts.pointCost,
        message: gifts.message,
        sentAt: gifts.sentAt,
        giftCharacterName: giftCharacters.name,
        giftCharacterEmoji: giftCharacters.emoji,
        giftCharacterPointCost: giftCharacters.pointCost,
        senderUsername: users.username,
        senderFirstName: users.firstName
      })
      .from(gifts)
      .leftJoin(giftCharacters, eq(gifts.characterId, giftCharacters.id))
      .leftJoin(users, eq(gifts.senderId, users.id))
      .where(eq(gifts.receiverId, userId))
      .orderBy(desc(gifts.sentAt));
      
      res.json(receivedGifts);
    } catch (error) {
      console.error("Error fetching received gifts:", error);
      res.status(500).json({ message: "فشل في جلب الهدايا المستلمة" });
    }
  });

  // Transfer points between wallets
  app.post('/api/wallet/transfer', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, amount } = req.body;

      if (!recipientId || !amount || amount <= 0) {
        return res.status(400).json({ message: "بيانات التحويل غير صحيحة" });
      }

      // Get sender's current points
      const sender = await storage.getUser(senderId);
      if (!sender || (sender.points || 0) < amount) {
        return res.status(400).json({ 
          message: `ليس لديك نقاط كافية. رصيدك الحالي: ${sender?.points || 0} نقطة`
        });
      }

      // Check if recipient exists
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "المحفظة المستلمة غير موجودة" });
      }

      // Prevent self-transfer
      if (senderId === recipientId) {
        return res.status(400).json({ message: "لا يمكنك تحويل النقاط لنفسك" });
      }

      // Perform the transfer
      const senderNewBalance = (sender.points || 0) - amount;
      const recipientNewBalance = (recipient.points || 0) + amount;

      await storage.updateUserPoints(senderId, senderNewBalance);
      await storage.updateUserPoints(recipientId, recipientNewBalance);

      console.log('💰 Points transfer successful:', {
        from: senderId,
        to: recipientId,
        amount,
        senderNewBalance,
        recipientNewBalance
      });

      // Create notification for recipient
      await createNotification({
        userId: recipientId,
        fromUserId: senderId,
        type: 'gift',
        title: "تحويل نقاط",
        message: `تم استلام ${amount} نقطة من ${sender.username || sender.firstName}`,
      });

      res.json({
        success: true,
        message: "تم التحويل بنجاح",
        transfer: {
          from: senderId,
          to: recipientId,
          amount,
          senderNewBalance,
          recipientNewBalance
        }
      });

    } catch (error) {
      console.error("Error transferring points:", error);
      res.status(500).json({ message: "فشل في تحويل النقاط" });
    }
  });

  // Premium Messages API
  
  // Get premium messages for current user
  app.get("/api/premium-messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getPremiumMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching premium messages:", error);
      res.status(500).json({ error: "Failed to fetch premium messages" });
    }
  });

  // Send premium message
  app.post("/api/premium-messages/send", requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, albumId, message } = req.body;

      // Validate album ownership
      const album = await storage.getPremiumAlbum(albumId);
      if (!album || album.userId !== senderId) {
        return res.status(403).json({ error: "Album not found or not owned by user" });
      }

      const premiumMessage = await storage.createPremiumMessage({
        senderId,
        recipientId,
        albumId,
        message,
      });

      res.json(premiumMessage);
    } catch (error) {
      console.error("Error sending premium message:", error);
      res.status(500).json({ error: "Failed to send premium message" });
    }
  });

  // Unlock premium message  
  app.post("/api/premium-messages/:id/unlock", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = parseInt(req.params.id);

      // Get the message
      const message = await storage.getPremiumMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user is the recipient
      if (message.recipientId !== userId) {
        return res.status(403).json({ error: "Not authorized to unlock this message" });
      }

      // Check if already unlocked
      if (message.unlockedAt) {
        return res.status(400).json({ error: "Message already unlocked" });
      }

      // Get album details
      const album = await storage.getPremiumAlbum(message.albumId);
      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }

      // Get required gift
      const gift = await storage.getGiftCharacter(album.requiredGiftId);
      if (!gift) {
        return res.status(404).json({ error: "Gift not found" });
      }

      const totalCost = gift.pointCost * album.requiredGiftAmount;

      // Check user balance
      const userBalance = await storage.getUserBalance(userId);
      if (userBalance < totalCost) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Process the transaction
      await storage.processAlbumUnlock(userId, album.userId, messageId, totalCost);

      const updatedMessage = await storage.getPremiumMessage(messageId);
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error unlocking premium message:", error);
      res.status(500).json({ error: "Failed to unlock premium message" });
    }
  });

  // Premium Albums API Routes
  
  // Create premium album
  app.post('/api/premium-albums', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, description, coverImageUrl, requiredGiftId, requiredGiftAmount } = req.body;

      if (!title || !requiredGiftId || !requiredGiftAmount) {
        return res.status(400).json({ message: "العنوان ومتطلبات الهدية مطلوبة" });
      }

      const albumData = {
        creatorId: userId,
        title,
        description,
        coverImageUrl,
        requiredGiftId,
        requiredGiftAmount,
      };

      const album = await storage.createPremiumAlbum(albumData);
      res.json(album);
    } catch (error) {
      console.error("Error creating premium album:", error);
      res.status(500).json({ message: "فشل في إنشاء الألبوم المدفوع" });
    }
  });

  // Get user's premium albums
  app.get('/api/premium-albums/my-albums', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const albums = await storage.getPremiumAlbums(userId);
      res.json(albums);
    } catch (error) {
      console.error("Error fetching user albums:", error);
      res.status(500).json({ message: "فشل في جلب الألبومات" });
    }
  });

  // Get premium album details
  app.get('/api/premium-albums/:albumId', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const userId = req.user.id;

      console.log(`🔍 Album access check: User ${userId} requesting album ${albumId}`);

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "معرف الألبوم غير صحيح" });
      }

      const album = await storage.getPremiumAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }

      // Check if user has access
      const hasAccess = await storage.checkPremiumAlbumAccess(albumId, userId);
      
      console.log(`✅ Access result: User ${userId} has access to album ${albumId}: ${hasAccess}`);
      console.log(`📊 Album creator: ${album.creatorId}, Current user: ${userId}`);
      
      const albumWithAccess = {
        ...album,
        hasAccess,
      };

      res.json(albumWithAccess);
    } catch (error) {
      console.error("Error fetching album:", error);
      res.status(500).json({ message: "فشل في جلب الألبوم" });
    }
  });

  // Purchase premium album access
  app.post('/api/premium-albums/:albumId/purchase', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const userId = req.user.id;

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "معرف الألبوم غير صحيح" });
      }

      // Get album details
      const album = await storage.getPremiumAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }

      // Check if user already has access
      const hasAccess = await storage.checkPremiumAlbumAccess(albumId, userId);
      if (hasAccess) {
        return res.status(400).json({ message: "لديك وصول للألبوم بالفعل" });
      }

      // Get gift details to calculate actual cost
      const giftCharacter = await storage.getGiftCharacterById(album.requiredGiftId);
      if (!giftCharacter) {
        return res.status(400).json({ message: "الهدية المطلوبة غير موجودة" });
      }

      const totalCost = giftCharacter.pointCost * album.requiredGiftAmount;

      // Check user's points balance
      const user = await storage.getUser(userId);
      if (!user || (user.points || 0) < totalCost) {
        return res.status(400).json({ 
          message: `ليس لديك نقاط كافية. تحتاج ${totalCost} نقطة وحالياً لديك ${user.points || 0} نقطة`
        });
      }

      // Process purchase
      console.log('🛒 Processing purchase:', {
        albumId,
        buyerId: userId,
        giftId: album.requiredGiftId,
        giftAmount: album.requiredGiftAmount,
        giftPointCost: giftCharacter.pointCost,
        totalCost: totalCost
      });

      await storage.purchasePremiumAlbum({
        albumId,
        buyerId: userId,
        giftId: album.requiredGiftId,
        giftAmount: album.requiredGiftAmount,
        totalCost: totalCost,
        purchasedAt: new Date()
      });

      // Deduct points from user
      await storage.updateUserPoints(userId, (user.points || 0) - totalCost);

      // Add points to album creator (they get the full amount paid)
      const creator = await storage.getUser(album.creatorId);
      await storage.updateUserPoints(album.creatorId, (creator?.points || 0) + totalCost);

      res.json({ 
        success: true, 
        message: "تم شراء الألبوم بنجاح",
        giftSent: {
          name: giftCharacter.name,
          emoji: giftCharacter.emoji,
          amount: album.requiredGiftAmount,
          totalCost: totalCost
        },
        remainingPoints: (user.points || 0) - totalCost
      });
    } catch (error) {
      console.error("Error purchasing album:", error);
      res.status(500).json({ message: "فشل في شراء الألبوم" });
    }
  });

  // Get album media content
  app.get('/api/premium-albums/:albumId/media', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const userId = req.user.id;

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "معرف الألبوم غير صحيح" });
      }

      // Check if user has access to this album
      const hasAccess = await storage.checkPremiumAlbumAccess(albumId, userId);
      if (!hasAccess) {
        return res.status(403).json({ message: "ليس لديك إذن لعرض محتويات هذا الألبوم" });
      }

      // Get album media
      const media = await storage.getPremiumAlbumMedia(albumId);
      res.json(media);
    } catch (error) {
      console.error("Error fetching album media:", error);
      res.status(500).json({ message: "فشل في جلب محتويات الألبوم" });
    }
  });

  // Add media to album
  app.post('/api/premium-albums/:albumId/media', requireAuth, async (req: any, res) => {
    console.log('🔄 طلب إضافة محتوى للألبوم:', {
      albumId: req.params.albumId,
      userId: req.user?.id,
      body: req.body
    });

    try {
      const albumId = parseInt(req.params.albumId);
      const userId = req.user.id;
      const { mediaUrl, mediaType, caption, orderIndex } = req.body;

      console.log('📝 البيانات المستلمة:', { albumId, userId, mediaUrl, mediaType, caption, orderIndex });

      if (isNaN(albumId)) {
        console.log('❌ معرف الألبوم غير صحيح:', req.params.albumId);
        return res.status(400).json({ message: "معرف الألبوم غير صحيح" });
      }

      if (!mediaUrl || !mediaType) {
        console.log('❌ بيانات المحتوى مفقودة:', { mediaUrl, mediaType });
        return res.status(400).json({ message: "رابط المحتوى ونوعه مطلوبان" });
      }

      // Check if user is the album creator
      const album = await storage.getPremiumAlbum(albumId);
      console.log('🔍 الألبوم الموجود:', album);

      if (!album) {
        console.log('❌ الألبوم غير موجود:', albumId);
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }

      if (album.creatorId !== userId) {
        console.log('❌ المستخدم ليس منشئ الألبوم:', { creatorId: album.creatorId, userId });
        return res.status(403).json({ message: "غير مصرح لك بإضافة محتوى لهذا الألبوم" });
      }

      const mediaData = {
        albumId,
        mediaUrl,
        mediaType,
        caption: caption || '',
        orderIndex: orderIndex || 0,
      };

      console.log('📦 بيانات المحتوى المراد إضافتها:', mediaData);

      const media = await storage.addAlbumMedia(mediaData);
      console.log('✅ تمت إضافة المحتوى بنجاح:', media);

      res.json(media);
    } catch (error) {
      console.error("❌ خطأ في إضافة المحتوى للألبوم:", error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      res.status(500).json({ message: "فشل في إضافة المحتوى للألبوم: " + errorMessage });
    }
  });

  // Get album media
  app.get('/api/premium-albums/:albumId/media', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const userId = req.user.id;

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "معرف الألبوم غير صحيح" });
      }

      // Check if user has access to this album
      const hasAccess = await storage.checkPremiumAlbumAccess(albumId, userId);
      if (!hasAccess) {
        return res.status(403).json({ message: "يجب شراء الألبوم أولاً لعرض المحتوى" });
      }

      const media = await storage.getAlbumMedia(albumId);
      res.json(media);
    } catch (error) {
      console.error("Error fetching album media:", error);
      res.status(500).json({ message: "فشل في جلب محتوى الألبوم" });
    }
  });

  // Purchase premium album access
  app.post('/api/premium-albums/:albumId/purchase', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const userId = req.user.id;

      if (isNaN(albumId)) {
        return res.status(400).json({ message: "معرف الألبوم غير صحيح" });
      }

      // Check if already has access
      const hasAccess = await storage.checkPremiumAlbumAccess(albumId, userId);
      if (hasAccess) {
        return res.status(400).json({ message: "لديك وصول لهذا الألبوم مسبقاً" });
      }

      // Get album details
      const album = await storage.getPremiumAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }

      if (album.creatorId === userId) {
        return res.status(400).json({ message: "لا يمكنك شراء ألبومك الخاص" });
      }

      // Get gift details
      const gift = await storage.getGiftById(album.requiredGiftId);
      if (!gift) {
        return res.status(404).json({ message: "الهدية المطلوبة غير موجودة" });
      }

      const totalCost = gift.pointCost * album.requiredGiftAmount;

      // Check user points
      const user = await storage.getUser(userId);
      if (!user || (user.points || 0) < totalCost) {
        return res.status(400).json({ message: "نقاط غير كافية لشراء هذا الألبوم" });
      }

      // Create purchase
      const purchaseData = {
        albumId,
        buyerId: userId,
        giftId: album.requiredGiftId,
        giftAmount: album.requiredGiftAmount,
        totalCost,
      };

      const purchase = await storage.purchasePremiumAlbum(purchaseData);

      // Deduct points from buyer
      await storage.updateUser(userId, {
        points: (user.points || 0) - totalCost
      });

      // Add points to seller
      const creator = await storage.getUser(album.creatorId);
      if (creator) {
        await storage.updateUser(album.creatorId, {
          points: (creator.points || 0) + totalCost
        });
      }

      res.json(purchase);
    } catch (error) {
      console.error("Error purchasing album:", error);
      res.status(500).json({ message: "فشل في شراء الألبوم" });
    }
  });

  // Send premium message with album
  app.post('/api/premium-messages/send', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, albumId, message } = req.body;

      if (!recipientId || !albumId) {
        return res.status(400).json({ message: "معرف المستلم والألبوم مطلوبان" });
      }

      // Check if album exists and sender has access
      const hasAccess = await storage.checkPremiumAlbumAccess(albumId, senderId);
      if (!hasAccess) {
        return res.status(403).json({ message: "لا يمكنك إرسال ألبوم لا تملك وصولاً إليه" });
      }

      const messageData = {
        senderId,
        recipientId,
        albumId,
        message: message || '',
      };

      const premiumMessage = await storage.sendPremiumMessage(messageData);
      res.json(premiumMessage);
    } catch (error) {
      console.error("Error sending premium message:", error);
      res.status(500).json({ message: "فشل في إرسال الرسالة المدفوعة" });
    }
  });

  // Get premium messages for user
  app.get('/api/premium-messages', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getPremiumMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching premium messages:", error);
      res.status(500).json({ message: "فشل في جلب الرسائل المدفوعة" });
    }
  });

  // Unlock premium message
  app.post('/api/premium-messages/:messageId/unlock', requireAuth, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const userId = req.user.id;

      if (isNaN(messageId)) {
        return res.status(400).json({ message: "معرف الرسالة غير صحيح" });
      }

      const unlockedMessage = await storage.unlockPremiumMessage(messageId, userId);
      res.json(unlockedMessage);
    } catch (error) {
      console.error("Error unlocking premium message:", error);
      res.status(500).json({ message: "فشل في فتح الرسالة المدفوعة" });
    }
  });

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
        countryCode: validatedData.countryCode,
        countryName: validatedData.countryName,
        countryFlag: validatedData.countryFlag,
        dateOfBirth: new Date(validatedData.dateOfBirth),
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

  // General file upload endpoint
  app.post('/api/upload', requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم رفع أي ملف" });
      }

      console.log('✅ تم رفع الملف:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "فشل في رفع الملف" });
    }
  });

  // Profile image upload endpoint
  app.post('/api/upload/profile-image', requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "لم يتم رفع أي ملف" });
      }

      // The file is already saved by multer, just use its filename
      const profileImageUrl = `/uploads/${file.filename}`;
      
      // Update user profile image URL in database
      await db.update(users).set({ profileImageUrl }).where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        profileImageUrl,
        message: "تم تحديث الصورة الشخصية بنجاح" 
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ message: "خطأ في رفع الصورة" });
    }
  });

  // Cover image upload endpoint
  app.post('/api/upload/cover-image', requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      console.log('🔄 Cover image upload request:', {
        userId,
        file: file ? { filename: file.filename, originalname: file.originalname, size: file.size } : null
      });
      
      if (!file) {
        console.log('❌ No file provided');
        return res.status(400).json({ message: "لم يتم رفع أي ملف" });
      }

      // The file is already saved by multer, just use its filename
      const coverImageUrl = `/uploads/${file.filename}`;
      
      console.log('📝 Updating database with coverImageUrl:', coverImageUrl);
      
      // Update user cover image URL in database
      await db.update(users).set({ coverImageUrl: coverImageUrl }).where(eq(users.id, userId));
      
      console.log('✅ Cover image uploaded successfully for user:', userId);
      
      res.json({ 
        success: true, 
        coverImageUrl,
        message: "تم تحديث صورة الغلاف بنجاح" 
      });
    } catch (error) {
      console.error('❌ Error uploading cover image:', error);
      res.status(500).json({ message: "خطأ في رفع صورة الغلاف" });
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
      
      // Get user memories with comment counts
      const memoriesWithCounts = await db
        .select({
          id: memoryFragments.id,
          authorId: memoryFragments.authorId,
          type: memoryFragments.type,
          title: memoryFragments.title,
          caption: memoryFragments.caption,
          mediaUrls: memoryFragments.mediaUrls,
          thumbnailUrl: memoryFragments.thumbnailUrl,
          viewCount: memoryFragments.viewCount,
          likeCount: memoryFragments.likeCount,
          shareCount: memoryFragments.shareCount,
          giftCount: memoryFragments.giftCount,
          currentEnergy: memoryFragments.currentEnergy,
          memoryType: memoryFragments.memoryType,
          mood: memoryFragments.mood,
          isActive: memoryFragments.isActive,
          isPublic: memoryFragments.isPublic,
          visibilityLevel: memoryFragments.visibilityLevel,
          allowComments: memoryFragments.allowComments,
          allowSharing: memoryFragments.allowSharing,
          allowGifts: memoryFragments.allowGifts,
          location: memoryFragments.location,
          createdAt: memoryFragments.createdAt,
          updatedAt: memoryFragments.updatedAt,
          author: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl,
            isStreamer: users.isStreamer,
          }
        })
        .from(memoryFragments)
        .leftJoin(users, eq(memoryFragments.authorId, users.id))
        .where(and(
          eq(memoryFragments.authorId, userId),
          eq(memoryFragments.isActive, true)
        ))
        .orderBy(desc(memoryFragments.createdAt));

      // Get comment counts for each memory
      const memoriesWithCommentCounts = await Promise.all(
        memoriesWithCounts.map(async (memory) => {
          const [commentCountResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(comments)
            .where(and(
              eq(comments.postId, memory.id),
              eq(comments.postType, 'memory')
            ));
          
          return {
            ...memory,
            commentCount: commentCountResult.count || 0
          };
        })
      );

      res.json(memoriesWithCommentCounts);
    } catch (error) {
      console.error("Error fetching user memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  // Get public memory fragments for homepage
  app.get('/api/memories/public', async (req, res) => {
    try {
      // Get memories with author info and comment counts
      const memoriesWithCounts = await db
        .select({
          id: memoryFragments.id,
          authorId: memoryFragments.authorId,
          type: memoryFragments.type,
          title: memoryFragments.title,
          caption: memoryFragments.caption,
          mediaUrls: memoryFragments.mediaUrls,
          thumbnailUrl: memoryFragments.thumbnailUrl,
          viewCount: memoryFragments.viewCount,
          likeCount: memoryFragments.likeCount,
          shareCount: memoryFragments.shareCount,
          giftCount: memoryFragments.giftCount,
          currentEnergy: memoryFragments.currentEnergy,
          memoryType: memoryFragments.memoryType,
          mood: memoryFragments.mood,
          isActive: memoryFragments.isActive,
          isPublic: memoryFragments.isPublic,
          visibilityLevel: memoryFragments.visibilityLevel,
          allowComments: memoryFragments.allowComments,
          allowSharing: memoryFragments.allowSharing,
          allowGifts: memoryFragments.allowGifts,
          location: memoryFragments.location,
          createdAt: memoryFragments.createdAt,
          updatedAt: memoryFragments.updatedAt,
          author: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl,
            isStreamer: users.isStreamer,
          }
        })
        .from(memoryFragments)
        .leftJoin(users, eq(memoryFragments.authorId, users.id))
        .where(and(
          eq(memoryFragments.isActive, true),
          eq(memoryFragments.isPublic, true)
        ))
        .orderBy(desc(memoryFragments.createdAt));

      // Get comment counts for each memory
      const memoriesWithCommentCounts = await Promise.all(
        memoriesWithCounts.map(async (memory) => {
          const [commentCountResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(comments)
            .where(and(
              eq(comments.postId, memory.id),
              eq(comments.postType, 'memory')
            ));
          
          return {
            ...memory,
            commentCount: commentCountResult.count || 0
          };
        })
      );

      res.json(memoriesWithCommentCounts);
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

  // Delete memory fragment by ID (only by author)
  app.delete('/api/memories/:memoryId', requireAuth, async (req: any, res) => {
    try {
      const memoryId = parseInt(req.params.memoryId);
      const userId = req.user.id;
      
      if (isNaN(memoryId)) {
        return res.status(400).json({ message: "معرف المنشور غير صحيح" });
      }
      
      // First, check if memory exists and get its author
      const memory = await storage.getMemoryFragmentById(memoryId);
      if (!memory) {
        return res.status(404).json({ message: "المنشور غير موجود" });
      }
      
      // Check if user is the author of the memory
      if (memory.authorId !== userId) {
        return res.status(403).json({ message: "غير مسموح لك بحذف هذا المنشور" });
      }
      
      // Soft delete by setting isActive to false
      await db
        .update(memoryFragments)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(memoryFragments.id, memoryId));
      
      console.log(`Memory ${memoryId} deleted by user ${userId}`);
      res.json({ message: "تم حذف المنشور بنجاح" });
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ message: "فشل في حذف المنشور" });
    }
  });

  // Get gifts for a specific memory
  app.get('/api/memories/:memoryId/gifts', async (req, res) => {
    try {
      const memoryId = parseInt(req.params.memoryId);
      if (isNaN(memoryId)) {
        return res.status(400).json({ message: "Invalid memory ID" });
      }
      
      const memoryGifts = await db
        .select({
          id: gifts.id,
          senderId: gifts.senderId,
          pointCost: gifts.pointCost,
          message: gifts.message,
          sentAt: gifts.sentAt,
          giftCharacter: {
            id: giftCharacters.id,
            name: giftCharacters.name,
            emoji: giftCharacters.emoji,
            pointCost: giftCharacters.pointCost
          },
          sender: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(gifts)
        .leftJoin(giftCharacters, eq(gifts.characterId, giftCharacters.id))
        .leftJoin(users, eq(gifts.senderId, users.id))
        .where(eq(gifts.memoryId, memoryId))
        .orderBy(desc(gifts.sentAt));
      
      res.json(memoryGifts);
    } catch (error) {
      console.error("Error fetching memory gifts:", error);
      res.status(500).json({ message: "Failed to fetch memory gifts" });
    }
  });

  // Record a view for a memory
  app.post('/api/memories/:memoryId/view', requireAuth, async (req: any, res) => {
    try {
      const memoryId = parseInt(req.params.memoryId);
      const userId = req.user.id;
      
      if (isNaN(memoryId)) {
        return res.status(400).json({ message: "معرف المنشور غير صحيح" });
      }
      
      await storage.recordMemoryView(memoryId, userId);
      const viewCount = await storage.getMemoryViewCount(memoryId);
      
      res.json({ success: true, viewCount });
    } catch (error) {
      console.error("Error recording memory view:", error);
      res.status(500).json({ message: "فشل في تسجيل المشاهدة" });
    }
  });

  // Get view count for a memory
  app.get('/api/memories/:memoryId/views', async (req, res) => {
    try {
      const memoryId = parseInt(req.params.memoryId);
      
      if (isNaN(memoryId)) {
        return res.status(400).json({ message: "معرف المنشور غير صحيح" });
      }
      
      const viewCount = await storage.getMemoryViewCount(memoryId);
      res.json({ viewCount });
    } catch (error) {
      console.error("Error fetching memory view count:", error);
      res.status(500).json({ message: "فشل في جلب عدد المشاهدات" });
    }
  });

  // Search users endpoint
  app.get('/api/users/search', requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.q as string || '';
      
      console.log('🔍 Searching users for gifts:', {
        currentUserId: req.user?.id,
        limit,
        search
      });
      
      // Get users excluding the current user
      const usersResult = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl,
          isOnline: users.isOnline
        })
        .from(users)
        .where(ne(users.id, req.user.id))
        .limit(limit);
      
      console.log('👥 Found users:', usersResult.length);
      
      res.json(usersResult);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'فشل في البحث عن المستخدمين' });
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

  // Admin route to verify a user
  app.post('/api/admin/verify-user', requireAuth, checkSuperAdmin, async (req: any, res) => {
    try {
      const { userId, verifiedEmail, verificationBadge } = req.body;
      
      if (!userId || !verifiedEmail) {
        return res.status(400).json({ message: "معرف المستخدم والايميل مطلوبان" });
      }

      await db.update(users)
        .set({
          isVerified: true,
          verifiedEmail,
          verificationBadge: verificationBadge || 'LaaBoBo',
          verifiedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ message: "تم توثيق المستخدم بنجاح" });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ message: "فشل في توثيق المستخدم" });
    }
  });

  // Admin route to unverify a user
  app.post('/api/admin/unverify-user', requireAuth, checkSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }

      await db.update(users)
        .set({
          isVerified: false,
          verifiedEmail: null,
          verificationBadge: null,
          verifiedAt: null
        })
        .where(eq(users.id, userId));

      res.json({ message: "تم إلغاء توثيق المستخدم بنجاح" });
    } catch (error) {
      console.error("Error unverifying user:", error);
      res.status(500).json({ message: "فشل في إلغاء توثيق المستخدم" });
    }
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', requireAuth, checkSuperAdmin, async (req: any, res) => {
    try {
      // Get total users count
      const totalUsersResult = await db.select({ count: sql`count(*)` }).from(users);
      const totalUsers = parseInt(totalUsersResult[0]?.count || '0');

      // Get verified users count
      const verifiedUsersResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.isVerified, true));
      const verifiedUsers = parseInt(verifiedUsersResult[0]?.count || '0');

      // Get online users count
      const onlineUsersResult = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.isOnline, true));
      const onlineUsers = parseInt(onlineUsersResult[0]?.count || '0');

      // Get total memories count
      const totalMemoriesResult = await db.select({ count: sql`count(*)` }).from(memoryFragments);
      const totalMemories = parseInt(totalMemoriesResult[0]?.count || '0');

      // Get total gifts count
      const totalGiftsResult = await db.select({ count: sql`count(*)` }).from(gifts);
      const totalGifts = parseInt(totalGiftsResult[0]?.count || '0');

      // Get total points in system
      const totalPointsResult = await db.select({ sum: sql`sum(points)` }).from(users);
      const totalPoints = parseInt(totalPointsResult[0]?.sum || '0');

      const stats = {
        totalUsers,
        verifiedUsers,
        onlineUsers,
        totalMemories,
        totalGifts,
        totalPoints
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "فشل في جلب الإحصائيات" });
    }
  });

  // Admin users list endpoint
  app.get('/api/admin/users', requireAuth, checkSuperAdmin, async (req: any, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isVerified: users.isVerified,
        isAdmin: users.isAdmin,
        role: users.role,
        points: users.points,
        createdAt: users.createdAt,
        lastSeenAt: users.lastSeenAt,
        isOnline: users.isOnline,
        verifiedEmail: users.verifiedEmail,
        verificationBadge: users.verificationBadge,
        verifiedAt: users.verifiedAt
      })
      .from(users)
      .orderBy(desc(users.createdAt));

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "فشل في جلب المستخدمين" });
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
  app.get('/api/users/:userId/follow-status', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followedId = req.params.userId;
      
      if (followerId === followedId) {
        return res.json({ isFollowing: false });
      }
      
      const isFollowing = await storage.isFollowing(followerId, followedId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // Check if following (legacy endpoint)
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
        res.json({ success: true, isFollowing: false, message: "تم إلغاء المتابعة" });
      } else {
        await storage.followUser(followerId, followedId);
        
        // Send notification to followed user
        await createNotification({
          userId: followedId,
          fromUserId: followerId,
          type: 'follow',
          title: 'متابع جديد',
          message: `بدأ ${req.user.firstName || req.user.username} في متابعتك`,
          relatedId: null,
          relatedType: 'follow'
        });
        
        res.json({ success: true, isFollowing: true, message: "تم المتابعة بنجاح" });
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

  // Remove follower (someone who follows you)
  app.post('/api/users/:userId/remove-follower', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id; // The user being followed (removing their follower)
      const followerId = req.params.userId; // The follower to be removed
      
      // Remove the follower relationship (followerId follows userId)
      await storage.unfollowUser(followerId, userId);
      res.json({ success: true, message: "تم إزالة المتابع بنجاح" });
    } catch (error) {
      console.error("Error removing follower:", error);
      res.status(500).json({ message: "فشل في إزالة المتابع" });
    }
  });

  // Block user
  app.post('/api/users/:userId/block', requireAuth, async (req: any, res) => {
    try {
      const blockerId = req.user.id;
      const blockedId = req.params.userId;
      
      if (blockerId === blockedId) {
        return res.status(400).json({ message: "لا يمكن حظر نفسك" });
      }
      
      await storage.blockUser(blockerId, blockedId);
      res.json({ success: true, message: "تم حظر المستخدم بنجاح" });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "فشل في حظر المستخدم" });
    }
  });

  // Unblock user
  app.post('/api/users/:userId/unblock', requireAuth, async (req: any, res) => {
    try {
      const blockerId = req.user.id;
      const blockedId = req.params.userId;
      
      await storage.unblockUser(blockerId, blockedId);
      res.json({ success: true, message: "تم إلغاء حظر المستخدم" });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "فشل في إلغاء الحظر" });
    }
  });

  // Check if user is blocked
  app.get('/api/users/:userId/block-status', requireAuth, async (req: any, res) => {
    try {
      const blockerId = req.user.id;
      const blockedId = req.params.userId;
      
      const isBlocked = await storage.isUserBlocked(blockerId, blockedId);
      res.json({ isBlocked });
    } catch (error) {
      console.error("Error checking block status:", error);
      res.status(500).json({ message: "فشل في فحص حالة الحظر" });
    }
  });

  // NOTIFICATIONS API
  
  // Get user notifications
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      
      const userNotifications = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          relatedId: notifications.relatedId,
          relatedType: notifications.relatedType,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          fromUser: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.fromUserId, users.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "فشل في جلب الإشعارات" });
    }
  });
  
  // Get unread notifications count
  app.get('/api/notifications/unread-count', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      
      res.json({ count: result.count || 0 });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ message: "فشل في جلب عدد الإشعارات غير المقروءة" });
    }
  });
  
  // Mark notification as read
  app.patch('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);
      
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "فشل في تحديث حالة الإشعار" });
    }
  });
  
  // Mark all notifications as read
  app.patch('/api/notifications/mark-all-read', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "فشل في تحديث جميع الإشعارات" });
    }
  });

  // Search users for live stream profile display
  app.get('/api/users/search/:query', requireAuth, async (req: any, res) => {
    try {
      const query = req.params.query;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "فشل في البحث عن المستخدمين" });
    }
  });

  // Private Albums API endpoints
  
  // Create new private album
  app.post('/api/albums', requireAuth, async (req: any, res) => {
    try {
      const { title, description, albumType, giftRequired, accessPrice } = req.body;
      
      const album = await storage.createPrivateAlbum({
        userId: req.user.id,
        title,
        description,
        albumType,
        giftRequired,
        accessPrice: accessPrice || 0,
      });
      
      res.json(album);
    } catch (error) {
      console.error("Error creating album:", error);
      res.status(500).json({ message: "فشل في إنشاء الألبوم" });
    }
  });

  // Get user's albums
  app.get('/api/albums/user/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user.id;
      
      const albums = await storage.getUserAlbums(userId);
      
      // Filter albums based on access
      const accessibleAlbums = [];
      
      for (const album of albums) {
        // Owner can see all their albums
        if (album.userId === currentUserId) {
          accessibleAlbums.push({
            ...album,
            hasAccess: true,
            isOwner: true
          });
        } else {
          // Check if user has purchased access
          const hasAccess = await storage.checkAlbumAccess(currentUserId, album.id);
          accessibleAlbums.push({
            ...album,
            hasAccess: !!hasAccess,
            isOwner: false
          });
        }
      }
      
      res.json(accessibleAlbums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ message: "فشل في جلب الألبومات" });
    }
  });

  // Get album details with photos
  app.get('/api/albums/:albumId', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const currentUserId = req.user.id;
      
      const album = await storage.getAlbumById(albumId);
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }
      
      const isOwner = album.userId === currentUserId;
      let hasAccess = isOwner;
      
      if (!isOwner) {
        const access = await storage.checkAlbumAccess(currentUserId, albumId);
        hasAccess = !!access;
      }
      
      if (!hasAccess && album.albumType === 'locked_album') {
        return res.json({
          ...album,
          photos: [],
          hasAccess: false,
          isOwner: false,
          requiresPayment: true
        });
      }
      
      const photos = await storage.getAlbumPhotos(albumId);
      
      // Filter photos based on access for individual photo albums
      const accessiblePhotos = [];
      
      if (album.albumType === 'individual_photos' && !isOwner) {
        for (const photo of photos) {
          const photoAccess = await storage.checkPhotoAccess(currentUserId, photo.id);
          accessiblePhotos.push({
            ...photo,
            hasAccess: !!photoAccess,
            requiresPayment: !photoAccess
          });
        }
      } else {
        accessiblePhotos.push(...photos.map(photo => ({
          ...photo,
          hasAccess: true,
          requiresPayment: false
        })));
      }
      
      res.json({
        ...album,
        photos: accessiblePhotos,
        hasAccess,
        isOwner,
        requiresPayment: false
      });
    } catch (error) {
      console.error("Error fetching album:", error);
      res.status(500).json({ message: "فشل في جلب الألبوم" });
    }
  });

  // Add photo to album
  app.post('/api/albums/:albumId/photos', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const { imageUrl, caption, giftRequired, accessPrice } = req.body;
      
      const album = await storage.getAlbumById(albumId);
      if (!album || album.userId !== req.user.id) {
        return res.status(403).json({ message: "ليس لديك صلاحية لإضافة صور لهذا الألبوم" });
      }
      
      const photo = await storage.addPhotoToAlbum({
        albumId,
        imageUrl,
        caption,
        giftRequired,
        accessPrice: accessPrice || 0,
      });
      
      res.json(photo);
    } catch (error) {
      console.error("Error adding photo:", error);
      res.status(500).json({ message: "فشل في إضافة الصورة" });
    }
  });

  // Purchase album access
  app.post('/api/albums/:albumId/purchase', requireAuth, async (req: any, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const currentUserId = req.user.id;
      const { giftPaid } = req.body;
      
      const album = await storage.getAlbumById(albumId);
      if (!album) {
        return res.status(404).json({ message: "الألبوم غير موجود" });
      }
      
      if (album.userId === currentUserId) {
        return res.status(400).json({ message: "لا يمكنك شراء ألبومك الخاص" });
      }
      
      // Check if already purchased
      const existingAccess = await storage.checkAlbumAccess(currentUserId, albumId);
      if (existingAccess) {
        return res.status(400).json({ message: "لديك حق الوصول لهذا الألبوم بالفعل" });
      }
      
      // Check user has enough points
      const user = await storage.getUser(currentUserId);
      if (!user || user.points < album.accessPrice) {
        return res.status(400).json({ message: "ليس لديك نقاط كافية" });
      }
      
      // Process purchase
      const access = await storage.purchaseAlbumAccess({
        albumId,
        buyerId: currentUserId,
        sellerId: album.userId,
        accessType: 'full_album',
        giftPaid,
        amountPaid: album.accessPrice,
      });
      
      // Deduct points from buyer
      await storage.updateUser(currentUserId, {
        points: user.points - album.accessPrice
      });
      
      // Add earnings to seller (40% profit)
      const sellerEarnings = Math.floor(album.accessPrice * 0.4);
      const seller = await storage.getUser(album.userId);
      if (seller) {
        await storage.updateUser(album.userId, {
          points: seller.points + sellerEarnings,
          totalEarnings: Number(seller.totalEarnings) + sellerEarnings
        });
      }
      
      // Record transactions
      await storage.addWalletTransaction({
        userId: currentUserId,
        type: 'album_purchase',
        amount: album.accessPrice.toString(),
        description: `شراء ألبوم: ${album.title}`,
        relatedUserId: album.userId,
        relatedAlbumId: albumId,
      });
      
      await storage.addWalletTransaction({
        userId: album.userId,
        type: 'album_sale',
        amount: sellerEarnings.toString(),
        description: `بيع ألبوم: ${album.title}`,
        relatedUserId: currentUserId,
        relatedAlbumId: albumId,
      });
      
      res.json({ success: true, access });
    } catch (error) {
      console.error("Error purchasing album:", error);
      res.status(500).json({ message: "فشل في شراء الألبوم" });
    }
  });

  // Purchase individual photo access
  app.post('/api/photos/:photoId/purchase', requireAuth, async (req: any, res) => {
    try {
      const photoId = parseInt(req.params.photoId);
      const currentUserId = req.user.id;
      const { giftPaid } = req.body;
      
      const photo = await storage.getPhotoById(photoId);
      if (!photo) {
        return res.status(404).json({ message: "الصورة غير موجودة" });
      }
      
      const album = await storage.getAlbumById(photo.albumId);
      if (!album || album.userId === currentUserId) {
        return res.status(400).json({ message: "لا يمكنك شراء صورتك الخاصة" });
      }
      
      // Check if already purchased
      const existingAccess = await storage.checkPhotoAccess(currentUserId, photoId);
      if (existingAccess) {
        return res.status(400).json({ message: "لديك حق الوصول لهذه الصورة بالفعل" });
      }
      
      // Check user has enough points
      const user = await storage.getUser(currentUserId);
      if (!user || user.points < photo.accessPrice) {
        return res.status(400).json({ message: "ليس لديك نقاط كافية" });
      }
      
      // Process purchase
      const access = await storage.purchaseAlbumAccess({
        albumId: photo.albumId,
        photoId,
        buyerId: currentUserId,
        sellerId: album.userId,
        accessType: 'single_photo',
        giftPaid,
        amountPaid: photo.accessPrice,
      });
      
      // Deduct points from buyer
      await storage.updateUser(currentUserId, {
        points: user.points - photo.accessPrice
      });
      
      // Add earnings to seller (40% profit)
      const sellerEarnings = Math.floor(photo.accessPrice * 0.4);
      const seller = await storage.getUser(album.userId);
      if (seller) {
        await storage.updateUser(album.userId, {
          points: seller.points + sellerEarnings,
          totalEarnings: Number(seller.totalEarnings) + sellerEarnings
        });
      }
      
      // Record transactions
      await storage.addWalletTransaction({
        userId: currentUserId,
        type: 'photo_purchase',
        amount: photo.accessPrice.toString(),
        description: `شراء صورة من ألبوم: ${album.title}`,
        relatedUserId: album.userId,
        relatedPhotoId: photoId,
      });
      
      await storage.addWalletTransaction({
        userId: album.userId,
        type: 'photo_sale',
        amount: sellerEarnings.toString(),
        description: `بيع صورة من ألبوم: ${album.title}`,
        relatedUserId: currentUserId,
        relatedPhotoId: photoId,
      });
      
      res.json({ success: true, access });
    } catch (error) {
      console.error("Error purchasing photo:", error);
      res.status(500).json({ message: "فشل في شراء الصورة" });
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

  // Search users for chat creation
  app.get('/api/users/search', requireAuth, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query.trim());
      // Remove current user from results
      const filteredUsers = users.filter((user: any) => user.id !== req.user?.id);
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "فشل البحث عن المستخدمين" });
    }
  });

  // Create private conversation
  app.post('/api/conversations/create', requireAuth, async (req: any, res) => {
    try {
      const { otherUserId } = req.body;
      const currentUserId = req.user?.id;
      
      if (!currentUserId || !otherUserId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }
      
      if (currentUserId === otherUserId) {
        return res.status(400).json({ message: "لا يمكنك إنشاء محادثة مع نفسك" });
      }
      
      // Check if conversation already exists
      const existingConversation = await storage.findConversation(currentUserId, otherUserId);
      if (existingConversation) {
        return res.json(existingConversation);
      }
      
      // Create new conversation
      const conversation = await storage.createConversation({
        user1Id: currentUserId,
        user2Id: otherUserId,
        lastMessage: null,
        lastMessageAt: new Date()
      });
      
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "فشل في إنشاء المحادثة" });
    }
  });

  // Get conversation details
  app.get('/api/conversations/:id', requireAuth, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const currentUserId = req.user?.id;
      
      if (!currentUserId || isNaN(conversationId)) {
        return res.status(400).json({ message: "معرف المحادثة غير صحيح" });
      }
      
      const conversation = await storage.getConversationById(conversationId, currentUserId);
      if (!conversation) {
        return res.status(404).json({ message: "المحادثة غير موجودة" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "فشل في جلب المحادثة" });
    }
  });

  // Get conversation messages
  app.get('/api/conversations/:id/messages', requireAuth, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const currentUserId = req.user?.id;
      
      if (!currentUserId || isNaN(conversationId)) {
        return res.status(400).json({ message: "معرف المحادثة غير صحيح" });
      }
      
      const messages = await storage.getConversationMessages(conversationId, currentUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "فشل في جلب الرسائل" });
    }
  });

  // Get user by ID
  app.get('/api/users/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        profileImageUrl: user.profileImageUrl,
        points: user.points,
        isOnline: user.isOnline
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "فشل في جلب بيانات المستخدم" });
    }
  });

  // Check follow status
  app.get('/api/follow/status/:userId', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user?.id;
      const targetUserId = req.params.userId;
      
      if (!currentUserId || !targetUserId) {
        return res.status(400).json({ message: "معرف المستخدم مطلوب" });
      }
      
      if (currentUserId === targetUserId) {
        return res.json({ isFollowing: true }); // المستخدم يتابع نفسه افتراضياً
      }
      
      const isFollowing = await storage.isUserFollowing(currentUserId, targetUserId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "فشل في فحص حالة المتابعة" });
    }
  });

  // Get available gift characters
  app.get('/api/gifts/characters', async (req, res) => {
    try {
      const giftCharacters = await storage.getGiftCharacters();
      res.json(giftCharacters);
    } catch (error) {
      console.error("Error fetching gift characters:", error);
      res.status(500).json({ message: "فشل في جلب الهدايا المتاحة" });
    }
  });

  // Send gift to another user
  app.post('/api/gifts/send', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user?.id;
      const { receiverId, characterId, message, streamId, memoryId } = req.body;
      console.log('🎁 Gift send request data:', { receiverId, characterId, message, streamId, memoryId });
      
      if (!senderId || !receiverId || !characterId) {
        return res.status(400).json({ message: "بيانات الهدية غير مكتملة" });
      }

      // Get gift character details
      const giftCharacter = await storage.getGiftCharacterById(characterId);
      if (!giftCharacter) {
        return res.status(404).json({ message: "الهدية غير موجودة" });
      }

      // Check if sender has enough points
      const sender = await storage.getUserById(senderId);
      if (!sender || (sender.points || 0) < giftCharacter.pointCost) {
        return res.status(400).json({ 
          message: `تحتاج إلى ${giftCharacter.pointCost} نقطة لإرسال هذه الهدية. لديك ${sender?.points || 0} نقطة فقط` 
        });
      }

      // Check if receiver accepts gifts from strangers
      const receiver = await storage.getUserById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "المستقبل غير موجود" });
      }

      // Check if they are following each other or if receiver allows gifts from strangers
      const isFollowing = await storage.isUserFollowing(senderId, receiverId);
      if (!receiver.allowGiftsFromStrangers && !isFollowing) {
        return res.status(403).json({ message: "هذا المستخدم لا يقبل هدايا من غير المتابعين" });
      }

      // Send the gift
      const gift = await storage.sendGift({
        senderId,
        receiverId,
        characterId,
        pointCost: giftCharacter.pointCost,
        message: message || null,
        streamId: streamId || null,
        memoryId: memoryId || null
      });

      // If this gift is for a specific memory, add a comment notification
      if (memoryId) {
        console.log('🎁 Creating gift notification comment for memory:', memoryId);
        const giftCommentContent = `🎁 ${sender.firstName || sender.username} أرسل ${giftCharacter.emoji} ${giftCharacter.name} (@${sender.username})`;
        console.log('🎁 Comment content:', giftCommentContent);
        
        try {
          const comment = await storage.addComment({
            content: giftCommentContent,
            authorId: senderId,
            postId: memoryId,
            postType: 'memory'
          });
          console.log('🎁 Comment created successfully:', comment);
        } catch (commentError) {
          console.error('❌ Error creating comment:', commentError);
        }
      }

      // Send notification to receiver
      await createNotification({
        userId: receiverId,
        fromUserId: senderId,
        type: 'gift',
        title: 'هدية جديدة',
        message: `أرسل لك ${sender.firstName || sender.username} ${giftCharacter.name}`,
        relatedId: gift.id,
        relatedType: 'gift'
      });

      // Update sender and receiver supporter levels
      await updateSupporterLevel(senderId);
      await updateGiftsReceived(receiverId, giftCharacter.pointCost);

      // Get updated user data
      const updatedSender = await storage.getUserById(senderId);
      const updatedReceiver = await storage.getUserById(receiverId);

      res.json({
        success: true,
        gift,
        giftCharacter,
        senderPoints: updatedSender?.points || 0,
        receiverEarnings: Math.floor(giftCharacter.pointCost * 0.6),
        message: `تم إرسال ${giftCharacter.name} بنجاح!`
      });
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "فشل في إرسال الهدية" });
    }
  });

  // Get gifts received by a user
  app.get('/api/gifts/received/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const gifts = await storage.getReceivedGifts(userId);
      res.json(gifts);
    } catch (error) {
      console.error("Error fetching received gifts:", error);
      res.status(500).json({ message: "فشل في جلب الهدايا المستقبلة" });
    }
  });

  // Get gifts sent by a user
  app.get('/api/gifts/sent/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const gifts = await storage.getSentGifts(userId);
      res.json(gifts);
    } catch (error) {
      console.error("Error fetching sent gifts:", error);
      res.status(500).json({ message: "فشل في جلب الهدايا المرسلة" });
    }
  });

  // Send gift for chat access (legacy endpoint)
  app.post('/api/send-gift', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user?.id;
      const { recipientId, giftType, amount, message } = req.body;
      
      if (!senderId || !recipientId || !giftType || !amount) {
        return res.status(400).json({ message: "بيانات الهدية غير مكتملة" });
      }
      
      // التحقق من الرصيد
      const senderBalance = await storage.getUserPointBalance(senderId);
      if (senderBalance < amount) {
        return res.status(400).json({ message: "رصيدك غير كافي لإرسال هذه الهدية" });
      }
      
      // إرسال الهدية
      const gift = await storage.sendGift({
        senderId,
        receiverId: recipientId,
        characterId: 1, // معرف افتراضي
        pointCost: amount,
        streamId: null
      });
      
      // خصم النقاط من المرسل
      await storage.addPointTransaction({
        userId: senderId,
        amount: -amount,
        type: 'gift_sent',
        description: `إرسال هدية: ${giftType}`
      });
      
      // إضافة النقاط للمستقبل
      await storage.addPointTransaction({
        userId: recipientId,
        amount: amount,
        type: 'gift_received',
        description: `استلام هدية: ${giftType}`
      });
      
      res.json({ 
        success: true, 
        gift,
        message: "تم إرسال الهدية بنجاح" 
      });
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "فشل في إرسال الهدية" });
    }
  });

  // Send message in conversation
  app.post('/api/conversations/:id/messages', requireAuth, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const currentUserId = req.user?.id;
      const { content, messageType = 'text' } = req.body;
      
      if (!currentUserId || isNaN(conversationId) || !content?.trim()) {
        return res.status(400).json({ message: "بيانات الرسالة غير صحيحة" });
      }
      
      // Verify user is part of this conversation
      const conversation = await storage.getConversationById(conversationId, currentUserId);
      if (!conversation) {
        return res.status(403).json({ message: "غير مسموح لك بإرسال رسائل في هذه المحادثة" });
      }
      
      // Get other user ID
      const otherUserId = conversation.otherUser.id;
      
      // Create message
      const message = await storage.createDirectMessage({
        senderId: currentUserId,
        recipientId: otherUserId,
        content: content.trim(),
        messageType,
        isRead: false
      });
      
      // Update conversation's last message
      await storage.updateConversationLastMessage(conversationId, content.trim());
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "فشل في إرسال الرسالة" });
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



  app.post('/api/streams', requireAuth, async (req: any, res) => {
    try {
      console.log("🎥 Creating new stream for user:", req.user.id);
      console.log("📊 Stream data:", req.body);
      
      const streamData = {
        title: req.body.title || 'بث مباشر',
        description: req.body.description || '',
        hostId: req.user.id,

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

  // Update stream endpoint
  app.patch('/api/streams/:id', requireAuth, async (req: any, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const stream = await storage.getStreamById(streamId);
      
      if (!stream || stream.hostId !== req.user.id) {
        return res.status(403).json({ message: "غير مسموح بتعديل هذا البث" });
      }

      const updatedStream = await storage.updateStream(streamId, req.body);
      console.log('📝 Stream updated:', { 
        id: streamId, 
        zegoRoomId: updatedStream.zegoRoomId,
        zegoStreamId: updatedStream.zegoStreamId 
      });
      res.json(updatedStream);
    } catch (error) {
      console.error('❌ Error updating stream:', error);
      res.status(500).json({ message: "فشل في تحديث البث" });
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

  // Get all streams
  app.get('/api/streams', async (req, res) => {
    try {
      const streams = await storage.getStreams();
      
      // Add host information to each stream
      const streamsWithHosts = await Promise.all(
        streams.map(async (stream) => {
          const host = await storage.getUserById(stream.hostId);
          return {
            ...stream,
            hostUsername: host ? (host.firstName || host.username) : 'مضيف غير معروف',
            hostName: host ? `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.username : 'مضيف غير معروف'
          };
        })
      );
      
      res.json(streamsWithHosts);
    } catch (error) {
      console.error("❌ Error fetching streams:", error);
      res.status(500).json({ message: "فشل في جلب البثوث" });
    }
  });

  app.post('/api/streams/:id/end', requireAuth, async (req: any, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const userId = req.user.id;
      console.log("🛑 Starting complete deletion of chat session:", { streamId, userId });
      
      const stream = await storage.getStreamById(streamId);
      
      if (!stream || stream.hostId !== userId) {
        return res.status(403).json({ message: "غير مصرح لك بإنهاء هذه الدردشة" });
      }
      
      console.log("🗑️ Deleting chat session and all related data:", {
        title: stream.title,
        startedAt: stream.startedAt,
        duration: stream.startedAt ? Date.now() - new Date(stream.startedAt).getTime() : 0
      });
      
      // 1. Clean up security tokens for this user
      const tokensCleared = cleanupUserTokens(userId);
      
      // 2. Delete the entire chat session from database (includes messages, gifts, etc.)
      await storage.deleteStream(streamId);
      
      // 3. Broadcast chat session ended to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'chat_ended',
            streamId: streamId,
            hostId: userId,
            message: 'تم إغلاق الدردشة وحذف جميع البيانات'
          }));
        }
      });
      
      console.log("✅ Chat session completely deleted:", { 
        streamId, 
        userId, 
        tokensCleared,
        message: "All chat data permanently removed from database"
      });
      
      res.json({ 
        success: true, 
        message: "تم إغلاق الدردشة وحذف جميع البيانات بشكل نهائي",
        tokensCleared: tokensCleared,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error deleting chat session:", error);
      res.status(500).json({ message: "فشل في حذف الدردشة" });
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
      const { recipientId, content, messageType = 'text' } = req.body;
      const senderId = req.user.id;
      
      console.log('📨 طلب إرسال رسالة:', { senderId, recipientId, content: content.substring(0, 50) + '...', messageType });
      
      if (!recipientId || !content) {
        console.log('❌ بيانات ناقصة:', { recipientId, content });
        return res.status(400).json({ message: "بيانات الرسالة غير مكتملة" });
      }

      // Create message object
      const messageData = {
        senderId,
        recipientId,
        content,
        messageType,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      console.log('💾 حفظ الرسالة:', messageData);
      
      // For now, save to database using direct Drizzle
      const [message] = await db.insert(chatMessages).values({
        senderId,
        recipientId,
        content,
        messageType: messageType || 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
      }).returning();
      
      console.log('✅ تم حفظ الرسالة بنجاح:', message);
      
      res.json(message);
    } catch (error) {
      console.error("❌ خطأ في إرسال الرسالة:", error);
      res.status(500).json({ message: "فشل في إرسال الرسالة" });
    }
  });



  // Get single memory by ID
  app.get('/api/memories/:id', async (req, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      
      const [memory] = await db
        .select({
          id: memoryFragments.id,
          authorId: memoryFragments.authorId,
          caption: memoryFragments.caption,
          mediaUrls: memoryFragments.mediaUrls,
          type: memoryFragments.type,
          likeCount: memoryFragments.likeCount,
          viewCount: memoryFragments.viewCount,
          shareCount: memoryFragments.shareCount,
          giftCount: memoryFragments.giftCount,
          createdAt: memoryFragments.createdAt,
          author: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(memoryFragments)
        .leftJoin(users, eq(memoryFragments.authorId, users.id))
        .where(eq(memoryFragments.id, memoryId));

      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      // Get comment count
      const [commentCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(and(
          eq(comments.postId, memory.id),
          eq(comments.postType, 'memory')
        ));

      res.json({
        ...memory,
        commentCount: commentCountResult.count || 0
      });
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  // Like/Unlike memory
  app.post('/api/memories/:id/like', requireAuth, async (req: any, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user already liked this memory
      const [existingLike] = await db
        .select()
        .from(memoryInteractions)
        .where(and(
          eq(memoryInteractions.fragmentId, memoryId),
          eq(memoryInteractions.userId, userId),
          eq(memoryInteractions.type, 'like')
        ));

      if (existingLike) {
        // Remove like
        await db
          .delete(memoryInteractions)
          .where(and(
            eq(memoryInteractions.fragmentId, memoryId),
            eq(memoryInteractions.userId, userId),
            eq(memoryInteractions.type, 'like')
          ));

        // Decrease like count
        await db
          .update(memoryFragments)
          .set({ 
            likeCount: sql`${memoryFragments.likeCount} - 1`
          })
          .where(eq(memoryFragments.id, memoryId));

        res.json({ liked: false, message: "تم إلغاء الإعجاب" });
      } else {
        // Get memory author info
        const [memory] = await db
          .select({ authorId: memoryFragments.authorId })
          .from(memoryFragments)
          .where(eq(memoryFragments.id, memoryId));

        // Add like
        await db.insert(memoryInteractions).values({
          fragmentId: memoryId,
          userId,
          type: 'like',
          energyBoost: 1,
          createdAt: new Date()
        });

        // Increase like count
        await db
          .update(memoryFragments)
          .set({ 
            likeCount: sql`${memoryFragments.likeCount} + 1`
          })
          .where(eq(memoryFragments.id, memoryId));

        // Send notification to memory author if it's not their own like
        if (memory && memory.authorId !== userId) {
          await createNotification({
            userId: memory.authorId,
            fromUserId: userId,
            type: 'like',
            title: 'إعجاب جديد',
            message: `أعجب ${req.user.firstName || req.user.username} بمنشورك`,
            relatedId: memoryId,
            relatedType: 'memory'
          });
        }

        res.json({ liked: true, message: "تم الإعجاب بالمنشور" });
      }
    } catch (error) {
      console.error("Error liking memory:", error);
      res.status(500).json({ message: "Failed to like memory" });
    }
  });

  // Check if user liked a memory
  app.get('/api/memories/:id/like-status', requireAuth, async (req: any, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      const userId = req.user.id;

      const [existingLike] = await db
        .select()
        .from(memoryInteractions)
        .where(and(
          eq(memoryInteractions.fragmentId, memoryId),
          eq(memoryInteractions.userId, userId),
          eq(memoryInteractions.type, 'like')
        ));

      res.json({ liked: !!existingLike });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  // Comments routes - fixed version
  app.get('/api/memories/:id/comments', async (req, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      
      // Get comments from database
      const commentsResult = await db
        .select({
          id: comments.id,
          userId: comments.authorId,
          memoryId: comments.postId,
          content: comments.content,
          createdAt: comments.createdAt,
          author: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(and(eq(comments.postId, memoryId), eq(comments.postType, 'memory')))
        .orderBy(desc(comments.createdAt));

      res.json(commentsResult);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/memories/:id/comments', requireAuth, async (req: any, res) => {
    try {
      const memoryId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Get memory author info
      const [memory] = await db
        .select({ authorId: memoryFragments.authorId })
        .from(memoryFragments)
        .where(eq(memoryFragments.id, memoryId));

      // Insert comment into database
      const [newComment] = await db.insert(comments).values({
        authorId: req.user.id,
        postId: memoryId,
        postType: 'memory',
        content: content.trim(),
        createdAt: new Date()
      }).returning();

      // Send notification to memory author if it's not their own comment
      if (memory && memory.authorId !== req.user.id) {
        await createNotification({
          userId: memory.authorId,
          fromUserId: req.user.id,
          type: 'comment',
          title: 'تعليق جديد',
          message: `علق ${req.user.firstName || req.user.username} على منشورك`,
          relatedId: memoryId,
          relatedType: 'memory'
        });
      }

      // Get full comment with author info
      const [commentWithAuthor] = await db
        .select({
          id: comments.id,
          userId: comments.authorId,
          memoryId: comments.postId,
          content: comments.content,
          createdAt: comments.createdAt,
          author: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.id, newComment.id));

      res.json(commentWithAuthor);
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
  app.get('/api/admin/stats', requireAuth, checkSuperAdmin, async (req: any, res) => {
    try {
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

  // Forgot Password API
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "تم إرسال رابط إعادة تعيين كلمة المرور" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      });

      // For demo purposes, return the reset link (in production, send via email)
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      console.log(`Password reset link for ${email}: ${resetLink}`);
      
      res.json({ 
        message: "تم إرسال رابط إعادة تعيين كلمة المرور",
        resetLink // Remove this in production
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال رابط الاستعادة" });
    }
  });

  // Reset Password API
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "الرمز وكلمة المرور الجديدة مطلوبان" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" });
      }

      // Check if token is expired
      if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
        return res.status(400).json({ message: "رابط إعادة التعيين منتهي الصلاحية" });
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null
      });

      res.json({ message: "تم تعيين كلمة المرور الجديدة بنجاح" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تعيين كلمة المرور" });
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
