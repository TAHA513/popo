import type { Express } from "express";
import { requireAuth } from "../localAuth";
import { db } from "../db";
import { users, followers, privateRooms, roomInvitations, privateRoomMessages, pointTransactions } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

export function setupPrivateRoomRoutes(app: Express) {
  
  // Get user's followers for private room invitations
  app.get('/api/users/followers', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get users who follow this user
      const userFollowers = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl
        })
        .from(followers)
        .innerJoin(users, eq(followers.followerId, users.id))
        .where(eq(followers.followedId, userId));

      console.log(`✅ Found ${userFollowers.length} followers for user ${userId}`);
      res.json(userFollowers);
      
    } catch (error) {
      console.error("❌ Error fetching followers:", error);
      res.status(500).json({ message: "خطأ في جلب المتابعين" });
    }
  });

  // Get user's current points
  app.get('/api/users/points', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const user = await db
        .select({ points: users.points })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      res.json({ points: user[0].points || 0 });
      
    } catch (error) {
      console.error("❌ Error fetching user points:", error);
      res.status(500).json({ message: "خطأ في جلب النقاط" });
    }
  });

  // Create private room and send invitation
  app.post('/api/private-rooms/create', requireAuth, async (req: any, res) => {
    try {
      const hostId = req.user.id;
      const { invitedUserId, giftRequired, title, description, entryPrice } = req.body;

      if (!invitedUserId || !giftRequired || !title?.trim() || !entryPrice) {
        return res.status(400).json({ message: "معلومات ناقصة" });
      }

      // Check if invited user is a follower
      const isFollower = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, invitedUserId),
            eq(followers.followedId, hostId)
          )
        )
        .limit(1);

      if (!isFollower.length) {
        return res.status(400).json({ message: "يمكنك فقط دعوة المتابعين" });
      }

      // Create private room
      const newRoom = await db
        .insert(privateRooms)
        .values({
          hostId,
          invitedUserId,
          title: title.trim(),
          description: description?.trim() || "",
          giftRequired,
          entryPrice,
          invitationSent: true
        })
        .returning();

      // Create invitation record
      const invitation = await db
        .insert(roomInvitations)
        .values({
          roomId: newRoom[0].id,
          fromUserId: hostId,
          toUserId: invitedUserId,
          message: `دعوة للغرفة الخاصة: ${title}`,
          giftRequired,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
        })
        .returning();

      console.log(`✅ Created private room ${newRoom[0].id} from ${hostId} to ${invitedUserId}`);
      
      res.json({
        roomId: newRoom[0].id,
        invitationId: invitation[0].id,
        message: "تم إنشاء الغرفة وإرسال الدعوة"
      });
      
    } catch (error) {
      console.error("❌ Error creating private room:", error);
      res.status(500).json({ message: "خطأ في إنشاء الغرفة" });
    }
  });

  // Get pending invitations for user
  app.get('/api/room-invitations/pending', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const pendingInvitations = await db
        .select({
          id: roomInvitations.id,
          roomId: roomInvitations.roomId,
          fromUserId: roomInvitations.fromUserId,
          message: roomInvitations.message,
          giftRequired: roomInvitations.giftRequired,
          expiresAt: roomInvitations.expiresAt,
          createdAt: roomInvitations.createdAt,
          // Room details
          roomTitle: privateRooms.title,
          roomDescription: privateRooms.description,
          // Sender details
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
            eq(roomInvitations.status, 'pending'),
            eq(privateRooms.isActive, true)
          )
        )
        .orderBy(desc(roomInvitations.createdAt));

      res.json(pendingInvitations);
      
    } catch (error) {
      console.error("❌ Error fetching pending invitations:", error);
      res.status(500).json({ message: "خطأ في جلب الدعوات" });
    }
  });

  // Accept invitation and pay gift to enter room
  app.post('/api/room-invitations/:invitationId/accept', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invitationId = parseInt(req.params.invitationId);

      // Get invitation details
      const invitation = await db
        .select()
        .from(roomInvitations)
        .where(
          and(
            eq(roomInvitations.id, invitationId),
            eq(roomInvitations.toUserId, userId),
            eq(roomInvitations.status, 'pending')
          )
        )
        .limit(1);

      if (!invitation.length) {
        return res.status(404).json({ message: "الدعوة غير موجودة أو منتهية الصلاحية" });
      }

      const giftPrice = invitation[0].giftRequired.price;

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

      // Record transaction
      await db
        .insert(pointTransactions)
        .values({
          userId,
          amount: -giftPrice,
          type: 'private_room_entry',
          description: `دخول غرفة خاصة - ${invitation[0].giftRequired.name}`
        });

      // Update invitation status
      await db
        .update(roomInvitations)
        .set({
          status: 'accepted',
          respondedAt: new Date()
        })
        .where(eq(roomInvitations.id, invitationId));

      // Update room status
      await db
        .update(privateRooms)
        .set({
          invitationAccepted: true,
          giftPaid: true,
          roomStarted: true
        })
        .where(eq(privateRooms.id, invitation[0].roomId));

      console.log(`✅ User ${userId} accepted invitation ${invitationId} and paid ${giftPrice} points`);
      
      res.json({
        roomId: invitation[0].roomId,
        message: "تم قبول الدعوة ودفع الهدية، يمكنك الآن الدخول للغرفة"
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

      const result = await db
        .update(roomInvitations)
        .set({
          status: 'declined',
          respondedAt: new Date()
        })
        .where(
          and(
            eq(roomInvitations.id, invitationId),
            eq(roomInvitations.toUserId, userId),
            eq(roomInvitations.status, 'pending')
          )
        )
        .returning();

      if (!result.length) {
        return res.status(404).json({ message: "الدعوة غير موجودة" });
      }

      res.json({ message: "تم رفض الدعوة" });
      
    } catch (error) {
      console.error("❌ Error declining invitation:", error);
      res.status(500).json({ message: "خطأ في رفض الدعوة" });
    }
  });

  // Get active private rooms for user
  app.get('/api/private-rooms/active', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const activeRooms = await db
        .select({
          id: privateRooms.id,
          title: privateRooms.title,
          description: privateRooms.description,
          hostId: privateRooms.hostId,
          invitedUserId: privateRooms.invitedUserId,
          giftRequired: privateRooms.giftRequired,
          roomStarted: privateRooms.roomStarted,
          createdAt: privateRooms.createdAt,
          // Other user details (not the current user)
          otherUserUsername: users.username,
          otherUserFirstName: users.firstName,
          otherUserProfileImage: users.profileImageUrl
        })
        .from(privateRooms)
        .innerJoin(
          users,
          or(
            eq(users.id, privateRooms.hostId),
            eq(users.id, privateRooms.invitedUserId)
          )
        )
        .where(
          and(
            or(
              eq(privateRooms.hostId, userId),
              eq(privateRooms.invitedUserId, userId)
            ),
            eq(privateRooms.isActive, true),
            eq(privateRooms.roomStarted, true)
          )
        )
        .orderBy(desc(privateRooms.createdAt));

      // Filter to get the other user's details (not current user)
      const filteredRooms = activeRooms.filter(room => 
        (room.hostId === userId && room.otherUserUsername !== req.user.username) ||
        (room.invitedUserId === userId && room.otherUserUsername !== req.user.username)
      );

      res.json(filteredRooms);
      
    } catch (error) {
      console.error("❌ Error fetching active rooms:", error);
      res.status(500).json({ message: "خطأ في جلب الغرف النشطة" });
    }
  });

  console.log("✅ Private room routes configured");
}