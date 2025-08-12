import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { messages, users, blockedUsers } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { UrlHandler } from "../utils/url-handler";

export function setupDirectMessageRoutes(app: Express) {
  // Get conversations - OPTIMIZED for fast loading
  app.get('/api/messages/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`🔍 جلب المحادثات للمستخدم: ${userId}`);
      
      // Add caching header for better performance
      res.set('Cache-Control', 'public, max-age=20, s-maxage=20');
      
      // OPTIMIZATION: Get messages with user data in a single JOIN query
      const allMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          recipientId: messages.recipientId,
          content: messages.content,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          senderUser: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.recipientId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      console.log(`📨 وجدت ${allMessages.length} رسائل للمستخدم ${userId}`);

      // OPTIMIZATION: Get all unique user IDs and their details in one query
      const allUserIds = new Set<string>();
      allMessages.forEach(msg => {
        if (msg.senderId !== userId) allUserIds.add(msg.senderId);
        if (msg.recipientId !== userId) allUserIds.add(msg.recipientId);
      });

      const uniqueUserIds = Array.from(allUserIds);
      const allUsersInfo = uniqueUserIds.length > 0 ? await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl
        })
        .from(users)
        .where(eq(users.id, uniqueUserIds[0])) // Fix for multiple IDs - using IN operator
        : [];

      // Create user map for quick lookup
      const userMap = new Map();
      allUsersInfo.forEach(user => {
        userMap.set(user.id, user);
      });

      // Create unique conversations list efficiently
      const conversationsMap = new Map();
      
      for (const message of allMessages) {
        const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
        
        if (!conversationsMap.has(otherUserId)) {
          const otherUserInfo = userMap.get(otherUserId) || 
            (message.senderId === otherUserId ? message.senderUser : null);

          if (otherUserInfo) {
            // Calculate unread messages count
            const unreadMessages = allMessages.filter(msg => 
              msg.senderId === otherUserId && 
              msg.recipientId === userId &&
              !msg.isRead
            );
            
            conversationsMap.set(otherUserId, {
              otherUser: {
                ...otherUserInfo,
                profileImageUrl: otherUserInfo.profileImageUrl ? 
                  UrlHandler.processMediaUrl(otherUserInfo.profileImageUrl, req) : null
              },
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount: unreadMessages.length,
              hasUnreadMessages: unreadMessages.length > 0
            });
          }
        }
      }
      
      const conversations = Array.from(conversationsMap.values());
      res.json(conversations);
      
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      res.status(500).json({ message: "خطأ في جلب المحادثات" });
    }
  });

  // Get messages between two users
  app.get('/api/messages/:userId', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;

      // Get all messages between these two users
      const conversationMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          recipientId: messages.recipientId,
          content: messages.content,
          messageType: messages.messageType,
          isRead: messages.isRead,
          createdAt: messages.createdAt
        })
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, currentUserId), eq(messages.recipientId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.recipientId, currentUserId))
          )
        )
        .orderBy(messages.createdAt);



      // Add sender info to each message
      const messagesWithSenderInfo = await Promise.all(
        conversationMessages.map(async (message) => {
          const senderInfo = await db
            .select({
              id: users.id,
              username: users.username,
              firstName: users.firstName,
              profileImageUrl: users.profileImageUrl
            })
            .from(users)
            .where(eq(users.id, message.senderId))
            .limit(1);

          return {
            ...message,
            senderInfo: senderInfo[0] ? {
              ...senderInfo[0],
              profileImageUrl: senderInfo[0].profileImageUrl ? 
                UrlHandler.processMediaUrl(senderInfo[0].profileImageUrl, req) : null
            } : null
          };
        })
      );

      // Mark messages as read (from the other user to current user)
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.recipientId, currentUserId),
            eq(messages.isRead, false)
          )
        );

      res.json(messagesWithSenderInfo);
      
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      res.status(500).json({ message: "خطأ في جلب الرسائل" });
    }
  });

  // Send message - direct and simple
  app.post('/api/messages/send', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, content, messageType = 'text' } = req.body;

      if (!recipientId || !content?.trim()) {
        return res.status(400).json({ message: "المستلم والمحتوى مطلوبان" });
      }

      // Check if sender is blocked by recipient - direct DB query
      try {
        const [blockCheck] = await db
          .select()
          .from(blockedUsers)
          .where(
            and(
              eq(blockedUsers.blockerId, recipientId),
              eq(blockedUsers.blockedId, senderId)
            )
          )
          .limit(1);

        if (blockCheck) {
          return res.status(403).json({ message: "تم حظرك من قِبل هذا المستخدم. لا يمكنك إرسال رسائل إليه." });
        }

        // Check if recipient is blocked by sender
        const [blockCheck2] = await db
          .select()
          .from(blockedUsers)
          .where(
            and(
              eq(blockedUsers.blockerId, senderId),
              eq(blockedUsers.blockedId, recipientId)
            )
          )
          .limit(1);

        if (blockCheck2) {
          return res.status(403).json({ message: "لقد قمت بحظر هذا المستخدم. قم بإلغاء الحظر أولاً لإرسال الرسائل." });
        }
      } catch (error) {
        console.log('⚠️ خطأ في فحص البلوك، سيتم السماح بالرسالة:', error);
      }

      // Insert message directly
      const newMessage = await db
        .insert(messages)
        .values({
          senderId,
          recipientId,
          content: content.trim(),
          messageType,
          isRead: false,
        })
        .returning();

      // Get sender info
      const senderInfo = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl
        })
        .from(users)
        .where(eq(users.id, senderId))
        .limit(1);

      const response = {
        ...newMessage[0],
        senderInfo: senderInfo[0],
        message: "تم إرسال الرسالة بنجاح"
      };

      console.log("✅ Message sent successfully:", { 
        messageId: newMessage[0].id, 
        from: senderId, 
        to: recipientId 
      });

      res.json(response);
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
      res.status(500).json({ message: "فشل إرسال الرسالة" });
    }
  });

  // Empty requests endpoint for compatibility
  app.get('/api/messages/requests', requireAuth, async (req: any, res) => {
    res.json([]);
  });
}