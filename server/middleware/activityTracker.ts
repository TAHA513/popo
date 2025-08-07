import { db } from "../db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Middleware to track user activity
export function trackUserActivity(req: any, res: any, next: any) {
  if (req.user && req.user.id) {
    // Update user's last activity timestamp asynchronously
    setImmediate(async () => {
      try {
        await db
          .update(users)
          .set({
            lastActivityAt: new Date(),
            lastSeenAt: new Date(),
            isOnline: true,
            onlineStatusUpdatedAt: new Date()
          })
          .where(eq(users.id, req.user.id));
      } catch (error) {
        console.error("Error updating user activity:", error);
      }
    });
  }
  next();
}

// Function to mark user as offline
export async function markUserOffline(userId: string) {
  try {
    await db
      .update(users)
      .set({
        isOnline: false,
        onlineStatusUpdatedAt: new Date()
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("Error marking user offline:", error);
  }
}

// Function to check and update stale online statuses
export async function cleanupStaleOnlineUsers() {
  try {
    // Mark users as offline if they haven't been active for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    await db
      .update(users)
      .set({
        isOnline: false,
        onlineStatusUpdatedAt: new Date()
      })
      .where(
        // Users who are marked online but haven't had activity in 5+ minutes
        sql`is_online = true AND last_activity_at < ${fiveMinutesAgo}`
      );
  } catch (error) {
    console.error("Error cleaning up stale online users:", error);
  }
}