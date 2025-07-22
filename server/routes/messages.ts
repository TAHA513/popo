import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { messages, users, conversations } from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export function setupMessageRoutes(app: Express) {
  // Get user conversations
  app.get('/api/messages/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get conversations for the current user
      const userConversations = await db
        .select({
          id: conversations.id,
          otherUserId: sql<string>`CASE 
            WHEN ${conversations.user1Id} = ${userId} THEN ${conversations.user2Id}
            ELSE ${conversations.user1Id}
          END`,
          lastMessage: conversations.lastMessage,
          lastMessageAt: conversations.lastMessageAt,
          unreadCount: sql<number>`0` // TODO: Implement unread count
        })
        .from(conversations)
        .where(
          or(
            eq(conversations.user1Id, userId),
            eq(conversations.user2Id, userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));

      // Get other user details for each conversation
      const conversationsWithUsers = await Promise.all(
        userConversations.map(async (conv) => {
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
            ...conv,
            otherUser: otherUser[0] || null
          };
        })
      );

      res.json(conversationsWithUsers.filter(conv => conv.otherUser));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages for a specific conversation
  app.get('/api/messages/:userId', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;

      // Get messages between the two users
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, currentUserId), eq(messages.recipientId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.recipientId, currentUserId))
          )
        )
        .orderBy(messages.createdAt);

      res.json(conversationMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post('/api/messages/send', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, content } = req.body;

      if (!recipientId || !content?.trim()) {
        return res.status(400).json({ message: "Recipient and content are required" });
      }

      // Insert the message
      const newMessage = await db
        .insert(messages)
        .values({
          senderId,
          recipientId,
          content: content.trim(),
          createdAt: new Date()
        })
        .returning();

      // Update or create conversation
      const conversationExists = await db
        .select()
        .from(conversations)
        .where(
          or(
            and(eq(conversations.user1Id, senderId), eq(conversations.user2Id, recipientId)),
            and(eq(conversations.user1Id, recipientId), eq(conversations.user2Id, senderId))
          )
        )
        .limit(1);

      if (conversationExists.length > 0) {
        // Update existing conversation
        await db
          .update(conversations)
          .set({
            lastMessage: content.trim(),
            lastMessageAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationExists[0].id));
      } else {
        // Create new conversation
        await db
          .insert(conversations)
          .values({
            user1Id: senderId,
            user2Id: recipientId,
            lastMessage: content.trim(),
            lastMessageAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      res.json(newMessage[0]);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "فشل إرسال الرسالة" });
    }
  });
}