import {
  users,
  streams,
  giftCharacters,
  gifts,
  chatMessages,
  pointTransactions,
  followers,
  blockedUsers,
  premiumAlbums,
  premiumAlbumMedia,
  premiumAlbumPurchases,
  premiumMessages,
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
  privateAlbums,
  albumPhotos,
  albumAccess,
  walletTransactions,
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
  type BlockedUser,
  type InsertBlockedUser,
  type PremiumAlbum,
  type InsertPremiumAlbum,
  type PremiumAlbumMedia,
  type InsertPremiumAlbumMedia,
  type PremiumAlbumPurchase,
  type InsertPremiumAlbumPurchase,
  type PremiumMessage,
  type InsertPremiumMessage,
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
  type PrivateAlbum,
  type InsertPrivateAlbum,
  type AlbumPhoto,
  type InsertAlbumPhoto,
  type AlbumAccess,
  type InsertAlbumAccess,
  type WalletTransaction,
  type InsertWalletTransaction,
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
  gameCharacters,
  type GameCharacter,
  type InsertGameCharacter,
  userCharacters,
  type UserCharacter,
  type InsertUserCharacter,
  characterItems,
  type CharacterItem,
  type InsertCharacterItem,
  userCharacterItems,
  type UserCharacterItem,
  type InsertUserCharacterItem,
  voiceChatRooms,
  type VoiceChatRoom,
  type InsertVoiceChatRoom,
  voiceChatParticipants,
  type VoiceChatParticipant,
  type InsertVoiceChatParticipant,
  type InsertComment,
  type Comment,
  comments,
  memoryViews,
  type MemoryView,
  type InsertMemoryView,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, ne, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
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
  getGiftCharacterById(id: number): Promise<GiftCharacter | undefined>;
  getGiftById(id: number): Promise<GiftCharacter | undefined>;
  sendGift(giftData: InsertGift): Promise<Gift>;
  getReceivedGifts(userId: string): Promise<Gift[]>;
  getSentGifts(userId: string): Promise<Gift[]>;
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
  searchUsers(query: string): Promise<User[]>;
  isUserFollowing(followerId: string, followedId: string): Promise<boolean>;
  
  // Conversation operations
  findConversation(user1Id: string, user2Id: string): Promise<any | undefined>;
  createConversation(conversation: any): Promise<any>;
  getConversationById(id: number, userId: string): Promise<any | undefined>;
  getConversationMessages(conversationId: number, userId: string): Promise<any[]>;
  createDirectMessage(message: any): Promise<any>;
  updateConversationLastMessage(conversationId: number, lastMessage: string): Promise<void>;
  
  // Memory Fragment operations
  createMemoryFragment(fragment: InsertMemoryFragment): Promise<MemoryFragment>;
  getUserMemoryFragments(userId: string): Promise<MemoryFragment[]>;
  getPublicMemoryFragments(): Promise<MemoryFragment[]>;
  getMemoryFragmentById(id: number): Promise<MemoryFragment | undefined>;
  addMemoryInteraction(interaction: InsertMemoryInteraction): Promise<MemoryInteraction>;
  updateMemoryFragmentEnergy(id: number, energyChange: number): Promise<void>;
  getExpiredMemoryFragments(): Promise<MemoryFragment[]>;
  deleteExpiredMemoryFragments(): Promise<void>;
  
  // Comments operations
  addComment(comment: InsertComment): Promise<Comment>;
  getComments(postId: number, postType: string): Promise<Comment[]>;
  
  // Memory Views operations
  recordMemoryView(memoryId: number, viewerId: string): Promise<void>;
  getMemoryViewCount(memoryId: number): Promise<number>;
  
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

  // Private Album operations
  createPrivateAlbum(album: InsertPrivateAlbum): Promise<PrivateAlbum>;
  getUserAlbums(userId: string): Promise<PrivateAlbum[]>;
  getAlbumById(albumId: number): Promise<PrivateAlbum | undefined>;
  updateAlbum(albumId: number, updates: Partial<PrivateAlbum>): Promise<PrivateAlbum>;
  deleteAlbum(albumId: number): Promise<void>;
  
  // Album Photo operations
  addPhotoToAlbum(photo: InsertAlbumPhoto): Promise<AlbumPhoto>;
  getAlbumPhotos(albumId: number): Promise<AlbumPhoto[]>;
  getPhotoById(photoId: number): Promise<AlbumPhoto | undefined>;
  updatePhoto(photoId: number, updates: Partial<AlbumPhoto>): Promise<AlbumPhoto>;
  deletePhoto(photoId: number): Promise<void>;
  
  // Album Access operations
  purchaseAlbumAccess(access: InsertAlbumAccess): Promise<AlbumAccess>;
  checkAlbumAccess(buyerId: string, albumId: number): Promise<AlbumAccess | undefined>;
  checkPhotoAccess(buyerId: string, photoId: number): Promise<AlbumAccess | undefined>;
  getUserAlbumPurchases(userId: string): Promise<AlbumAccess[]>;
  
  // Wallet operations
  addWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getUserTransactions(userId: string): Promise<WalletTransaction[]>;
  getUserEarnings(userId: string): Promise<{ totalEarnings: number; monthlyEarnings: number }>;

  // Block/unblock users
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isUserBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  // Premium Albums
  createPremiumAlbum(album: InsertPremiumAlbum): Promise<PremiumAlbum>;
  getPremiumAlbums(creatorId: string): Promise<PremiumAlbum[]>;
  getPremiumAlbum(albumId: number): Promise<PremiumAlbum | undefined>;
  updatePremiumAlbum(albumId: number, updates: Partial<InsertPremiumAlbum>): Promise<PremiumAlbum>;
  deletePremiumAlbum(albumId: number): Promise<void>;
  
  // Premium Messages  
  getPremiumMessages(userId: string): Promise<any[]>;
  getPremiumMessage(messageId: number): Promise<any | null>;
  createPremiumMessage(data: any): Promise<any>;
  processAlbumUnlock(buyerId: string, sellerId: string, messageId: number, amount: number): Promise<void>;
  
  // Premium Album Media
  addAlbumMedia(media: InsertPremiumAlbumMedia): Promise<PremiumAlbumMedia>;
  getAlbumMedia(albumId: number): Promise<PremiumAlbumMedia[]>;
  removeAlbumMedia(mediaId: number): Promise<void>;
  
  // Album Purchases
  purchasePremiumAlbum(purchase: InsertPremiumAlbumPurchase): Promise<PremiumAlbumPurchase>;
  getUserPurchases(userId: string): Promise<PremiumAlbumPurchase[]>;
  checkPremiumAlbumAccess(albumId: number, userId: string): Promise<boolean>;
  
  // Premium Messages
  sendPremiumMessage(message: InsertPremiumMessage): Promise<PremiumMessage>;
  unlockPremiumMessage(messageId: number, userId: string): Promise<PremiumMessage>;
  getPremiumMessages(userId: string): Promise<PremiumMessage[]>;
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

  async updateStream(id: number, updates: Partial<Stream>): Promise<Stream> {
    const [updatedStream] = await db
      .update(streams)
      .set(updates)
      .where(eq(streams.id, id))
      .returning();
    return updatedStream;
  }

  // Gift operations
  async getGiftCharacters(): Promise<GiftCharacter[]> {
    return await db
      .select()
      .from(giftCharacters)
      .where(eq(giftCharacters.isActive, true));
  }

  async getGiftCharacterById(id: number): Promise<GiftCharacter | undefined> {
    const [character] = await db
      .select()
      .from(giftCharacters)
      .where(eq(giftCharacters.id, id));
    return character;
  }

  async getGiftById(id: number): Promise<GiftCharacter | undefined> {
    const [character] = await db
      .select()
      .from(giftCharacters)
      .where(eq(giftCharacters.id, id));
    return character;
  }

  async getReceivedGifts(userId: string): Promise<Gift[]> {
    return await db
      .select()
      .from(gifts)
      .where(eq(gifts.receiverId, userId))
      .orderBy(desc(gifts.sentAt))
      .limit(50);
  }

  async getSentGifts(userId: string): Promise<Gift[]> {
    return await db
      .select()
      .from(gifts)
      .where(eq(gifts.senderId, userId))
      .orderBy(desc(gifts.sentAt))
      .limit(50);
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
    
    // Update memory gift count if it's for a memory
    if (giftData.memoryId) {
      await db
        .update(memoryFragments)
        .set({ giftCount: sql`${memoryFragments.giftCount} + 1` })
        .where(eq(memoryFragments.id, giftData.memoryId));
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
    let expiresAt: Date | null = null;
    
    if (fragmentData.memoryType !== 'permanent') {
      expiresAt = new Date();
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
    }
    // For 'permanent' type, expiresAt remains null (never expires)
    
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
        ne(memoryFragments.memoryType, 'permanent'), // Exclude permanent memories
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
        ne(memoryFragments.memoryType, 'permanent'), // Exclude permanent memories
        sql`${memoryFragments.expiresAt} < ${now} OR ${memoryFragments.currentEnergy} <= 0`
      ));
  }

  // Comment operations
  async addComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();
    return comment;
  }

  async getComments(postId: number, postType: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.postId, postId),
          eq(comments.postType, postType)
        )
      )
      .orderBy(desc(comments.createdAt));
  }

  // Memory Views operations
  async recordMemoryView(memoryId: number, viewerId: string): Promise<void> {
    try {
      // Try to insert a new view record
      await db
        .insert(memoryViews)
        .values({
          memoryId,
          viewerId,
        });
      
      // Increment the view count on the memory
      await db
        .update(memoryFragments)
        .set({
          viewCount: sql`${memoryFragments.viewCount} + 1`,
          currentEnergy: sql`LEAST(100, ${memoryFragments.currentEnergy} + 1)` // Small energy boost
        })
        .where(eq(memoryFragments.id, memoryId));
    } catch (error) {
      // If duplicate view (same user viewing same memory), ignore the error
      // This prevents counting multiple views from the same user
    }
  }

  async getMemoryViewCount(memoryId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(memoryViews)
      .where(eq(memoryViews.memoryId, memoryId));
    
    return result[0]?.count || 0;
  }

  // Point Package operations
  async getPointPackages(): Promise<PointPackage[]> {
    return await db
      .select()
      .from(pointPackages)
      .where(eq(pointPackages.isActive, true))
      .orderBy(pointPackages.displayOrder, pointPackages.pointAmount);
  }

  async createPointPackage(packageData: InsertPointPackage): Promise<PointPackage> {
    const [pointPackage] = await db
      .insert(pointPackages)
      .values(packageData)
      .returning();
    return pointPackage;
  }

  // Point Transaction operations
  async createPointTransaction(transactionData: InsertPointTransaction): Promise<PointTransaction> {
    const [transaction] = await db
      .insert(pointTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getUserPointTransactions(userId: string, limit: number = 20): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit);
  }

  async purchasePoints(userId: string, packageId: number, stripePaymentId?: string): Promise<{ success: boolean; newBalance: number }> {
    // Get the package details
    const [pointPackage] = await db
      .select()
      .from(pointPackages)
      .where(and(
        eq(pointPackages.id, packageId),
        eq(pointPackages.isActive, true)
      ));

    if (!pointPackage) {
      throw new Error('حزمة النقاط غير موجودة أو غير متاحة');
    }

    const totalPoints = pointPackage.pointAmount + pointPackage.bonusPoints;

    // Start transaction
    return await db.transaction(async (tx) => {
      // Update user points
      await tx
        .update(users)
        .set({
          points: sql`${users.points} + ${totalPoints}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Create point transaction record
      await tx
        .insert(pointTransactions)
        .values({
          userId,
          amount: totalPoints,
          type: 'payment',
          description: `شراء ${pointPackage.name} - ${totalPoints} نقطة`,
          stripePaymentId,
          paymentStatus: 'completed'
        });

      // Get updated balance
      const [updatedUser] = await tx
        .select({ points: users.points })
        .from(users)
        .where(eq(users.id, userId));

      return {
        success: true,
        newBalance: updatedUser?.points || 0
      };
    });
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

  // Character System
  async getAvailableCharacters(): Promise<GameCharacter[]> {
    return db.select().from(gameCharacters);
  }

  async getUserCharacters(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: userCharacters.id,
        userId: userCharacters.userId,
        characterId: userCharacters.characterId,
        level: userCharacters.level,
        experience: userCharacters.experience,
        currentStats: userCharacters.currentStats,
        equipment: userCharacters.equipment,
        customization: userCharacters.customization,
        purchasedAt: userCharacters.purchasedAt,
        lastUsed: userCharacters.lastUsed,
        character: gameCharacters,
      })
      .from(userCharacters)
      .leftJoin(gameCharacters, eq(userCharacters.characterId, gameCharacters.id))
      .where(eq(userCharacters.userId, userId));
    
    return result;
  }

  async purchaseCharacter(userId: string, characterId: string): Promise<UserCharacter> {
    const [userCharacter] = await db
      .insert(userCharacters)
      .values({
        userId,
        characterId,
        level: 1,
        experience: 0,
        currentStats: null,
        equipment: null,
        customization: null,
      })
      .returning();
    return userCharacter;
  }

  async getCharacterById(characterId: string): Promise<GameCharacter | undefined> {
    const [character] = await db.select().from(gameCharacters).where(eq(gameCharacters.id, characterId));
    return character;
  }

  async selectUserCharacter(userId: string, userCharacterId: string): Promise<void> {
    // Update user profile to set selected character
    await db
      .update(userProfiles)
      .set({ selectedCharacterId: userCharacterId })
      .where(eq(userProfiles.userId, userId));
  }

  // Voice Chat System
  async createVoiceChatRoom(gameRoomId: string): Promise<VoiceChatRoom> {
    const [chatRoom] = await db
      .insert(voiceChatRooms)
      .values({ gameRoomId })
      .returning();
    return chatRoom;
  }

  async getVoiceChatRoom(gameRoomId: string): Promise<VoiceChatRoom | undefined> {
    const [room] = await db.select().from(voiceChatRooms)
      .where(and(eq(voiceChatRooms.gameRoomId, gameRoomId), eq(voiceChatRooms.isActive, true)));
    return room;
  }

  async joinVoiceChat(chatRoomId: string, userId: string): Promise<VoiceChatParticipant> {
    const [participant] = await db
      .insert(voiceChatParticipants)
      .values({ chatRoomId, userId })
      .returning();
    
    // Update participant count
    await db
      .update(voiceChatRooms)
      .set({ currentParticipants: sql`${voiceChatRooms.currentParticipants} + 1` })
      .where(eq(voiceChatRooms.id, chatRoomId));
    
    return participant;
  }

  async leaveVoiceChat(chatRoomId: string, userId: string): Promise<void> {
    await db
      .update(voiceChatParticipants)
      .set({ leftAt: new Date() })
      .where(and(
        eq(voiceChatParticipants.chatRoomId, chatRoomId),
        eq(voiceChatParticipants.userId, userId)
      ));
    
    // Update participant count
    await db
      .update(voiceChatRooms)
      .set({ currentParticipants: sql`${voiceChatRooms.currentParticipants} - 1` })
      .where(eq(voiceChatRooms.id, chatRoomId));
  }

  async getVoiceChatParticipants(chatRoomId: string): Promise<VoiceChatParticipant[]> {
    return db.select().from(voiceChatParticipants)
      .where(and(
        eq(voiceChatParticipants.chatRoomId, chatRoomId),
        sql`${voiceChatParticipants.leftAt} IS NULL`
      ));
  }

  async toggleVoiceMute(chatRoomId: string, userId: string, isMuted: boolean): Promise<void> {
    await db
      .update(voiceChatParticipants)
      .set({ isMuted })
      .where(and(
        eq(voiceChatParticipants.chatRoomId, chatRoomId),
        eq(voiceChatParticipants.userId, userId)
      ));
  }

  // Locked Albums System
  async createLockedAlbum(album: any): Promise<any> {
    try {
      const [newAlbum] = await db.insert(lockedAlbums)
        .values(album)
        .returning();
      return newAlbum;
    } catch (error) {
      console.error("Error creating locked album:", error);
      throw error;
    }
  }

  async getLockedAlbumsByOwner(ownerId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(lockedAlbums)
        .where(and(
          eq(lockedAlbums.ownerId, ownerId),
          eq(lockedAlbums.isActive, true)
        ))
        .orderBy(desc(lockedAlbums.createdAt));
    } catch (error) {
      console.error("Error fetching user's locked albums:", error);
      throw error;
    }
  }

  async getPublicLockedAlbums(): Promise<any[]> {
    try {
      return await db.select({
        id: lockedAlbums.id,
        ownerId: lockedAlbums.ownerId,
        title: lockedAlbums.title,
        description: lockedAlbums.description,
        price: lockedAlbums.price,
        coverImage: lockedAlbums.coverImage,
        createdAt: lockedAlbums.createdAt,
        ownerUsername: users.username,
        ownerProfileImage: users.profileImageUrl,
      })
        .from(lockedAlbums)
        .leftJoin(users, eq(lockedAlbums.ownerId, users.id))
        .where(eq(lockedAlbums.isActive, true))
        .orderBy(desc(lockedAlbums.createdAt));
    } catch (error) {
      console.error("Error fetching public locked albums:", error);
      throw error;
    }
  }

  async addAlbumContent(content: any): Promise<any> {
    try {
      const [newContent] = await db.insert(lockedAlbumContent)
        .values(content)
        .returning();
      return newContent;
    } catch (error) {
      console.error("Error adding album content:", error);
      throw error;
    }
  }

  async getAlbumContent(albumId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(lockedAlbumContent)
        .where(eq(lockedAlbumContent.albumId, albumId))
        .orderBy(lockedAlbumContent.order);
    } catch (error) {
      console.error("Error fetching album content:", error);
      throw error;
    }
  }

  async purchaseAlbum(purchase: any): Promise<any> {
    try {
      const [newPurchase] = await db.insert(albumPurchases)
        .values(purchase)
        .returning();
      return newPurchase;
    } catch (error) {
      console.error("Error purchasing album:", error);
      throw error;
    }
  }

  async hasUserPurchasedAlbum(albumId: string, userId: string): Promise<boolean> {
    try {
      const [purchase] = await db.select()
        .from(albumPurchases)
        .where(and(
          eq(albumPurchases.albumId, albumId),
          eq(albumPurchases.buyerId, userId)
        ));
      return !!purchase;
    } catch (error) {
      console.error("Error checking album purchase:", error);
      throw error;
    }
  }

  async getAlbumPurchases(albumId: string): Promise<any[]> {
    try {
      return await db.select({
        id: albumPurchases.id,
        buyerId: albumPurchases.buyerId,
        price: albumPurchases.price,
        purchasedAt: albumPurchases.purchasedAt,
        buyerUsername: users.username,
        buyerProfileImage: users.profileImageUrl,
      })
        .from(albumPurchases)
        .leftJoin(users, eq(albumPurchases.buyerId, users.id))
        .where(eq(albumPurchases.albumId, albumId))
        .orderBy(desc(albumPurchases.purchasedAt));
    } catch (error) {
      console.error("Error fetching album purchases:", error);
      throw error;
    }
  }

  // Private Content Request System
  async createPrivateContentRequest(request: any): Promise<any> {
    try {
      const [newRequest] = await db.insert(privateContentRequests)
        .values(request)
        .returning();
      return newRequest;
    } catch (error) {
      console.error("Error creating private content request:", error);
      throw error;
    }
  }

  async getPrivateContentRequests(userId: string): Promise<any[]> {
    try {
      return await db.select({
        id: privateContentRequests.id,
        fromUserId: privateContentRequests.fromUserId,
        toUserId: privateContentRequests.toUserId,
        type: privateContentRequests.type,
        description: privateContentRequests.description,
        offeredPrice: privateContentRequests.offeredPrice,
        status: privateContentRequests.status,
        createdAt: privateContentRequests.createdAt,
        requesterUsername: users.username,
        requesterProfileImage: users.profileImageUrl,
      })
        .from(privateContentRequests)
        .leftJoin(users, eq(privateContentRequests.fromUserId, users.id))
        .where(eq(privateContentRequests.toUserId, userId))
        .orderBy(desc(privateContentRequests.createdAt));
    } catch (error) {
      console.error("Error fetching private content requests:", error);
      throw error;
    }
  }

  async updatePrivateContentRequestStatus(requestId: string, status: string, contentUrl?: string): Promise<any> {
    try {
      const updateData: any = { 
        status, 
        respondedAt: new Date() 
      };
      
      if (contentUrl) {
        updateData.contentUrl = contentUrl;
        if (status === 'completed') {
          updateData.completedAt = new Date();
        }
      }

      const [updatedRequest] = await db.update(privateContentRequests)
        .set(updateData)
        .where(eq(privateContentRequests.id, requestId))
        .returning();
      
      return updatedRequest;
    } catch (error) {
      console.error("Error updating content request status:", error);
      throw error;
    }
  }

  async getSentContentRequests(userId: string): Promise<any[]> {
    try {
      return await db.select({
        id: privateContentRequests.id,
        fromUserId: privateContentRequests.fromUserId,
        toUserId: privateContentRequests.toUserId,
        type: privateContentRequests.type,
        description: privateContentRequests.description,
        offeredPrice: privateContentRequests.offeredPrice,
        status: privateContentRequests.status,
        contentUrl: privateContentRequests.contentUrl,
        createdAt: privateContentRequests.createdAt,
        respondedAt: privateContentRequests.respondedAt,
        recipientUsername: users.username,
        recipientProfileImage: users.profileImageUrl,
      })
        .from(privateContentRequests)
        .leftJoin(users, eq(privateContentRequests.toUserId, users.id))
        .where(eq(privateContentRequests.fromUserId, userId))
        .orderBy(desc(privateContentRequests.createdAt));
    } catch (error) {
      console.error("Error fetching sent content requests:", error);
      throw error;
    }
  }

  // User search operations
  async searchUsers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isOnline: users.isOnline,
      })
      .from(users)
      .where(sql`${users.username} ILIKE ${searchPattern}`)
      .limit(20);
  }

  // Check if user is following another user
  async isUserFollowing(followerId: string, followedId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(followers)
      .where(and(
        eq(followers.followerId, followerId),
        eq(followers.followedId, followedId)
      ));
    return !!follow;
  }

  // Conversation operations
  async findConversation(user1Id: string, user2Id: string): Promise<any | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        sql`(${conversations.user1Id} = ${user1Id} AND ${conversations.user2Id} = ${user2Id}) OR (${conversations.user1Id} = ${user2Id} AND ${conversations.user2Id} = ${user1Id})`
      );
    return conversation;
  }

  async createConversation(conversationData: any): Promise<any> {
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async getConversationById(id: number, userId: string): Promise<any | undefined> {
    const [conversation] = await db
      .select({
        id: conversations.id,
        user1Id: conversations.user1Id,
        user2Id: conversations.user2Id,
        lastMessage: conversations.lastMessage,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        otherUser: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          profileImageUrl: users.profileImageUrl,
          isOnline: users.isOnline,
        },
      })
      .from(conversations)
      .leftJoin(
        users,
        sql`${users.id} = CASE WHEN ${conversations.user1Id} = ${userId} THEN ${conversations.user2Id} ELSE ${conversations.user1Id} END`
      )
      .where(
        and(
          eq(conversations.id, id),
          sql`(${conversations.user1Id} = ${userId} OR ${conversations.user2Id} = ${userId})`
        )
      );
    return conversation;
  }

  async getConversationMessages(conversationId: number, userId: string): Promise<any[]> {
    // First verify user is part of conversation
    const conversation = await this.getConversationById(conversationId, userId);
    if (!conversation) {
      return [];
    }

    const otherUserId = conversation.otherUser.id;
    
    return await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: {
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        sql`(${messages.senderId} = ${userId} AND ${messages.recipientId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.recipientId} = ${userId})`
      )
      .orderBy(messages.createdAt);
  }

  async createDirectMessage(messageData: any): Promise<any> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async updateConversationLastMessage(conversationId: number, lastMessage: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        lastMessage,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  // Private Album operations
  async createPrivateAlbum(album: InsertPrivateAlbum): Promise<PrivateAlbum> {
    const [newAlbum] = await db.insert(privateAlbums).values(album).returning();
    return newAlbum;
  }

  async getUserAlbums(userId: string): Promise<PrivateAlbum[]> {
    return await db.select().from(privateAlbums).where(eq(privateAlbums.userId, userId)).orderBy(desc(privateAlbums.createdAt));
  }

  async getAlbumById(albumId: number): Promise<PrivateAlbum | undefined> {
    const [album] = await db.select().from(privateAlbums).where(eq(privateAlbums.id, albumId));
    return album;
  }

  async updateAlbum(albumId: number, updates: Partial<PrivateAlbum>): Promise<PrivateAlbum> {
    const [updatedAlbum] = await db.update(privateAlbums).set({...updates, updatedAt: new Date()}).where(eq(privateAlbums.id, albumId)).returning();
    return updatedAlbum;
  }

  async deleteAlbum(albumId: number): Promise<void> {
    await db.delete(privateAlbums).where(eq(privateAlbums.id, albumId));
  }
  
  // Album Photo operations
  async addPhotoToAlbum(photo: InsertAlbumPhoto): Promise<AlbumPhoto> {
    const [newPhoto] = await db.insert(albumPhotos).values(photo).returning();
    
    // Update album photo count
    await db.update(privateAlbums)
      .set({totalPhotos: sql`${privateAlbums.totalPhotos} + 1`, updatedAt: new Date()})
      .where(eq(privateAlbums.id, photo.albumId));
    
    return newPhoto;
  }

  async getAlbumPhotos(albumId: number): Promise<AlbumPhoto[]> {
    return await db.select().from(albumPhotos).where(eq(albumPhotos.albumId, albumId)).orderBy(desc(albumPhotos.uploadedAt));
  }

  async getPhotoById(photoId: number): Promise<AlbumPhoto | undefined> {
    const [photo] = await db.select().from(albumPhotos).where(eq(albumPhotos.id, photoId));
    return photo;
  }

  async updatePhoto(photoId: number, updates: Partial<AlbumPhoto>): Promise<AlbumPhoto> {
    const [updatedPhoto] = await db.update(albumPhotos).set(updates).where(eq(albumPhotos.id, photoId)).returning();
    return updatedPhoto;
  }

  async deletePhoto(photoId: number): Promise<void> {
    const photo = await this.getPhotoById(photoId);
    if (photo) {
      await db.delete(albumPhotos).where(eq(albumPhotos.id, photoId));
      
      // Update album photo count
      await db.update(privateAlbums)
        .set({totalPhotos: sql`${privateAlbums.totalPhotos} - 1`, updatedAt: new Date()})
        .where(eq(privateAlbums.id, photo.albumId));
    }
  }
  
  // Album Access operations
  async purchaseAlbumAccess(access: InsertAlbumAccess): Promise<AlbumAccess> {
    const [newAccess] = await db.insert(albumAccess).values(access).returning();
    
    // Update album view count
    await db.update(privateAlbums)
      .set({totalViews: sql`${privateAlbums.totalViews} + 1`})
      .where(eq(privateAlbums.id, access.albumId));
    
    return newAccess;
  }

  async checkAlbumAccess(buyerId: string, albumId: number): Promise<AlbumAccess | undefined> {
    const [access] = await db.select().from(albumAccess)
      .where(and(eq(albumAccess.buyerId, buyerId), eq(albumAccess.albumId, albumId), eq(albumAccess.accessType, 'full_album')));
    return access;
  }

  async checkPhotoAccess(buyerId: string, photoId: number): Promise<AlbumAccess | undefined> {
    const [access] = await db.select().from(albumAccess)
      .where(and(eq(albumAccess.buyerId, buyerId), eq(albumAccess.photoId, photoId), eq(albumAccess.accessType, 'single_photo')));
    return access;
  }

  async getUserAlbumPurchases(userId: string): Promise<AlbumAccess[]> {
    return await db.select().from(albumAccess).where(eq(albumAccess.buyerId, userId)).orderBy(desc(albumAccess.purchasedAt));
  }
  
  // Wallet operations
  async addWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await db.insert(walletTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string): Promise<WalletTransaction[]> {
    return await db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt));
  }

  async getUserEarnings(userId: string): Promise<{ totalEarnings: number; monthlyEarnings: number }> {
    const earnings = await db.select({
      total: sql<number>`SUM(CASE WHEN ${walletTransactions.type} IN ('album_sale', 'photo_sale') THEN ${walletTransactions.amount} ELSE 0 END)`,
      monthly: sql<number>`SUM(CASE WHEN ${walletTransactions.type} IN ('album_sale', 'photo_sale') AND ${walletTransactions.createdAt} >= date_trunc('month', now()) THEN ${walletTransactions.amount} ELSE 0 END)`
    }).from(walletTransactions).where(eq(walletTransactions.userId, userId));
    
    return {
      totalEarnings: Number(earnings[0]?.total || 0),
      monthlyEarnings: Number(earnings[0]?.monthly || 0)
    };
  }

  // Block operations
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      await db.insert(blockedUsers).values({
        blockerId,
        blockedId,
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      await db.delete(blockedUsers)
        .where(and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        ));
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const [block] = await db.select()
        .from(blockedUsers)
        .where(and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        ));
      return !!block;
    } catch (error) {
      console.error("Error checking block status:", error);
      return false;
    }
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    try {
      return await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isOnline: users.isOnline,
      })
        .from(blockedUsers)
        .leftJoin(users, eq(blockedUsers.blockedId, users.id))
        .where(eq(blockedUsers.blockerId, userId));
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      throw error;
    }
  }

  // Premium Albums
  async createPremiumAlbum(album: InsertPremiumAlbum): Promise<PremiumAlbum> {
    const [newAlbum] = await db.insert(premiumAlbums).values(album).returning();
    return newAlbum;
  }

  async getPremiumAlbums(creatorId: string): Promise<PremiumAlbum[]> {
    return await db.select().from(premiumAlbums)
      .where(eq(premiumAlbums.creatorId, creatorId))
      .orderBy(desc(premiumAlbums.createdAt));
  }

  async getPremiumAlbum(albumId: number): Promise<PremiumAlbum | undefined> {
    const [album] = await db.select().from(premiumAlbums).where(eq(premiumAlbums.id, albumId));
    return album;
  }

  async updatePremiumAlbum(albumId: number, updates: Partial<InsertPremiumAlbum>): Promise<PremiumAlbum> {
    const [updated] = await db.update(premiumAlbums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(premiumAlbums.id, albumId))
      .returning();
    return updated;
  }

  async deletePremiumAlbum(albumId: number): Promise<void> {
    await db.update(premiumAlbums)
      .set({ isActive: false })
      .where(eq(premiumAlbums.id, albumId));
  }

  // Premium Messages
  async getPremiumMessages(userId: string): Promise<any[]> {
    const senderAlias = alias(users, 'sender');
    const recipientAlias = alias(users, 'recipient');
    
    const messages = await db
      .select({
        id: premiumMessages.id,
        senderId: premiumMessages.senderId,
        recipientId: premiumMessages.recipientId,
        albumId: premiumMessages.albumId,
        message: premiumMessages.message,
        unlockedAt: premiumMessages.unlockedAt,
        createdAt: premiumMessages.createdAt,
        album: {
          id: premiumAlbums.id,
          title: premiumAlbums.title,
          description: premiumAlbums.description,
          coverImageUrl: premiumAlbums.coverImageUrl,
          requiredGiftId: premiumAlbums.requiredGiftId,
          requiredGiftAmount: premiumAlbums.requiredGiftAmount,
          gift: {
            id: giftCharacters.id,
            name: giftCharacters.name,
            emoji: giftCharacters.emoji,
            pointCost: giftCharacters.pointCost,
          },
        },
        sender: {
          id: senderAlias.id,
          firstName: senderAlias.firstName,
          username: senderAlias.username,
          profileImageUrl: senderAlias.profileImageUrl,
        },
        recipient: {
          id: recipientAlias.id,
          firstName: recipientAlias.firstName,
          username: recipientAlias.username,
          profileImageUrl: recipientAlias.profileImageUrl,
        },
      })
      .from(premiumMessages)
      .innerJoin(premiumAlbums, eq(premiumMessages.albumId, premiumAlbums.id))
      .innerJoin(giftCharacters, eq(premiumAlbums.requiredGiftId, giftCharacters.id))
      .innerJoin(senderAlias, eq(premiumMessages.senderId, senderAlias.id))
      .innerJoin(recipientAlias, eq(premiumMessages.recipientId, recipientAlias.id))
      .where(or(eq(premiumMessages.senderId, userId), eq(premiumMessages.recipientId, userId)))
      .orderBy(desc(premiumMessages.createdAt));

    return messages;
  }

  async getPremiumMessage(messageId: number): Promise<any | null> {
    const [message] = await db
      .select()
      .from(premiumMessages)
      .where(eq(premiumMessages.id, messageId));
    
    return message || null;
  }

  async createPremiumMessage(data: {
    senderId: string;
    recipientId: string;
    albumId: number;
    message?: string;
  }): Promise<any> {
    const [message] = await db
      .insert(premiumMessages)
      .values({
        senderId: data.senderId,
        recipientId: data.recipientId,
        albumId: data.albumId,
        message: data.message,
      })
      .returning();

    return message;
  }

  async processAlbumUnlock(
    buyerId: string,
    sellerId: string,
    messageId: number,
    amount: number
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Deduct points from buyer
      await tx
        .update(users)
        .set({ points: sql`${users.points} - ${amount}` })
        .where(eq(users.id, buyerId));

      // Add points to seller (80% of the amount)
      const sellerEarnings = Math.floor(amount * 0.8);
      await tx
        .update(users)
        .set({ points: sql`${users.points} + ${sellerEarnings}` })
        .where(eq(users.id, sellerId));

      // Record the transaction
      await tx.insert(pointTransactions).values({
        userId: buyerId,
        type: 'purchase',
        amount: -amount,
        description: 'Premium album unlock',
      });

      await tx.insert(pointTransactions).values({
        userId: sellerId,
        type: 'earning',
        amount: sellerEarnings,
        description: 'Premium album sale earnings',
      });

      // Mark message as unlocked
      await tx
        .update(premiumMessages)
        .set({ unlockedAt: new Date() })
        .where(eq(premiumMessages.id, messageId));
    });
  }

  // Premium Album Media
  async addAlbumMedia(media: InsertPremiumAlbumMedia): Promise<PremiumAlbumMedia> {
    const [newMedia] = await db.insert(premiumAlbumMedia).values(media).returning();
    
    // Update album's total photos count
    await db.update(premiumAlbums)
      .set({ totalPhotos: sql`${premiumAlbums.totalPhotos} + 1` })
      .where(eq(premiumAlbums.id, media.albumId));
    
    return newMedia;
  }

  async getAlbumMedia(albumId: number): Promise<PremiumAlbumMedia[]> {
    return await db.select().from(premiumAlbumMedia)
      .where(eq(premiumAlbumMedia.albumId, albumId))
      .orderBy(premiumAlbumMedia.orderIndex);
  }

  async removeAlbumMedia(mediaId: number): Promise<void> {
    // First get the album ID to update count
    const [media] = await db.select({ albumId: premiumAlbumMedia.albumId })
      .from(premiumAlbumMedia)
      .where(eq(premiumAlbumMedia.id, mediaId));
    
    if (media) {
      await db.delete(premiumAlbumMedia).where(eq(premiumAlbumMedia.id, mediaId));
      
      // Update album's total photos count
      await db.update(premiumAlbums)
        .set({ totalPhotos: sql`${premiumAlbums.totalPhotos} - 1` })
        .where(eq(premiumAlbums.id, media.albumId));
    }
  }

  // Album Purchases
  async purchasePremiumAlbum(purchase: InsertPremiumAlbumPurchase): Promise<PremiumAlbumPurchase> {
    const [newPurchase] = await db.insert(premiumAlbumPurchases).values(purchase).returning();
    
    // Update album's total views count
    await db.update(premiumAlbums)
      .set({ totalViews: sql`${premiumAlbums.totalViews} + 1` })
      .where(eq(premiumAlbums.id, purchase.albumId));
    
    return newPurchase;
  }

  async getUserPurchases(userId: string): Promise<PremiumAlbumPurchase[]> {
    return await db.select().from(premiumAlbumPurchases)
      .where(eq(premiumAlbumPurchases.buyerId, userId))
      .orderBy(desc(premiumAlbumPurchases.purchasedAt));
  }

  async checkPremiumAlbumAccess(albumId: number, userId: string): Promise<boolean> {
    // Check if user is the creator
    const [album] = await db.select({ creatorId: premiumAlbums.creatorId })
      .from(premiumAlbums)
      .where(eq(premiumAlbums.id, albumId));
    
    if (album && album.creatorId === userId) {
      return true;
    }

    // Check if user has purchased access
    const [purchase] = await db.select()
      .from(premiumAlbumPurchases)
      .where(and(
        eq(premiumAlbumPurchases.albumId, albumId),
        eq(premiumAlbumPurchases.buyerId, userId)
      ));
    
    return !!purchase;
  }

  // Premium Messages
  async sendPremiumMessage(message: InsertPremiumMessage): Promise<PremiumMessage> {
    const [newMessage] = await db.insert(premiumMessages).values(message).returning();
    return newMessage;
  }

  async unlockPremiumMessage(messageId: number, userId: string): Promise<PremiumMessage> {
    const [updated] = await db.update(premiumMessages)
      .set({ 
        isUnlocked: true, 
        unlockedAt: new Date() 
      })
      .where(and(
        eq(premiumMessages.id, messageId),
        eq(premiumMessages.recipientId, userId)
      ))
      .returning();
    return updated;
  }

  async getPremiumMessages(userId: string): Promise<PremiumMessage[]> {
    return await db.select().from(premiumMessages)
      .where(eq(premiumMessages.recipientId, userId))
      .orderBy(desc(premiumMessages.createdAt));
  }
}

export const storage = new DatabaseStorage();
