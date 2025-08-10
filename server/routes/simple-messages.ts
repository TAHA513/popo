import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { messages, users, blockedUsers } from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export function setupSimpleMessageRoutes(app: Express) {
  // Get messages between two users (simple direct chat)
  app.get('/api/messages/:userId', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;

      if (!otherUserId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get all messages between these two users
      const chatMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          recipientId: messages.recipientId,
          content: messages.content,
          messageType: messages.messageType,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
          senderInfo: {
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
            and(eq(messages.senderId, currentUserId), eq(messages.recipientId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.recipientId, currentUserId))
          )
        )
        .orderBy(messages.createdAt);

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

      res.json(chatMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "فشل في جلب الرسائل" });
    }
  });

  // Send a simple message
  app.post('/api/messages/send', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, content, messageType = 'text' } = req.body;

      console.log('📨 طلب إرسال رسالة وصل لـ simple-messages:', { 
        senderId, 
        recipientId, 
        content: content?.substring(0, 50) + '...', 
        messageType,
        userExists: !!req.user
      });

      if (!recipientId || !content?.trim()) {
        console.log('❌ بيانات ناقصة:', { recipientId: !!recipientId, content: !!content?.trim() });
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

      // Insert the message directly
      const newMessage = await db
        .insert(messages)
        .values({
          senderId,
          recipientId,
          content: content.trim(),
          messageType,
          isRead: false,
          createdAt: new Date()
        })
        .returning();

      // Get sender info for the response
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

      res.json({
        ...newMessage[0],
        senderInfo: senderInfo[0],
        message: "تم إرسال الرسالة بنجاح"
      });

    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "فشل إرسال الرسالة" });
    }
  });

  // Conversations endpoint is handled by direct-messages.ts
  
  // Debug endpoint to check messages
  app.get('/api/messages/debug', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`🐛 Debug: checking messages for user ${userId}`);
      
      const allMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.recipientId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));
        
      console.log(`🐛 Debug: found ${allMessages.length} messages`);
      res.json({ 
        userId,
        messageCount: allMessages.length,
        messages: allMessages.slice(0, 5) // First 5 messages for debug
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark messages as read for a specific conversation
  app.put('/api/messages/:userId/read', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;

      console.log('📖 تحديد الرسائل كمقروءة:', { currentUserId, otherUserId });

      // Mark all unread messages from the other user as read
      const result = await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.recipientId, currentUserId),
            eq(messages.isRead, false)
          )
        );

      console.log('✅ تم تحديد الرسائل كمقروءة:', result);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });
}