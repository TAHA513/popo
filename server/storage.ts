import {
  users,
  giftCharacters,
  pointTransactions,
  followers,
  memoryFragments,
  memoryInteractions,
  memoryCollections,
  fragmentCollections,
  type User,
  type UpsertUser,
  type GiftCharacter,
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
  privateMessages,
  messageRequests,
  type PrivateMessage,
  type InsertPrivateMessage,
  type MessageRequest,
  type InsertMessageRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'> & { passwordHash: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  isUsernameAvailable(username: string): Promise<boolean>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Gift operations (character definitions only)
  getGiftCharacters(): Promise<GiftCharacter[]>;
  
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
  getAppStats(): Promise<{
    activeUsers: number;
    totalMemories: number;
    dailyRevenue: number;
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
    const [user] = await db.insert(users).values({
      id: nanoid(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    }).returning();
    return user;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    return !existingUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Gift operations
  async getGiftCharacters(): Promise<GiftCharacter[]> {
    return await db
      .select()
      .from(giftCharacters)
      .where(eq(giftCharacters.isActive, true))
      .orderBy(giftCharacters.pointCost);
  }

  // Point operations
  async addPointTransaction(transactionData: InsertPointTransaction): Promise<PointTransaction> {
    const [transaction] = await db
      .insert(pointTransactions)
      .values(transactionData)
      .returning();

    // Update user's point balance
    await db
      .update(users)
      .set({
        points: sql`${users.points} + ${transactionData.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, transactionData.userId));

    return transaction;
  }

  async getUserPointBalance(userId: string): Promise<number> {
    const [user] = await db
      .select({ points: users.points })
      .from(users)
      .where(eq(users.id, userId));
    return user?.points || 0;
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
    return result?.count || 0;
  }

  async getSuggestedUsers(): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
      })
      .from(users)
      .limit(10);
  }

  // Memory Fragment operations
  async createMemoryFragment(fragmentData: InsertMemoryFragment): Promise<MemoryFragment> {
    const [fragment] = await db
      .insert(memoryFragments)
      .values(fragmentData)
      .returning();
    return fragment;
  }

  async getUserMemoryFragments(userId: string): Promise<MemoryFragment[]> {
    return await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.authorId, userId))
      .orderBy(desc(memoryFragments.createdAt));
  }

  async getPublicMemoryFragments(): Promise<MemoryFragment[]> {
    return await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.visibilityLevel, 'public'))
      .orderBy(desc(memoryFragments.createdAt))
      .limit(50);
  }

  async getMemoryFragmentById(id: number): Promise<MemoryFragment | undefined> {
    const [fragment] = await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.id, id));
    return fragment;
  }

  async addMemoryInteraction(interactionData: InsertMemoryInteraction): Promise<MemoryInteraction> {
    const [interaction] = await db
      .insert(memoryInteractions)
      .values(interactionData)
      .returning();

    // Update memory fragment counters
    const updateData: any = {};
    if (interactionData.type === 'like') {
      updateData.likeCount = sql`${memoryFragments.likeCount} + 1`;
    } else if (interactionData.type === 'share') {
      updateData.shareCount = sql`${memoryFragments.shareCount} + 1`;
    } else if (interactionData.type === 'gift') {
      updateData.giftCount = sql`${memoryFragments.giftCount} + 1`;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(memoryFragments)
        .set(updateData)
        .where(eq(memoryFragments.id, interactionData.memoryFragmentId));
    }

    return interaction;
  }

  async updateMemoryFragmentEnergy(id: number, energyChange: number): Promise<void> {
    await db
      .update(memoryFragments)
      .set({
        currentEnergy: sql`GREATEST(0, ${memoryFragments.currentEnergy} + ${energyChange})`,
        updatedAt: new Date(),
      })
      .where(eq(memoryFragments.id, id));
  }

  // Stream operations
  async createStream(streamData: InsertStream): Promise<Stream> {
    const [stream] = await db
      .insert(streams)
      .values(streamData)
      .returning();
    return stream;
  }

  async getStreams(): Promise<Stream[]> {
    return await db
      .select()
      .from(streams)
      .where(eq(streams.isActive, true))
      .orderBy(desc(streams.createdAt));
  }

  async endUserStreams(userId: string): Promise<void> {
    await db
      .update(streams)
      .set({ isActive: false })
      .where(eq(streams.hostId, userId));
  }

  async getExpiredMemoryFragments(): Promise<MemoryFragment[]> {
    return await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.currentEnergy, 0));
  }

  async deleteExpiredMemoryFragments(): Promise<void> {
    await db
      .delete(memoryFragments)
      .where(eq(memoryFragments.currentEnergy, 0));
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
      .where(eq(memoryCollections.creatorId, userId))
      .orderBy(desc(memoryCollections.createdAt));
  }

  async addFragmentToCollection(fragmentId: number, collectionId: number): Promise<void> {
    await db
      .insert(fragmentCollections)
      .values({ fragmentId, collectionId });

    // Update collection count
    await db
      .update(memoryCollections)
      .set({
        fragmentCount: sql`${memoryCollections.fragmentCount} + 1`,
      })
      .where(eq(memoryCollections.id, collectionId));
  }

  // Admin operations
  async getAppStats(): Promise<{ activeUsers: number; totalMemories: number; dailyRevenue: number }> {
    const [userCount] = await db
      .select({ count: count() })
      .from(users);

    const [memoryCount] = await db
      .select({ count: count() })
      .from(memoryFragments);

    return {
      activeUsers: userCount?.count || 0,
      totalMemories: memoryCount?.count || 0,
      dailyRevenue: 0, // Placeholder for revenue calculation
    };
  }
}

export const storage = new DatabaseStorage();