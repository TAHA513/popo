import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { users, privateRooms, roomInvitations, followers, pointTransactions } from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";

export function setupPrivateRoomRoutes(app: Express) {
  
  // Get active private rooms for current user
  app.get('/api/private-rooms/active', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const activeRooms = await db
        .select({
          id: privateRooms.id,
          title: privateRooms.title,
          description: privateRooms.description,
          isActive: privateRooms.isActive,
          createdAt: privateRooms.createdAt,
        })
        .from(privateRooms)
        .where(
          and(
            eq(privateRooms.hostId, userId),
            eq(privateRooms.isActive, true)
          )
        )
        .orderBy(desc(privateRooms.createdAt));

      res.json(activeRooms);
      
    } catch (error) {
      console.error("❌ Error fetching active private rooms:", error);
      res.status(500).json({ message: "خطأ في جلب الغرف النشطة" });
    }
  });

  // Create private room and send invitation
  app.post('/api/private-rooms/create', requireAuth, async (req: any, res) => {
    try {
      const hostId = req.user.id;
      const { inviteeId, giftRequired, message, title, description } = req.body;

      if (!inviteeId || !giftRequired) {
        return res.status(400).json({ message: "معلومات ناقصة" });
      }

      // Check if invitee is a follower
      const isFollower = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, inviteeId), 
            eq(followers.followingId, hostId)
          )
        )
        .limit(1);

      if (!isFollower.length) {
        return res.status(400).json({ message: "يمكن فقط للمتابعين دخول الغرف الخاصة" });
      }

      // Create private room
      const newRoom = await db
        .insert(privateRooms)
        .values({
          hostId,
          title: title || "غرفة خاصة",
          description: description || "",
          giftRequired,
        })
        .returning();

      // Send invitation with 24-hour expiry
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await db
        .insert(roomInvitations)
        .values({
          roomId: newRoom[0].id,
          fromUserId: hostId,
          toUserId: inviteeId,
          message: message || `دعوة للانضمام إلى ${title || "غرفة خاصة"}`,
          giftRequired,
          expiresAt
        });

      console.log(`✅ Private room ${newRoom[0].id} created and invitation sent to ${inviteeId}`);
      
      res.json({
        roomId: newRoom[0].id,
        message: "تم إنشاء الغرفة وإرسال الدعوة"
      });
      
    } catch (error) {
      console.error("❌ Error creating private room:", error);
      res.status(500).json({ message: "خطأ في إنشاء الغرفة الخاصة" });
    }
  });

  // Get pending invitations
  app.get('/api/room-invitations/pending', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();

      const invitations = await db
        .select({
          id: roomInvitations.id,
          roomId: roomInvitations.roomId,
          fromUserId: roomInvitations.fromUserId,
          message: roomInvitations.message,
          giftRequired: roomInvitations.giftRequired,
          expiresAt: roomInvitations.expiresAt,
          createdAt: roomInvitations.createdAt,
          roomTitle: privateRooms.title,
          roomDescription: privateRooms.description,
          senderUsername: users.username,
          senderFirstName: users.firstName,
          senderProfileImage: users.profileImageUrl
        })
        .from(roomInvitations)
        .innerJoin(privateRooms, eq(roomInvitations.roomId, privateRooms.id))
        .innerJoin(users, eq(roomInvitations.fromUserId, users.id))
        .where(
          and(
            eq(roomInvitations.toUserId, userId),
            eq(roomInvitations.status, "pending"),
            gt(roomInvitations.expiresAt, now)
          )
        )
        .orderBy(desc(roomInvitations.createdAt));

      res.json(invitations);
      
    } catch (error) {
      console.error("❌ Error fetching pending invitations:", error);
      res.status(500).json({ message: "خطأ في جلب الدعوات" });
    }
  });

  // Accept invitation
  app.post('/api/room-invitations/:invitationId/accept', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invitationId = parseInt(req.params.invitationId);

      // Get invitation details
      const invitation = await db
        .select({
          id: roomInvitations.id,
          roomId: roomInvitations.roomId,
          fromUserId: roomInvitations.fromUserId,
          giftRequired: roomInvitations.giftRequired,
          status: roomInvitations.status,
          expiresAt: roomInvitations.expiresAt
        })
        .from(roomInvitations)
        .where(
          and(
            eq(roomInvitations.id, invitationId),
            eq(roomInvitations.toUserId, userId)
          )
        )
        .limit(1);

      if (!invitation.length) {
        return res.status(404).json({ message: "الدعوة غير موجودة" });
      }

      const invitationData = invitation[0];

      if (invitationData.status !== "pending") {
        return res.status(400).json({ message: "تم الرد على هذه الدعوة مسبقاً" });
      }

      if (new Date() > new Date(invitationData.expiresAt)) {
        return res.status(400).json({ message: "انتهت صلاحية الدعوة" });
      }

      const giftPrice = invitationData.giftRequired.price || 0;

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
        .where(eq(users.id, invitationData.fromUserId))
        .limit(1);

      if (hostUser.length) {
        await db
          .update(users)
          .set({ points: hostUser[0].points + giftPrice })
          .where(eq(users.id, invitationData.fromUserId));
      }

      // Record transactions
      await db
        .insert(pointTransactions)
        .values([
          {
            userId,
            amount: -giftPrice,
            type: 'private_room_entry',
            description: 'دخول غرفة خاصة'
          },
          {
            userId: invitationData.fromUserId,
            amount: giftPrice,
            type: 'private_room_earning',
            description: 'أرباح من غرفة خاصة'
          }
        ]);

      // Update invitation status
      await db
        .update(roomInvitations)
        .set({
          status: "accepted",
          respondedAt: new Date()
        })
        .where(eq(roomInvitations.id, invitationId));

      console.log(`✅ Invitation ${invitationId} accepted by user ${userId}`);
      
      res.json({
        roomId: invitationData.roomId,
        message: "تم قبول الدعوة ودفع الهدية"
      });
      
    } catch (error) {
      console.error("❌ Error accepting invitation:", error);
      res.status(500).json({ message: "خطأ في قبول الدعوة" });
    }
  });

  // Decline invitation
  app.post('/api/room-invitations/:invitationId/decline', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invitationId = parseInt(req.params.invitationId);

      await db
        .update(roomInvitations)
        .set({
          status: "declined",
          respondedAt: new Date()
        })
        .where(
          and(
            eq(roomInvitations.id, invitationId),
            eq(roomInvitations.toUserId, userId)
          )
        );

      console.log(`✅ Invitation ${invitationId} declined by user ${userId}`);
      
      res.json({ message: "تم رفض الدعوة" });
      
    } catch (error) {
      console.error("❌ Error declining invitation:", error);
      res.status(500).json({ message: "خطأ في رفض الدعوة" });
    }
  });

  // Delete private room (only host can delete)
  app.delete('/api/private-rooms/:roomId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const roomId = parseInt(req.params.roomId);

      // Check if user is the host
      const room = await db
        .select()
        .from(privateRooms)
        .where(
          and(
            eq(privateRooms.id, roomId),
            eq(privateRooms.hostId, userId)
          )
        )
        .limit(1);

      if (!room.length) {
        return res.status(403).json({ message: "غير مسموح لك بحذف هذه الغرفة" });
      }

      // Delete all related data
      // 1. Delete room invitations
      await db
        .delete(roomInvitations)
        .where(eq(roomInvitations.roomId, roomId));

      // 2. Delete the room itself
      await db
        .delete(privateRooms)
        .where(eq(privateRooms.id, roomId));

      console.log(`✅ Private room ${roomId} deleted by host ${userId}`);
      
      res.json({ message: "تم حذف الغرفة الخاصة بنجاح" });
      
    } catch (error) {
      console.error("❌ Error deleting private room:", error);
      res.status(500).json({ message: "خطأ في حذف الغرفة" });
    }
  });

  console.log("✅ Private room routes configured");
}