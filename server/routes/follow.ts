import type { Express } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { requireAuth } from "../localAuth";
import { followers, users } from "@shared/schema";

export function setupFollowRoutes(app: Express) {
  // Follow/Unfollow a user
  app.post('/api/users/:userId/follow', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followedId = req.params.userId;

      if (followerId === followedId) {
        return res.status(400).json({ 
          success: false, 
          message: "لا يمكنك متابعة نفسك" 
        });
      }

      // Check if user exists
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, followedId))
        .limit(1);

      if (userExists.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "المستخدم غير موجود" 
        });
      }

      // Check if already following
      const existingFollow = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followedId, followedId)
          )
        )
        .limit(1);

      if (existingFollow.length > 0) {
        // Unfollow
        await db
          .delete(followers)
          .where(
            and(
              eq(followers.followerId, followerId),
              eq(followers.followedId, followedId)
            )
          );

        res.json({ 
          success: true, 
          action: 'unfollow',
          message: "تم إلغاء المتابعة" 
        });
      } else {
        // Follow
        await db
          .insert(followers)
          .values({
            followerId,
            followedId
          });

        res.json({ 
          success: true, 
          action: 'follow',
          message: "تم متابعة المستخدم بنجاح" 
        });
      }

    } catch (error) {
      console.error("Error in follow/unfollow:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ في الخادم" 
      });
    }
  });

  // Check follow status
  app.get('/api/users/:userId/follow-status', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followedId = req.params.userId;

      const isFollowing = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followedId, followedId)
          )
        )
        .limit(1);

      res.json({ 
        isFollowing: isFollowing.length > 0 
      });

    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ 
        isFollowing: false, 
        message: "حدث خطأ في فحص حالة المتابعة" 
      });
    }
  });

  // Get user's followers
  app.get('/api/users/:userId/followers', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;

      const followersList = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl,
          followedAt: followers.createdAt
        })
        .from(followers)
        .innerJoin(users, eq(followers.followerId, users.id))
        .where(eq(followers.followedId, userId))
        .orderBy(followers.createdAt);

      res.json(followersList);

    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ 
        message: "حدث خطأ في جلب المتابعين" 
      });
    }
  });

  // Get users that a user is following
  app.get('/api/users/:userId/following', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;

      const followingList = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl,
          followedAt: followers.createdAt
        })
        .from(followers)
        .innerJoin(users, eq(followers.followedId, users.id))
        .where(eq(followers.followerId, userId))
        .orderBy(followers.createdAt);

      res.json(followingList);

    } catch (error) {
      console.error("Error fetching following list:", error);
      res.status(500).json({ 
        message: "حدث خطأ في جلب قائمة المتابَعين" 
      });
    }
  });
}