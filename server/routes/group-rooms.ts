import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { users, groupRooms, groupRoomParticipants, groupRoomMessages, pointTransactions } from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";

export function setupGroupRoomRoutes(app: Express) {
  
  // Create group room
  app.post('/api/group-rooms/create', requireAuth, async (req: any, res) => {
    try {
      const hostId = req.user.id;
      const { title, description, giftRequired, entryPrice, maxParticipants, duration } = req.body;

      if (!title?.trim() || !giftRequired || !entryPrice) {
        return res.status(400).json({ message: "معلومات ناقصة" });
      }

      // Calculate room end time
      const roomEndsAt = new Date(Date.now() + duration * 60 * 1000);

      // Create group room
      const newRoom = await db
        .insert(groupRooms)
        .values({
          hostId,
          title: title.trim(),
          description: description?.trim() || "",
          giftRequired,
          entryPrice,
          maxParticipants: maxParticipants || 10,
          duration,
          roomEndsAt
        })
        .returning();

      // Host automatically joins the room (no payment required)
      await db
        .insert(groupRoomParticipants)
        .values({
          roomId: newRoom[0].id,
          userId: hostId,
          giftPaid: { ...giftRequired, price: 0 } // Host doesn't pay
        });

      // Update participant count
      await db
        .update(groupRooms)
        .set({ currentParticipants: 1 })
        .where(eq(groupRooms.id, newRoom[0].id));

      console.log(`✅ Created group room ${newRoom[0].id} by host ${hostId}`);
      
      res.json({
        roomId: newRoom[0].id,
        message: "تم إنشاء الغرفة الجماعية بنجاح"
      });
      
    } catch (error) {
      console.error("❌ Error creating group room:", error);
      res.status(500).json({ message: "خطأ في إنشاء الغرفة الجماعية" });
    }
  });

  // Get available group rooms
  app.get('/api/group-rooms/available', requireAuth, async (req: any, res) => {
    try {
      const now = new Date();
      
      const availableRooms = await db
        .select({
          id: groupRooms.id,
          title: groupRooms.title,
          description: groupRooms.description,
          giftRequired: groupRooms.giftRequired,
          entryPrice: groupRooms.entryPrice,
          maxParticipants: groupRooms.maxParticipants,
          currentParticipants: groupRooms.currentParticipants,
          duration: groupRooms.duration,
          roomEndsAt: groupRooms.roomEndsAt,
          createdAt: groupRooms.createdAt,
          // Host details
          hostId: groupRooms.hostId,
          hostUsername: users.username,
          hostFirstName: users.firstName,
          hostProfileImage: users.profileImageUrl
        })
        .from(groupRooms)
        .innerJoin(users, eq(groupRooms.hostId, users.id))
        .where(
          and(
            eq(groupRooms.isActive, true),
            eq(groupRooms.isOpen, true),
            gt(groupRooms.roomEndsAt, now)
          )
        )
        .orderBy(desc(groupRooms.createdAt));

      res.json(availableRooms);
      
    } catch (error) {
      console.error("❌ Error fetching available group rooms:", error);
      res.status(500).json({ message: "خطأ في جلب الغرف المتاحة" });
    }
  });

  // Join group room (pay gift and enter)
  app.post('/api/group-rooms/:roomId/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const roomId = parseInt(req.params.roomId);

      // Get room details
      const room = await db
        .select()
        .from(groupRooms)
        .where(eq(groupRooms.id, roomId))
        .limit(1);

      if (!room.length) {
        return res.status(404).json({ message: "الغرفة غير موجودة" });
      }

      const roomData = room[0];

      // Check if room is still available
      if (!roomData.isActive || !roomData.isOpen) {
        return res.status(400).json({ message: "الغرفة غير متاحة للانضمام" });
      }

      // Check if room is full
      if (roomData.currentParticipants >= roomData.maxParticipants) {
        return res.status(400).json({ message: "الغرفة ممتلئة" });
      }

      // Check if room has expired
      if (new Date() > new Date(roomData.roomEndsAt)) {
        return res.status(400).json({ message: "انتهت مدة الغرفة" });
      }

      // Check if user is already in the room
      const existingParticipant = await db
        .select()
        .from(groupRoomParticipants)
        .where(
          and(
            eq(groupRoomParticipants.roomId, roomId),
            eq(groupRoomParticipants.userId, userId),
            eq(groupRoomParticipants.isActive, true)
          )
        )
        .limit(1);

      if (existingParticipant.length) {
        return res.status(400).json({ message: "أنت موجود بالفعل في هذه الغرفة" });
      }

      const giftPrice = roomData.entryPrice;

      // Check user's points
      const user = await db
        .select({ points: users.points })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length || user[0].points < giftPrice) {
        return res.status(400).json({ message: "رصيد النقاط غير كافي" });
      }

      // Deduct points from user
      await db
        .update(users)
        .set({ points: user[0].points - giftPrice })
        .where(eq(users.id, userId));

      // Add points to host
      const hostUser = await db
        .select({ points: users.points })
        .from(users)
        .where(eq(users.id, roomData.hostId))
        .limit(1);

      if (hostUser.length) {
        await db
          .update(users)
          .set({ points: hostUser[0].points + giftPrice })
          .where(eq(users.id, roomData.hostId));
      }

      // Record transaction for user
      await db
        .insert(pointTransactions)
        .values({
          userId,
          amount: -giftPrice,
          type: 'group_room_entry',
          description: `دخول غرفة جماعية - ${roomData.title}`
        });

      // Record transaction for host
      await db
        .insert(pointTransactions)
        .values({
          userId: roomData.hostId,
          amount: giftPrice,
          type: 'group_room_earning',
          description: `أرباح من غرفة جماعية - ${roomData.title}`
        });

      // Add user to room participants
      await db
        .insert(groupRoomParticipants)
        .values({
          roomId,
          userId,
          giftPaid: roomData.giftRequired
        });

      // Update participant count
      await db
        .update(groupRooms)
        .set({ currentParticipants: roomData.currentParticipants + 1 })
        .where(eq(groupRooms.id, roomId));

      console.log(`✅ User ${userId} joined group room ${roomId} and paid ${giftPrice} points`);
      
      res.json({
        message: "تم الانضمام للغرفة الجماعية بنجاح",
        roomId
      });
      
    } catch (error) {
      console.error("❌ Error joining group room:", error);
      res.status(500).json({ message: "خطأ في الانضمام للغرفة" });
    }
  });

  // Get group room details with participants
  app.get('/api/group-rooms/:roomId', requireAuth, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.user.id;

      // Get room details
      const room = await db
        .select({
          id: groupRooms.id,
          title: groupRooms.title,
          description: groupRooms.description,
          giftRequired: groupRooms.giftRequired,
          maxParticipants: groupRooms.maxParticipants,
          currentParticipants: groupRooms.currentParticipants,
          duration: groupRooms.duration,
          roomEndsAt: groupRooms.roomEndsAt,
          isActive: groupRooms.isActive,
          createdAt: groupRooms.createdAt,
          hostId: groupRooms.hostId,
          hostUsername: users.username,
          hostFirstName: users.firstName,
          hostProfileImage: users.profileImageUrl
        })
        .from(groupRooms)
        .innerJoin(users, eq(groupRooms.hostId, users.id))
        .where(eq(groupRooms.id, roomId))
        .limit(1);

      if (!room.length) {
        return res.status(404).json({ message: "الغرفة غير موجودة" });
      }

      // Check if user is a participant
      const isParticipant = await db
        .select()
        .from(groupRoomParticipants)
        .where(
          and(
            eq(groupRoomParticipants.roomId, roomId),
            eq(groupRoomParticipants.userId, userId),
            eq(groupRoomParticipants.isActive, true)
          )
        )
        .limit(1);

      if (!isParticipant.length) {
        return res.status(403).json({ message: "يجب الانضمام للغرفة أولاً" });
      }

      // Get participants
      const participants = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl,
          joinedAt: groupRoomParticipants.joinedAt,
          giftPaid: groupRoomParticipants.giftPaid
        })
        .from(groupRoomParticipants)
        .innerJoin(users, eq(groupRoomParticipants.userId, users.id))
        .where(
          and(
            eq(groupRoomParticipants.roomId, roomId),
            eq(groupRoomParticipants.isActive, true)
          )
        )
        .orderBy(groupRoomParticipants.joinedAt);

      res.json({
        room: room[0],
        participants,
        isHost: room[0].hostId === userId
      });
      
    } catch (error) {
      console.error("❌ Error fetching group room details:", error);
      res.status(500).json({ message: "خطأ في جلب تفاصيل الغرفة" });
    }
  });

  // Get group room messages
  app.get('/api/group-rooms/:roomId/messages', requireAuth, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.user.id;

      // Check if user is a participant
      const isParticipant = await db
        .select()
        .from(groupRoomParticipants)
        .where(
          and(
            eq(groupRoomParticipants.roomId, roomId),
            eq(groupRoomParticipants.userId, userId),
            eq(groupRoomParticipants.isActive, true)
          )
        )
        .limit(1);

      if (!isParticipant.length) {
        return res.status(403).json({ message: "يجب الانضمام للغرفة أولاً" });
      }

      // Get messages
      const messages = await db
        .select({
          id: groupRoomMessages.id,
          content: groupRoomMessages.content,
          messageType: groupRoomMessages.messageType,
          createdAt: groupRoomMessages.createdAt,
          senderId: groupRoomMessages.senderId,
          senderUsername: users.username,
          senderFirstName: users.firstName,
          senderProfileImage: users.profileImageUrl
        })
        .from(groupRoomMessages)
        .innerJoin(users, eq(groupRoomMessages.senderId, users.id))
        .where(eq(groupRoomMessages.roomId, roomId))
        .orderBy(desc(groupRoomMessages.createdAt))
        .limit(50);

      res.json(messages.reverse()); // Show oldest first
      
    } catch (error) {
      console.error("❌ Error fetching group room messages:", error);
      res.status(500).json({ message: "خطأ في جلب رسائل الغرفة" });
    }
  });

  // Send message to group room
  app.post('/api/group-rooms/:roomId/messages', requireAuth, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.user.id;
      const { content, messageType = 'text' } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "المحتوى مطلوب" });
      }

      // Check if user is a participant
      const isParticipant = await db
        .select()
        .from(groupRoomParticipants)
        .where(
          and(
            eq(groupRoomParticipants.roomId, roomId),
            eq(groupRoomParticipants.userId, userId),
            eq(groupRoomParticipants.isActive, true)
          )
        )
        .limit(1);

      if (!isParticipant.length) {
        return res.status(403).json({ message: "يجب الانضمام للغرفة أولاً" });
      }

      // Send message
      const newMessage = await db
        .insert(groupRoomMessages)
        .values({
          roomId,
          senderId: userId,
          content: content.trim(),
          messageType
        })
        .returning();

      console.log(`✅ Message sent to group room ${roomId} by user ${userId}`);
      
      res.json({
        messageId: newMessage[0].id,
        message: "تم إرسال الرسالة"
      });
      
    } catch (error) {
      console.error("❌ Error sending group room message:", error);
      res.status(500).json({ message: "خطأ في إرسال الرسالة" });
    }
  });

  // Delete group room (only host can delete)
  app.delete('/api/group-rooms/:roomId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const roomId = parseInt(req.params.roomId);

      // Check if user is the host
      const room = await db
        .select()
        .from(groupRooms)
        .where(
          and(
            eq(groupRooms.id, roomId),
            eq(groupRooms.hostId, userId)
          )
        )
        .limit(1);

      if (!room.length) {
        return res.status(403).json({ message: "غير مسموح لك بحذف هذه الغرفة" });
      }

      const roomData = room[0];

      // Refund points to all participants (except host)
      const participants = await db
        .select({
          userId: groupRoomParticipants.userId,
          giftPaid: groupRoomParticipants.giftPaid
        })
        .from(groupRoomParticipants)
        .where(
          and(
            eq(groupRoomParticipants.roomId, roomId),
            eq(groupRoomParticipants.isActive, true)
          )
        );

      // Refund points to participants
      for (const participant of participants) {
        if (participant.userId !== userId) { // Don't refund to host
          const giftPrice = participant.giftPaid?.price || 0;
          
          if (giftPrice > 0) {
            // Add points back to participant
            const user = await db
              .select({ points: users.points })
              .from(users)
              .where(eq(users.id, participant.userId))
              .limit(1);

            if (user.length) {
              await db
                .update(users)
                .set({ points: user[0].points + giftPrice })
                .where(eq(users.id, participant.userId));

              // Record refund transaction
              await db
                .insert(pointTransactions)
                .values({
                  userId: participant.userId,
                  amount: giftPrice,
                  type: 'group_room_refund',
                  description: `استرداد نقاط من حذف الغرفة الجماعية - ${roomData.title}`
                });
            }
          }
        }
      }

      // Deduct points from host (lost earnings)
      const totalEarnings = participants
        .filter(p => p.userId !== userId)
        .reduce((sum, p) => sum + (p.giftPaid?.price || 0), 0);

      if (totalEarnings > 0) {
        const hostUser = await db
          .select({ points: users.points })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (hostUser.length) {
          await db
            .update(users)
            .set({ points: Math.max(0, hostUser[0].points - totalEarnings) })
            .where(eq(users.id, userId));

          // Record host deduction transaction
          await db
            .insert(pointTransactions)
            .values({
              userId,
              amount: -totalEarnings,
              type: 'group_room_deletion',
              description: `خصم أرباح بسبب حذف الغرفة الجماعية - ${roomData.title}`
            });
        }
      }

      // Delete all related data
      // 1. Delete messages
      await db
        .delete(groupRoomMessages)
        .where(eq(groupRoomMessages.roomId, roomId));

      // 2. Delete participants
      await db
        .delete(groupRoomParticipants)
        .where(eq(groupRoomParticipants.roomId, roomId));

      // 3. Delete the room itself
      await db
        .delete(groupRooms)
        .where(eq(groupRooms.id, roomId));

      console.log(`✅ Group room ${roomId} deleted by host ${userId}, refunded ${totalEarnings} points to participants`);
      
      res.json({ 
        message: "تم حذف الغرفة الجماعية واسترداد النقاط للمشاركين",
        refundedAmount: totalEarnings
      });
      
    } catch (error) {
      console.error("❌ Error deleting group room:", error);
      res.status(500).json({ message: "خطأ في حذف الغرفة" });
    }
  });

  console.log("✅ Group room routes configured");
}