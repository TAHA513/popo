import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { messages, users } from "@shared/schema";
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

      if (!recipientId || !content?.trim()) {
        return res.status(400).json({ message: "المستلم والمحتوى مطلوبان" });
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

  // Get recent conversations (users you've chatted with)
  app.get('/api/messages/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get recent messages involving this user
      const recentChats = await db
        .select({
          recipientId: messages.recipientId,
          senderId: messages.senderId,
          lastMessage: messages.content,
          lastMessageAt: messages.createdAt
        })
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.recipientId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      console.log(`📨 Found ${recentChats.length} messages for user ${userId}`);

      // Create simple conversation list based on messages
      const conversationsSet = new Set();
      const conversationsList = [];

      for (const chat of recentChats) {
        let otherUserId;
        if (chat.senderId === userId) {
          otherUserId = chat.recipientId;
        } else {
          otherUserId = chat.senderId;
        }

        if (otherUserId && otherUserId !== userId && !conversationsSet.has(otherUserId)) {
          conversationsSet.add(otherUserId);
          
          // Get other user info
          const otherUserInfo = await db
            .select({
              id: users.id,
              username: users.username,
              firstName: users.firstName,
              profileImageUrl: users.profileImageUrl
            })
            .from(users)
            .where(eq(users.id, otherUserId))
            .limit(1);

          if (otherUserInfo[0]) {
            conversationsList.push({
              id: otherUserId,
              otherUserId: otherUserId,
              otherUser: otherUserInfo[0],
              lastMessage: chat.lastMessage,
              lastMessageAt: chat.lastMessageAt,
              unreadCount: 0
            });
          }
        }
      }

      console.log(`✅ Found ${conversationsList.length} conversations for user ${userId}`);
      res.json(conversationsList);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "فشل في جلب المحادثات" });
    }
  });
}