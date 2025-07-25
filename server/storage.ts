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
  virtualPets,
  gardenItems,
  userInventory,
  gardenActivities,
  gardenVisits,
  petAchievements,
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
  type VirtualPet,
  type InsertVirtualPet,
  type GardenItem,
  type InsertGardenItem,
  type UserInventory,
  type InsertUserInventory,
  type GardenActivity,
  type InsertGardenActivity,
  type GardenVisit,
  type InsertGardenVisit,
  type PetAchievement,
  type InsertPetAchievement,
  gameRooms,
  gameParticipants,
  playerRankings,
  gardenSupport,
  userProfiles,
  type GameRoom,
  type InsertGameRoom,
  type GameParticipant,
  type InsertGameParticipant,
  type PlayerRanking,
  type InsertPlayerRanking,
  type GardenSupport,
  type InsertGardenSupport,
  type UserProfile,
  type InsertUserProfile,
  privateMessages,
  messageRequests,
  type PrivateMessage,
  type InsertPrivateMessage,
  type MessageRequest,
  type InsertMessageRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, ne } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'> & { passwordHash: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  isUsernameAvailable(username: string): Promise<boolean>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Stream operations
  createStream(stream: InsertStream): Promise<Stream>;
  getActiveStreams(): Promise<Stream[]>;
  getStreamById(id: number): Promise<Stream | undefined>;
  updateStreamViewerCount(id: number, count: number): Promise<void>;
  endStream(id: number): Promise<void>;
  deleteStream(id: number): Promise<void>;
  
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

  // Virtual Pet Garden operations
  getUserPet(userId: string): Promise<VirtualPet | undefined>;
  createPet(userId: string, name?: string): Promise<VirtualPet>;
  feedPet(userId: string, itemId?: string): Promise<VirtualPet>;
  playWithPet(userId: string): Promise<VirtualPet>;
  getGardenItems(): Promise<GardenItem[]>;
  buyGardenItem(userId: string, itemId: string, quantity: number): Promise<UserInventory>;
  getUserInventory(userId: string): Promise<UserInventory[]>;
  visitGarden(visitorId: string, hostId: string, giftItemId?: string): Promise<GardenVisit>;
  getFriendGarden(friendId: string): Promise<{ pet: VirtualPet; user: User } | undefined>;
  getGardenActivities(userId: string): Promise<GardenActivity[]>;
  getPetAchievements(userId: string): Promise<PetAchievement[]>;
  getAllUsersWithPets(currentUserId: string): Promise<Array<{ user: User; pet: VirtualPet | null }>>;
  
  // Game system operations
  createGameRoom(gameRoom: InsertGameRoom): Promise<GameRoom>;
  joinGameRoom(roomId: string, userId: string, petId?: string): Promise<GameParticipant>;
  getGameRooms(gameType?: string): Promise<GameRoom[]>;
  getGameRoom(roomId: string): Promise<GameRoom | undefined>;
  updateGameRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom>;
  getPlayerRanking(userId: string, gameType: string): Promise<PlayerRanking | undefined>;
  updatePlayerRanking(userId: string, gameType: string, updates: Partial<PlayerRanking>): Promise<PlayerRanking>;
  
  // Garden support operations
  supportGarden(support: InsertGardenSupport): Promise<GardenSupport>;
  getGardenSupport(gardenOwnerId: string): Promise<GardenSupport[]>;
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile>;
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

  // Stream operations
  async createStream(streamData: InsertStream): Promise<Stream> {
    const [stream] = await db.insert(streams).values(streamData).returning();
    return stream;
  }

  async getActiveStreams(): Promise<any[]> {
    const streamsWithHosts = await db
      .select({
        stream: streams,
        host: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(streams)
      .innerJoin(users, eq(streams.hostId, users.id))
      .where(eq(streams.isLive, true))
      .orderBy(desc(streams.viewerCount));
    
    // Flatten the data structure
    return streamsWithHosts.map(({ stream, host }) => ({
      ...stream,
      hostProfileImage: host.profileImageUrl,
      hostName: host.firstName || host.username
    }));
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

  async deleteStream(id: number): Promise<void> {
    // Delete chat messages for this stream first
    await db.delete(chatMessages).where(eq(chatMessages.streamId, id));
    
    // Delete gifts for this stream
    await db.delete(gifts).where(eq(gifts.streamId, id));
    
    // Delete the stream itself
    await db.delete(streams).where(eq(streams.id, id));
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
  
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    return user;
  }
  
  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followedId, followedId)
        )
      );
    return !!result;
  }

  async getFollowCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.followedId, userId));
    return result.count;
  }
  
  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(followers)
      .where(eq(followers.followerId, userId));
    return result.count;
  }
  
  async getFollowers(userId: string): Promise<any[]> {
    const followersList = await db
      .select({
        follower: users,
        followedAt: followers.createdAt
      })
      .from(followers)
      .innerJoin(users, eq(followers.followerId, users.id))
      .where(eq(followers.followedId, userId))
      .orderBy(desc(followers.createdAt));
    return followersList;
  }
  
  async getFollowing(userId: string): Promise<any[]> {
    const followingList = await db
      .select({
        following: users,
        followedAt: followers.createdAt
      })
      .from(followers)
      .innerJoin(users, eq(followers.followedId, users.id))
      .where(eq(followers.followerId, userId))
      .orderBy(desc(followers.createdAt));
    return followingList;
  }
  
  // Message Request operations
  async createMessageRequest(data: InsertMessageRequest): Promise<MessageRequest> {
    const [request] = await db.insert(messageRequests).values(data).returning();
    return request;
  }
  
  async getMessageRequest(senderId: string, receiverId: string): Promise<MessageRequest | undefined> {
    const [request] = await db
      .select()
      .from(messageRequests)
      .where(
        and(
          eq(messageRequests.senderId, senderId),
          eq(messageRequests.receiverId, receiverId)
        )
      );
    return request;
  }

  async getPublicMemoryFragments(): Promise<any[]> {
    const memories = await db
      .select({
        memory: memoryFragments,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(memoryFragments)
      .innerJoin(users, eq(memoryFragments.authorId, users.id))
      .where(eq(memoryFragments.visibilityLevel, 'public'))
      .orderBy(desc(memoryFragments.createdAt))
      .limit(50);
    
    // Flatten the data structure
    return memories.map(({ memory, author }) => ({
      ...memory,
      author
    }));
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
    const fragments = await db
      .select({
        id: memoryFragments.id,
        authorId: memoryFragments.authorId,
        type: memoryFragments.type,
        title: memoryFragments.title,
        caption: memoryFragments.caption,
        mediaUrls: memoryFragments.mediaUrls,
        thumbnailUrl: memoryFragments.thumbnailUrl,
        currentEnergy: memoryFragments.currentEnergy,
        initialEnergy: memoryFragments.initialEnergy,
        memoryType: memoryFragments.memoryType,
        viewCount: memoryFragments.viewCount,
        likeCount: memoryFragments.likeCount,
        shareCount: memoryFragments.shareCount,
        giftCount: memoryFragments.giftCount,
        visibilityLevel: memoryFragments.visibilityLevel,
        allowComments: memoryFragments.allowComments,
        allowSharing: memoryFragments.allowSharing,
        allowGifts: memoryFragments.allowGifts,
        expiresAt: memoryFragments.expiresAt,
        createdAt: memoryFragments.createdAt,
        updatedAt: memoryFragments.updatedAt,
        isActive: memoryFragments.isActive,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          points: users.points,
          isStreamer: users.isStreamer,
        },
      })
      .from(memoryFragments)
      .leftJoin(users, eq(memoryFragments.authorId, users.id))
      .where(eq(memoryFragments.id, id));
    
    return fragments.length > 0 ? fragments[0] as any : undefined;
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

  // Virtual Pet Garden operations implementation
  async getUserPet(userId: string): Promise<VirtualPet | undefined> {
    const [pet] = await db
      .select()
      .from(virtualPets)
      .where(eq(virtualPets.userId, userId));
    return pet;
  }

  async createPet(userId: string, name: string = "أرنوب الصغير"): Promise<VirtualPet> {
    const [pet] = await db
      .insert(virtualPets)
      .values({
        userId,
        name,
        type: "rabbit",
        health: 80,
        happiness: 60,
        level: 1,
        experience: 0,
        lastFed: new Date(),
        lastPlayed: new Date(),
      })
      .returning();
    return pet;
  }

  async feedPet(userId: string, itemId?: string): Promise<VirtualPet> {
    const pet = await this.getUserPet(userId);
    if (!pet) {
      throw new Error("Pet not found");
    }

    // Calculate health and happiness boost
    let healthBoost = 10;
    let happinessBoost = 5;
    let experienceGain = 5;

    if (itemId) {
      // Get item details for better boost
      const [item] = await db
        .select()
        .from(gardenItems)
        .where(eq(gardenItems.id, itemId));
      
      if (item) {
        healthBoost += item.healthBoost || 0;
        happinessBoost += item.happinessBoost || 0;
        experienceGain += item.experienceBoost || 0;
      }
    }

    // Update pet stats
    const newHealth = Math.min(100, pet.health + healthBoost);
    const newHappiness = Math.min(100, pet.happiness + happinessBoost);
    const newExperience = pet.experience + experienceGain;
    
    // Check for level up
    const newLevel = Math.floor(newExperience / 100) + 1;

    const [updatedPet] = await db
      .update(virtualPets)
      .set({
        health: newHealth,
        happiness: newHappiness,
        experience: newExperience,
        level: newLevel,
        lastFed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, pet.id))
      .returning();

    // Log the activity
    await db.insert(gardenActivities).values({
      userId,
      petId: pet.id,
      activityType: "feed",
      itemUsed: itemId,
      healthChange: healthBoost,
      happinessChange: happinessBoost,
      experienceGained: experienceGain,
    });

    return updatedPet;
  }

  async playWithPet(userId: string): Promise<VirtualPet> {
    const pet = await this.getUserPet(userId);
    if (!pet) {
      throw new Error("Pet not found");
    }

    // Playing increases happiness and experience
    const happinessBoost = 15;
    const experienceGain = 8;

    const newHappiness = Math.min(100, pet.happiness + happinessBoost);
    const newExperience = pet.experience + experienceGain;
    const newLevel = Math.floor(newExperience / 100) + 1;

    const [updatedPet] = await db
      .update(virtualPets)
      .set({
        happiness: newHappiness,
        experience: newExperience,
        level: newLevel,
        lastPlayed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, pet.id))
      .returning();

    // Log the activity
    await db.insert(gardenActivities).values({
      userId,
      petId: pet.id,
      activityType: "play",
      happinessChange: happinessBoost,
      experienceGained: experienceGain,
    });

    return updatedPet;
  }

  async getGardenItems(): Promise<GardenItem[]> {
    return await db
      .select()
      .from(gardenItems)
      .orderBy(gardenItems.type, gardenItems.price);
  }

  async buyGardenItem(userId: string, itemId: string, quantity: number): Promise<UserInventory> {
    // Get item details
    const [item] = await db
      .select()
      .from(gardenItems)
      .where(eq(gardenItems.id, itemId));

    if (!item) {
      throw new Error("Item not found");
    }

    // Get user points
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const totalCost = item.price * quantity;
    if ((user.points || 0) < totalCost) {
      throw new Error("Insufficient points");
    }

    // Deduct points
    await db
      .update(users)
      .set({ points: (user.points || 0) - totalCost })
      .where(eq(users.id, userId));

    // Add to inventory or update quantity
    const [existingInventory] = await db
      .select()
      .from(userInventory)
      .where(
        and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      );

    if (existingInventory) {
      const [updatedInventory] = await db
        .update(userInventory)
        .set({ quantity: existingInventory.quantity + quantity })
        .where(eq(userInventory.id, existingInventory.id))
        .returning();
      return updatedInventory;
    } else {
      const [newInventory] = await db
        .insert(userInventory)
        .values({
          userId,
          itemId,
          quantity,
        })
        .returning();
      return newInventory;
    }
  }

  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return await db
      .select({
        id: userInventory.id,
        userId: userInventory.userId,
        itemId: userInventory.itemId,
        quantity: userInventory.quantity,
        createdAt: userInventory.createdAt,
        item: gardenItems,
      })
      .from(userInventory)
      .innerJoin(gardenItems, eq(userInventory.itemId, gardenItems.id))
      .where(eq(userInventory.userId, userId));
  }

  async visitGarden(visitorId: string, hostId: string, giftItemId?: string): Promise<GardenVisit> {
    const hostPet = await this.getUserPet(hostId);
    if (!hostPet) {
      throw new Error("Host pet not found");
    }

    const [visit] = await db
      .insert(gardenVisits)
      .values({
        visitorId,
        hostId,
        petId: hostPet.id,
        giftGiven: giftItemId,
      })
      .returning();

    return visit;
  }

  async getFriendGarden(friendId: string): Promise<{ pet: VirtualPet; user: User } | undefined> {
    const friend = await this.getUser(friendId);
    if (!friend) {
      return undefined;
    }

    const pet = await this.getUserPet(friendId);
    if (!pet) {
      return undefined;
    }

    return { pet, user: friend };
  }

  async getGardenActivities(userId: string): Promise<GardenActivity[]> {
    return await db
      .select()
      .from(gardenActivities)
      .where(eq(gardenActivities.userId, userId))
      .orderBy(desc(gardenActivities.createdAt))
      .limit(50);
  }

  async getPetAchievements(userId: string): Promise<PetAchievement[]> {
    return await db
      .select()
      .from(petAchievements)
      .where(eq(petAchievements.userId, userId))
      .orderBy(desc(petAchievements.createdAt));
  }

  async getAllUsersWithPets(currentUserId: string): Promise<Array<{ user: User; pet: VirtualPet | null }>> {
    const usersWithPets = await db
      .select({
        user: users,
        pet: virtualPets,
      })
      .from(users)
      .leftJoin(virtualPets, eq(users.id, virtualPets.userId))
      .where(ne(users.id, currentUserId))
      .limit(10); // Get up to 10 friends

    return usersWithPets;
  }

  // Game system operations
  async createGameRoom(gameRoom: InsertGameRoom): Promise<GameRoom> {
    const [room] = await db.insert(gameRooms).values(gameRoom).returning();
    return room;
  }

  async joinGameRoom(roomId: string, userId: string, petId?: string): Promise<GameParticipant> {
    const room = await this.getGameRoom(roomId);
    if (!room) {
      throw new Error('Game room not found');
    }
    
    if (room.currentPlayers >= room.maxPlayers) {
      throw new Error('Game room is full');
    }

    const existingParticipant = await db
      .select()
      .from(gameParticipants)
      .where(and(eq(gameParticipants.roomId, roomId), eq(gameParticipants.userId, userId)));
    
    if (existingParticipant.length > 0) {
      return existingParticipant[0];
    }

    const [participant] = await db
      .insert(gameParticipants)
      .values({
        roomId,
        userId,
        petId,
        pointsSpent: room.entryFee
      })
      .returning();

    await db
      .update(gameRooms)
      .set({ 
        currentPlayers: room.currentPlayers + 1,
        prizePool: room.prizePool + room.entryFee
      })
      .where(eq(gameRooms.id, roomId));

    if (room.entryFee > 0) {
      await db
        .update(users)
        .set({ points: sql`${users.points} - ${room.entryFee}` })
        .where(eq(users.id, userId));
    }

    return participant;
  }

  async getGameRooms(gameType?: string): Promise<GameRoom[]> {
    if (gameType) {
      return await db
        .select()
        .from(gameRooms)
        .where(and(eq(gameRooms.gameType, gameType), eq(gameRooms.status, 'waiting')))
        .orderBy(desc(gameRooms.createdAt));
    }
    
    return await db
      .select()
      .from(gameRooms)
      .where(eq(gameRooms.status, 'waiting'))
      .orderBy(desc(gameRooms.createdAt));
  }

  async getGameRoom(roomId: string): Promise<GameRoom | undefined> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
    return room;
  }

  async updateGameRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> {
    const [room] = await db
      .update(gameRooms)
      .set(updates)
      .where(eq(gameRooms.id, roomId))
      .returning();
    return room;
  }

  async getPlayerRanking(userId: string, gameType: string): Promise<PlayerRanking | undefined> {
    const [ranking] = await db
      .select()
      .from(playerRankings)
      .where(and(eq(playerRankings.userId, userId), eq(playerRankings.gameType, gameType)));
    return ranking;
  }

  async updatePlayerRanking(userId: string, gameType: string, updates: Partial<PlayerRanking>): Promise<PlayerRanking> {
    const existing = await this.getPlayerRanking(userId, gameType);
    
    if (existing) {
      const [ranking] = await db
        .update(playerRankings)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(playerRankings.userId, userId), eq(playerRankings.gameType, gameType)))
        .returning();
      return ranking;
    } else {
      const [ranking] = await db
        .insert(playerRankings)
        .values({
          userId,
          gameType,
          ...updates
        })
        .returning();
      return ranking;
    }
  }

  async supportGarden(support: InsertGardenSupport): Promise<GardenSupport> {
    const [gardenSupportRecord] = await db.insert(gardenSupport).values(support).returning();
    
    await db
      .update(userProfiles)
      .set({ 
        totalSupportReceived: sql`${userProfiles.totalSupportReceived} + ${support.amount}`,
        updatedAt: new Date()
      })
      .where(eq(userProfiles.userId, support.gardenOwnerId));

    await db
      .update(userProfiles)
      .set({ 
        totalSupportGiven: sql`${userProfiles.totalSupportGiven} + ${support.amount}`,
        updatedAt: new Date()
      })
      .where(eq(userProfiles.userId, support.supporterId));

    return gardenSupportRecord;
  }

  async getGardenSupport(gardenOwnerId: string): Promise<GardenSupport[]> {
    return await db
      .select()
      .from(gardenSupport)
      .where(eq(gardenSupport.gardenOwnerId, gardenOwnerId))
      .orderBy(desc(gardenSupport.createdAt));
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProfiles)
        .values({
          userId,
          ...profile
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
