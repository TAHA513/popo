import {
  users,
  streams,
  giftCharacters,
  gifts,
  chatMessages,
  pointTransactions,
  followers,
  type User,
  type UpsertUser,
  type Stream,
  type InsertStream,
  type GiftCharacter,
  type Gift,
  type InsertGift,
  type ChatMessage,
  type InsertChatMessage,
  type PointTransaction,
  type InsertPointTransaction,
  type Follower,
  type InsertFollower,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Stream operations
  createStream(stream: InsertStream): Promise<Stream>;
  getActiveStreams(): Promise<Stream[]>;
  getStreamById(id: number): Promise<Stream | undefined>;
  updateStreamViewerCount(id: number, count: number): Promise<void>;
  endStream(id: number): Promise<void>;
  
  // Gift operations
  getGiftCharacters(): Promise<GiftCharacter[]>;
  sendGift(gift: InsertGift): Promise<Gift>;
  getStreamGifts(streamId: number): Promise<Gift[]>;
  
  // Chat operations
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getStreamChatMessages(streamId: number, limit?: number): Promise<ChatMessage[]>;
  
  // Point operations
  addPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getUserPointBalance(userId: string): Promise<number>;
  
  // Follow operations
  followUser(followerId: string, followedId: string): Promise<Follower>;
  unfollowUser(followerId: string, followedId: string): Promise<void>;
  getFollowCount(userId: string): Promise<number>;
  
  // Admin operations
  getStreamingStats(): Promise<{
    activeUsers: number;
    liveStreams: number;
    dailyRevenue: number;
    giftsSent: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Stream operations
  async createStream(streamData: InsertStream): Promise<Stream> {
    const [stream] = await db.insert(streams).values(streamData).returning();
    return stream;
  }

  async getActiveStreams(): Promise<Stream[]> {
    return await db
      .select()
      .from(streams)
      .where(eq(streams.isLive, true))
      .orderBy(desc(streams.viewerCount));
  }

  async getStreamById(id: number): Promise<Stream | undefined> {
    const [stream] = await db.select().from(streams).where(eq(streams.id, id));
    return stream;
  }

  async updateStreamViewerCount(id: number, viewerCount: number): Promise<void> {
    await db
      .update(streams)
      .set({ viewerCount })
      .where(eq(streams.id, id));
  }

  async endStream(id: number): Promise<void> {
    await db
      .update(streams)
      .set({ isLive: false, endedAt: new Date() })
      .where(eq(streams.id, id));
  }

  // Gift operations
  async getGiftCharacters(): Promise<GiftCharacter[]> {
    return await db
      .select()
      .from(giftCharacters)
      .where(eq(giftCharacters.isActive, true));
  }

  async sendGift(giftData: InsertGift): Promise<Gift> {
    const [gift] = await db.insert(gifts).values(giftData).returning();
    
    // Update points for sender and receiver
    await db
      .update(users)
      .set({ points: sql`${users.points} - ${giftData.pointCost}` })
      .where(eq(users.id, giftData.senderId));
    
    // Add earning for receiver (60% of points)
    const earning = Math.floor(giftData.pointCost * 0.6);
    await db
      .update(users)
      .set({ 
        points: sql`${users.points} + ${earning}`,
        totalEarnings: sql`${users.totalEarnings} + ${earning * 0.01}` // $0.01 per point
      })
      .where(eq(users.id, giftData.receiverId));
    
    // Update stream gift count
    if (giftData.streamId) {
      await db
        .update(streams)
        .set({ totalGifts: sql`${streams.totalGifts} + 1` })
        .where(eq(streams.id, giftData.streamId));
    }
    
    return gift;
  }

  async getStreamGifts(streamId: number): Promise<Gift[]> {
    return await db
      .select()
      .from(gifts)
      .where(eq(gifts.streamId, streamId))
      .orderBy(desc(gifts.sentAt))
      .limit(50);
  }

  // Chat operations
  async addChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async getStreamChatMessages(streamId: number, limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.streamId, streamId))
      .orderBy(desc(chatMessages.sentAt))
      .limit(limit);
  }

  // Point operations
  async addPointTransaction(transactionData: InsertPointTransaction): Promise<PointTransaction> {
    const [transaction] = await db.insert(pointTransactions).values(transactionData).returning();
    return transaction;
  }

  async getUserPointBalance(userId: string): Promise<number> {
    const [result] = await db
      .select({ points: users.points })
      .from(users)
      .where(eq(users.id, userId));
    return result?.points || 0;
  }

  // Follow operations
  async followUser(followerId: string, followedId: string): Promise<Follower> {
    const [follow] = await db
      .insert(followers)
      .values({ followerId, followedId })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    await db
      .delete(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followedId, followedId)
        )
      );
  }

  async getFollowCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.followedId, userId));
    return result.count;
  }

  // Admin operations
  async getStreamingStats(): Promise<{
    activeUsers: number;
    liveStreams: number;
    dailyRevenue: number;
    giftsSent: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.updatedAt} >= ${today}`);

    const [liveStreamsResult] = await db
      .select({ count: count() })
      .from(streams)
      .where(eq(streams.isLive, true));

    const [dailyRevenueResult] = await db
      .select({ revenue: sql<number>`SUM(${pointTransactions.amount}) * 0.01` })
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.type, 'gift_received'),
          sql`${pointTransactions.createdAt} >= ${today}`
        )
      );

    const [giftsSentResult] = await db
      .select({ count: count() })
      .from(gifts)
      .where(sql`${gifts.sentAt} >= ${today}`);

    return {
      activeUsers: activeUsersResult.count,
      liveStreams: liveStreamsResult.count,
      dailyRevenue: dailyRevenueResult.revenue || 0,
      giftsSent: giftsSentResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
