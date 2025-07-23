import { db } from './db';
import { users, gifts } from '@shared/schema';
import { eq, sum } from 'drizzle-orm';

export interface SupporterUpdate {
  userId: string;
  newLevel: number;
  oldLevel: number;
  totalGiftsSent: number;
}

// Calculate supporter level based on total gifts sent
export function calculateSupporterLevel(totalGiftsSent: number): number {
  if (totalGiftsSent >= 250000) return 10; // Ultimate Supporter
  if (totalGiftsSent >= 100000) return 9;  // Legendary Supporter
  if (totalGiftsSent >= 50000) return 8;   // Royal Supporter
  if (totalGiftsSent >= 20000) return 7;   // Platinum Supporter
  if (totalGiftsSent >= 10000) return 6;   // Diamond Supporter
  if (totalGiftsSent >= 5000) return 5;    // Elite Supporter
  if (totalGiftsSent >= 2500) return 4;    // VIP Supporter
  if (totalGiftsSent >= 1000) return 3;    // Supporter
  if (totalGiftsSent >= 500) return 2;     // Super Fan
  if (totalGiftsSent >= 100) return 1;     // Fan
  return 0; // New User
}

// Get supporter badge name based on level
export function getSupporterBadge(level: number): string {
  const badges = [
    'new_user',      // 0
    'fan',           // 1
    'super_fan',     // 2
    'supporter',     // 3
    'vip_supporter', // 4
    'elite_supporter', // 5
    'diamond_supporter', // 6
    'platinum_supporter', // 7
    'royal_supporter', // 8
    'legendary_supporter', // 9
    'ultimate_supporter' // 10
  ];
  return badges[level] || 'new_user';
}

// Update user supporter level after gift sent
export async function updateSupporterLevel(userId: string): Promise<SupporterUpdate | null> {
  try {
    // Calculate total gifts sent by user
    const totalGiftsResult = await db
      .select({ total: sum(gifts.pointCost) })
      .from(gifts)
      .where(eq(gifts.senderId, userId));

    const totalGiftsSent = Number(totalGiftsResult[0]?.total || 0);
    const newLevel = calculateSupporterLevel(totalGiftsSent);
    const newBadge = getSupporterBadge(newLevel);

    // Get current user data
    const currentUser = await db
      .select({ supporterLevel: users.supporterLevel })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const oldLevel = currentUser[0]?.supporterLevel || 0;

    // Only update if level changed
    if (newLevel !== oldLevel) {
      await db
        .update(users)
        .set({
          supporterLevel: newLevel,
          supporterBadge: newBadge,
          totalGiftsSent: totalGiftsSent.toString()
        })
        .where(eq(users.id, userId));

      return {
        userId,
        newLevel,
        oldLevel,
        totalGiftsSent
      };
    }

    // Update total gifts sent even if level didn't change
    await db
      .update(users)
      .set({
        totalGiftsSent: totalGiftsSent.toString()
      })
      .where(eq(users.id, userId));

    return null;
  } catch (error) {
    console.error('Error updating supporter level:', error);
    return null;
  }
}

// Update receiver's total gifts received
export async function updateGiftsReceived(receiverId: string, giftValue: number): Promise<void> {
  try {
    // Get current total
    const currentUser = await db
      .select({ totalGiftsReceived: users.totalGiftsReceived })
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);

    const currentTotal = Number(currentUser[0]?.totalGiftsReceived || 0);
    const newTotal = currentTotal + giftValue;

    await db
      .update(users)
      .set({
        totalGiftsReceived: newTotal.toString()
      })
      .where(eq(users.id, receiverId));

  } catch (error) {
    console.error('Error updating gifts received:', error);
  }
}