import {
  users,
  streams,
  giftCharacters,
  gifts,
  chatMessages,
  pointTransactions,
  followers,
  memoryFragments,
  memoryInteractions,
  memoryCollections,
  fragmentCollections,
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
  type MemoryFragment,
  type InsertMemoryFragment,
  type MemoryInteraction,
  type InsertMemoryInteraction,
  type MemoryCollection,
  type InsertMemoryCollection,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'> & { passwordHash: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  isUsernameAvailable(username: string): Promise<boolean>;
  
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
  getSuggestedUsers(): Promise<any[]>;
  
  // Memory Fragment operations
  createMemoryFragment(fragment: InsertMemoryFragment): Promise<MemoryFragment>;
  getUserMemoryFragments(userId: string): Promise<MemoryFragment[]>;
  getPublicMemoryFragments(): Promise<MemoryFragment[]>;
  getMemoryFragmentById(id: number): Promise<MemoryFragment | undefined>;
  addMemoryInteraction(interaction: InsertMemoryInteraction): Promise<MemoryInteraction>;
  updateMemoryFragmentEnergy(id: number, energyChange: number): Promise<void>;
  getExpiredMemoryFragments(): Promise<MemoryFragment[]>;
  deleteExpiredMemoryFragments(): Promise<void>;
  
  // Memory Collection operations
  createMemoryCollection(collection: InsertMemoryCollection): Promise<MemoryCollection>;
  getUserMemoryCollections(userId: string): Promise<MemoryCollection[]>;
  addFragmentToCollection(fragmentId: number, collectionId: number): Promise<void>;
  
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'> & { passwordHash: string }): Promise<User> {
    const id = nanoid();
    const [user] = await db
      .insert(users)
      .values({
        id,
        ...userData,
        points: 100,
        role: 'user',
        isPrivateAccount: false,
        allowDirectMessages: true,
        allowGiftsFromStrangers: true,
      })
      .returning();
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

  async isUsernameAvailable(username: string): Promise<boolean> {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    return !existingUser;
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

  async getPublicMemoryFragments(): Promise<MemoryFragment[]> {
    return await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.visibilityLevel, 'public'))
      .orderBy(desc(memoryFragments.createdAt))
      .limit(50);
  }

  async getSuggestedUsers(): Promise<any[]> {
    // Get users with most memories and recent activity
    return await db
      .select({
        id: users.id,
        firstName: users.firstName,
        username: sql`COALESCE(${users.firstName}, 'مستخدم')`.as('username'),
        profileImageUrl: users.profileImageUrl,
        totalMemories: sql<number>`COUNT(${memoryFragments.id})`.as('totalMemories'),
        isFollowing: sql<boolean>`false`.as('isFollowing') // This would need actual follow check
      })
      .from(users)
      .leftJoin(memoryFragments, eq(users.id, memoryFragments.authorId))
      .groupBy(users.id, users.firstName, users.profileImageUrl)
      .orderBy(desc(sql`COUNT(${memoryFragments.id})`))
      .limit(20);
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

  // Memory Fragment operations
  async createMemoryFragment(fragmentData: InsertMemoryFragment): Promise<MemoryFragment> {
    // Calculate expiration based on memory type
    const expiresAt = new Date();
    switch (fragmentData.memoryType) {
      case 'fleeting':
        expiresAt.setHours(expiresAt.getHours() + 24); // 1 day
        break;
      case 'precious':
        expiresAt.setDate(expiresAt.getDate() + 7); // 1 week
        break;
      case 'legendary':
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month
        break;
      default:
        expiresAt.setHours(expiresAt.getHours() + 24);
    }
    
    const [fragment] = await db
      .insert(memoryFragments)
      .values({
        ...fragmentData,
        expiresAt,
      })
      .returning();
    return fragment;
  }

  async getUserMemoryFragments(userId: string): Promise<MemoryFragment[]> {
    return await db
      .select()
      .from(memoryFragments)
      .where(and(
        eq(memoryFragments.authorId, userId),
        eq(memoryFragments.isActive, true)
      ))
      .orderBy(desc(memoryFragments.createdAt));
  }

  async getMemoryFragmentById(id: number): Promise<MemoryFragment | undefined> {
    const [fragment] = await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.id, id));
    return fragment;
  }

  async addMemoryInteraction(interactionData: InsertMemoryInteraction): Promise<MemoryInteraction> {
    // Add the interaction
    const [interaction] = await db
      .insert(memoryInteractions)
      .values(interactionData)
      .returning();

    // Update fragment counters and energy
    const energyBoost = interactionData.energyBoost || 1;
    
    switch (interactionData.type) {
      case 'view':
        await db
          .update(memoryFragments)
          .set({
            viewCount: sql`${memoryFragments.viewCount} + 1`,
            currentEnergy: sql`LEAST(100, ${memoryFragments.currentEnergy} + ${energyBoost})`
          })
          .where(eq(memoryFragments.id, interactionData.fragmentId));
        break;
      case 'like':
        await db
          .update(memoryFragments)
          .set({
            likeCount: sql`${memoryFragments.likeCount} + 1`,
            currentEnergy: sql`LEAST(100, ${memoryFragments.currentEnergy} + ${energyBoost * 2})`
          })
          .where(eq(memoryFragments.id, interactionData.fragmentId));
        break;
      case 'share':
        await db
          .update(memoryFragments)
          .set({
            shareCount: sql`${memoryFragments.shareCount} + 1`,
            currentEnergy: sql`LEAST(100, ${memoryFragments.currentEnergy} + ${energyBoost * 3})`
          })
          .where(eq(memoryFragments.id, interactionData.fragmentId));
        break;
      case 'gift':
        await db
          .update(memoryFragments)
          .set({
            giftCount: sql`${memoryFragments.giftCount} + 1`,
            currentEnergy: sql`LEAST(100, ${memoryFragments.currentEnergy} + ${energyBoost * 5})`
          })
          .where(eq(memoryFragments.id, interactionData.fragmentId));
        break;
    }

    return interaction;
  }

  async updateMemoryFragmentEnergy(id: number, energyChange: number): Promise<void> {
    await db
      .update(memoryFragments)
      .set({
        currentEnergy: sql`GREATEST(0, LEAST(100, ${memoryFragments.currentEnergy} + ${energyChange}))`,
        updatedAt: new Date()
      })
      .where(eq(memoryFragments.id, id));
  }

  async getExpiredMemoryFragments(): Promise<MemoryFragment[]> {
    const now = new Date();
    return await db
      .select()
      .from(memoryFragments)
      .where(and(
        eq(memoryFragments.isActive, true),
        sql`${memoryFragments.expiresAt} < ${now} OR ${memoryFragments.currentEnergy} <= 0`
      ));
  }

  async deleteExpiredMemoryFragments(): Promise<void> {
    const now = new Date();
    await db
      .update(memoryFragments)
      .set({ isActive: false })
      .where(and(
        eq(memoryFragments.isActive, true),
        sql`${memoryFragments.expiresAt} < ${now} OR ${memoryFragments.currentEnergy} <= 0`
      ));
  }

  // Memory Collection operations
  async createMemoryCollection(collectionData: InsertMemoryCollection): Promise<MemoryCollection> {
    const [collection] = await db
      .insert(memoryCollections)
      .values(collectionData)
      .returning();
    return collection;
  }

  async getUserMemoryCollections(userId: string): Promise<MemoryCollection[]> {
    return await db
      .select()
      .from(memoryCollections)
      .where(eq(memoryCollections.authorId, userId))
      .orderBy(desc(memoryCollections.createdAt));
  }

  async addFragmentToCollection(fragmentId: number, collectionId: number): Promise<void> {
    await db.insert(fragmentCollections).values({
      fragmentId,
      collectionId,
    });

    // Update collection fragment count
    await db
      .update(memoryCollections)
      .set({
        fragmentCount: sql`${memoryCollections.fragmentCount} + 1`
      })
      .where(eq(memoryCollections.id, collectionId));
  }
}

export const storage = new DatabaseStorage();
