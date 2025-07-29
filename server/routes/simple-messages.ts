import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { messages, users } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

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

      // Get recent conversations by finding latest messages
      const recentChats = await db
        .select({
          otherUserId: messages.recipientId,
          lastMessage: messages.content,
          lastMessageAt: messages.createdAt,
          isFromMe: messages.senderId
        })
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.recipientId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      // Group by other user and get the most recent message
      const conversationMap = new Map();
      
      for (const chat of recentChats) {
        const otherUserId = chat.isFromMe === userId ? chat.otherUserId : chat.isFromMe;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            otherUserId,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt
          });
        }
      }

      // Get user info for each conversation
      const conversations = await Promise.all(
        Array.from(conversationMap.values()).map(async (conv) => {
          const otherUser = await db
            .select({
              id: users.id,
              username: users.username,
              firstName: users.firstName,
              profileImageUrl: users.profileImageUrl
            })
            .from(users)
            .where(eq(users.id, conv.otherUserId))
            .limit(1);

          return {
            id: conv.otherUserId, // Use other user ID as conversation ID
            otherUserId: conv.otherUserId,
            otherUser: otherUser[0] || null,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: 0 // Simple version - no unread count
          };
        })
      );

      res.json(conversations.filter(conv => conv.otherUser));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "فشل في جلب المحادثات" });
    }
  });
}