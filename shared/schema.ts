import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with local authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  coverImageUrl: varchar("cover_image_url"),
  username: varchar("username").unique().notNull(), // Required and unique
  passwordHash: varchar("password_hash").notNull(), // Required for local auth
  bio: text("bio"),
  countryCode: varchar("country_code", { length: 2 }), // ISO country code (e.g., "US", "SA")
  countryName: varchar("country_name", { length: 100 }), // Country name in English
  countryFlag: varchar("country_flag", { length: 10 }), // Country flag emoji
  points: integer("points").default(100), // Start with 100 points
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  totalGiftsReceived: decimal("total_gifts_received", { precision: 10, scale: 2 }).default("0"), // Track gifts received
  totalGiftsSent: decimal("total_gifts_sent", { precision: 10, scale: 2 }).default("0"), // Track gifts sent
  supporterLevel: integer("supporter_level").default(0), // Supporter level 0-10
  supporterBadge: varchar("supporter_badge"), // Badge type based on level
  isStreamer: boolean("is_streamer").default(false),
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role").default("user").notNull(), // 'user' | 'admin' | 'super_admin'
  // Account privacy settings
  isPrivateAccount: boolean("is_private_account").default(false),
  allowDirectMessages: boolean("allow_direct_messages").default(true),
  allowGiftsFromStrangers: boolean("allow_gifts_from_strangers").default(true),
  showLastSeen: boolean("show_last_seen").default(true), // Show last seen to others
  lastSeenAt: timestamp("last_seen_at").defaultNow(), // Track last activity
  isOnline: boolean("is_online").default(false), // Current online status
  lastActivityAt: timestamp("last_activity_at").defaultNow(), // Track any user activity
  onlineStatusUpdatedAt: timestamp("online_status_updated_at").defaultNow(), // When online status was last updated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table for user notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // User receiving the notification
  fromUserId: varchar("from_user_id").notNull().references(() => users.id), // User who triggered the notification
  type: varchar("type").notNull(), // 'comment', 'like', 'gift', 'share', 'follow', 'message'
  title: text("title").notNull(), // Notification title
  message: text("message").notNull(), // Notification message
  relatedId: integer("related_id"), // ID of related item (memory, comment, gift, etc.)
  relatedType: varchar("related_type"), // Type of related item ('memory', 'comment', 'gift')
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live streams table
export const streams = pgTable("streams", {
  id: serial("id").primaryKey(),
  hostId: varchar("host_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  thumbnailUrl: text("thumbnail_url"),

  isLive: boolean("is_live").default(true),
  viewerCount: integer("viewer_count").default(0),
  totalGifts: integer("total_gifts").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gift characters table
export const giftCharacters = pgTable("gift_characters", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  emoji: varchar("emoji").notNull(),
  description: text("description"),
  pointCost: integer("point_cost").notNull(),
  animationType: varchar("animation_type"),
  isActive: boolean("is_active").default(true),
  // Special features for premium gifts
  hasSound: boolean("has_sound").default(false),
  soundFileUrl: text("sound_file_url"),
  hasSpecialEffects: boolean("has_special_effects").default(false),
  effectDuration: integer("effect_duration").default(3), // Duration in seconds
  isMultiLanguage: boolean("is_multi_language").default(false), // Support different languages
  createdAt: timestamp("created_at").defaultNow(),
});

// Gifts sent table
export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  streamId: integer("stream_id").references(() => streams.id),
  memoryId: integer("memory_id").references(() => memoryFragments.id), // Added for memory gifts
  characterId: integer("character_id").notNull().references(() => giftCharacters.id),
  pointCost: integer("point_cost").notNull(),
  message: text("message"),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull().references(() => streams.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Point transactions table
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: varchar("type").notNull(), // 'purchase', 'gift_sent', 'gift_received', 'withdrawal'
  description: text("description"),
  relatedGiftId: integer("related_gift_id").references(() => gifts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User wallet for earnings from gifts (40% profit from received gifts)
export const userWallets = pgTable("user_wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  totalEarnings: integer("total_earnings").default(0).notNull(), // إجمالي الأرباح
  availableBalance: integer("available_balance").default(0).notNull(), // الرصيد المتاح
  totalWithdrawn: integer("total_withdrawn").default(0).notNull(), // إجمالي المسحوب
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet transactions for tracking earnings and withdrawals
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: varchar("type").notNull(), // 'gift_earning', 'withdrawal', 'bonus', 'album_purchase', 'photo_purchase', 'album_sale', 'photo_sale'
  description: text("description"),
  giftId: integer("gift_id").references(() => gifts.id), // reference to the gift that generated earnings
  relatedUserId: varchar("related_user_id").references(() => users.id), // For album/photo sales
  relatedAlbumId: integer("related_album_id"), // For album transactions
  relatedPhotoId: integer("related_photo_id"), // For photo transactions
  status: varchar("status").default("completed"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



// Alliances - Player groups for cooperative gameplay
export const alliances = pgTable("alliances", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  leaderId: varchar("leader_id").notNull().references(() => users.id),
  maxMembers: integer("max_members").default(50),
  currentMembers: integer("current_members").default(1),
  allianceLevel: integer("alliance_level").default(1),
  totalScore: integer("total_score").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alliance Members
export const allianceMembers = pgTable("alliance_members", {
  id: serial("id").primaryKey(),
  allianceId: integer("alliance_id").notNull().references(() => alliances.id),
  memberId: varchar("member_id").notNull().references(() => users.id),
  role: varchar("role").default("member"), // member, officer, leader
  joinedAt: timestamp("joined_at").defaultNow(),
  contributionScore: integer("contribution_score").default(0),
});

// City Zones - Map areas for Reclaim City game
export const cityZones = pgTable("city_zones", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  difficulty: varchar("difficulty").notNull(), // easy, medium, hard, extreme
  isLiberated: boolean("is_liberated").default(false),
  liberationProgress: integer("liberation_progress").default(0), // 0-100%
  requiredPlayers: integer("required_players").default(1),
  rewards: jsonb("rewards"), // XP, gold, items
  enemyTypes: jsonb("enemy_types"), // Array of enemy configurations
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  unlockLevel: integer("unlock_level").default(1),
});

// Daily Missions
export const dailyMissions = pgTable("daily_missions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  gameType: varchar("game_type").notNull(),
  targetValue: integer("target_value").notNull(), // e.g., kill 10 enemies
  rewardPoints: integer("reward_points").notNull(),
  rewardItems: jsonb("reward_items"), // Additional rewards
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player Mission Progress
export const playerMissionProgress = pgTable("player_mission_progress", {
  id: serial("id").primaryKey(),
  playerId: varchar("player_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => dailyMissions.id),
  currentProgress: integer("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Followers table
export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followedId: varchar("followed_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  blockerId: varchar("blocker_id").notNull().references(() => users.id),
  blockedId: varchar("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium Albums System
export const premiumAlbums = pgTable("premium_albums", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  requiredGiftId: integer("required_gift_id").notNull().references(() => gifts.id),
  requiredGiftAmount: integer("required_gift_amount").notNull().default(1),
  totalPhotos: integer("total_photos").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const premiumAlbumMedia = pgTable("premium_album_media", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => premiumAlbums.id, { onDelete: 'cascade' }),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type").notNull(), // 'image', 'video'
  caption: text("caption"),
  orderIndex: integer("order_index").notNull().default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const premiumAlbumPurchases = pgTable("premium_album_purchases", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => premiumAlbums.id, { onDelete: 'cascade' }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  giftId: integer("gift_id").notNull().references(() => gifts.id),
  giftAmount: integer("gift_amount").notNull(),
  totalCost: integer("total_cost").notNull(), // في النقاط
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Premium Messages System - رسائل مدفوعة
export const premiumMessages = pgTable("premium_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  albumId: integer("album_id").notNull().references(() => premiumAlbums.id, { onDelete: 'cascade' }),
  message: text("message"),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Direct Messages table for TikTok-style chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  messageType: varchar("message_type").default("text"), // 'text', 'image', 'gif', 'sticker'
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations table to track chat threads
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Private chat rooms with gift-based entry
export const privateRooms = pgTable("private_rooms", {
  id: serial("id").primaryKey(),
  hostId: varchar("host_id").notNull().references(() => users.id),
  invitedUserId: varchar("invited_user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  giftRequired: jsonb("gift_required").notNull(), // Gift details including price, name, icon
  entryPrice: integer("entry_price").notNull(), // Points required to enter
  isActive: boolean("is_active").default(true),
  invitationSent: boolean("invitation_sent").default(false),
  invitationAccepted: boolean("invitation_accepted").default(false),
  giftPaid: boolean("gift_paid").default(false),
  roomStarted: boolean("room_started").default(false),
  roomEndedAt: timestamp("room_ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Private room messages
export const privateRoomMessages = pgTable("private_room_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => privateRooms.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // 'text', 'voice', 'image'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room invitations and notifications
export const roomInvitations = pgTable("room_invitations", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => privateRooms.id),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  message: text("message"),
  giftRequired: jsonb("gift_required").notNull(),
  status: varchar("status").default("pending"), // 'pending', 'accepted', 'declined', 'expired'
  expiresAt: timestamp("expires_at"), // Invitation expiry time
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group chat rooms with gift-based entry
export const groupRooms = pgTable("group_rooms", {
  id: serial("id").primaryKey(),
  hostId: varchar("host_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  giftRequired: jsonb("gift_required").notNull(), // Gift details including price, name, icon
  entryPrice: integer("entry_price").notNull(), // Points required to enter
  maxParticipants: integer("max_participants").default(10),
  currentParticipants: integer("current_participants").default(0),
  duration: integer("duration").default(60), // Duration in minutes
  isActive: boolean("is_active").default(true),
  isOpen: boolean("is_open").default(true), // Can people still join?
  roomStartedAt: timestamp("room_started_at").defaultNow(),
  roomEndsAt: timestamp("room_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group room participants
export const groupRoomParticipants = pgTable("group_room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => groupRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  giftPaid: jsonb("gift_paid").notNull(), // Gift details they paid
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
});

// Group room messages
export const groupRoomMessages = pgTable("group_room_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => groupRooms.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // 'text', 'voice', 'image'
  createdAt: timestamp("created_at").defaultNow(),
});

// Private Messages table (legacy)
export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message Requests table
export const messageRequests = pgTable("message_requests", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  initialMessage: text("initial_message").notNull(),
  status: varchar("status").default("pending"), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Memory Fragments - innovative content system
export const memoryFragments = pgTable("memory_fragments", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'image', 'video', 'mixed'
  title: text("title"),
  caption: text("caption"),
  mediaUrls: jsonb("media_urls").notNull(), // Array of media URLs
  thumbnailUrl: text("thumbnail_url"),
  
  // Innovation: Life Energy System
  initialEnergy: integer("initial_energy").default(100), // Starting life force
  currentEnergy: integer("current_energy").default(100), // Current life force
  energyDecayRate: decimal("energy_decay_rate", { precision: 3, scale: 2 }).default("0.5"), // Energy lost per hour
  
  // Engagement metrics that restore energy
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  shareCount: integer("share_count").default(0),
  giftCount: integer("gift_count").default(0),
  
  // Memory classification
  memoryType: varchar("memory_type").default("fleeting"), // 'fleeting', 'precious', 'legendary', 'permanent'
  mood: varchar("mood"), // 'happy', 'nostalgic', 'creative', 'mysterious'
  tags: jsonb("tags"), // Array of tags
  
  // Privacy and visibility settings
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  visibilityLevel: varchar("visibility_level").default("public"), // 'public', 'followers', 'private'
  allowComments: boolean("allow_comments").default(true),
  allowSharing: boolean("allow_sharing").default(true),
  allowGifts: boolean("allow_gifts").default(true),
  expiresAt: timestamp("expires_at"), // When memory fragment disappears
  
  // Location and context
  location: text("location"),
  weather: varchar("weather"),
  timeOfDay: varchar("time_of_day"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Memory Views - track individual views
export const memoryViews = pgTable("memory_views", {
  id: serial("id").primaryKey(),
  memoryId: integer("memory_id").notNull().references(() => memoryFragments.id, { onDelete: 'cascade' }),
  viewerId: varchar("viewer_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
  // Unique constraint to prevent duplicate views from same user
}, (table) => [
  index("memory_views_memory_viewer_idx").on(table.memoryId, table.viewerId),
]);

// Memory Interactions - likes, views, etc.
export const memoryInteractions = pgTable("memory_interactions", {
  id: serial("id").primaryKey(),
  fragmentId: integer("fragment_id").notNull().references(() => memoryFragments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'view', 'like', 'share', 'save', 'gift'
  energyBoost: integer("energy_boost").default(1), // How much energy this interaction adds
  createdAt: timestamp("created_at").defaultNow(),
});

// Memory Collections - thematic groupings
export const memoryCollections = pgTable("memory_collections", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  isPublic: boolean("is_public").default(true),
  fragmentCount: integer("fragment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Many-to-many relationship between fragments and collections
export const fragmentCollections = pgTable("fragment_collections", {
  id: serial("id").primaryKey(),
  fragmentId: integer("fragment_id").notNull().references(() => memoryFragments.id),
  collectionId: integer("collection_id").notNull().references(() => memoryCollections.id),
  addedAt: timestamp("added_at").defaultNow(),
});

// Comments table for memories and streams
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull(), // Can reference memory or stream
  postType: varchar("post_type").notNull(), // 'memory' or 'stream'
  parentId: integer("parent_id"), // For nested replies
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment likes table
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull().references(() => comments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
// Character System - Customizable game characters
export const gameCharacters = pgTable("game_characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // warrior, mage, archer, etc.
  rarity: varchar("rarity").notNull().default("common"), // common, rare, epic, legendary
  baseStats: jsonb("base_stats"), // { strength, agility, intelligence, health }
  appearance: jsonb("appearance"), // { skin, hair, clothes, accessories }
  skills: text("skills").array(),
  isPremium: boolean("is_premium").default(false),
  price: integer("price").default(0), // in points
  description: text("description"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User owned characters and their upgrades
export const userCharacters = pgTable("user_characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  characterId: varchar("character_id").notNull().references(() => gameCharacters.id),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  currentStats: jsonb("current_stats"), // upgraded stats
  equipment: jsonb("equipment"), // equipped items
  customization: jsonb("customization"), // user customizations
  purchasedAt: timestamp("purchased_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

// Character equipment and items
export const characterItems = pgTable("character_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // weapon, armor, accessory
  rarity: varchar("rarity").notNull().default("common"),
  stats: jsonb("stats"), // stat bonuses
  isPremium: boolean("is_premium").default(false),
  price: integer("price").default(0),
  description: text("description"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User inventory of character items
export const userCharacterItems = pgTable("user_character_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: varchar("item_id").notNull().references(() => characterItems.id),
  quantity: integer("quantity").default(1),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Voice chat rooms for games
export const voiceChatRooms = pgTable("voice_chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameRoomId: varchar("game_room_id").references(() => gameRooms.id),
  isActive: boolean("is_active").default(true),
  maxParticipants: integer("max_participants").default(8),
  currentParticipants: integer("current_participants").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice chat participants
export const voiceChatParticipants = pgTable("voice_chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => voiceChatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isMuted: boolean("is_muted").default(false),
  isDeafened: boolean("is_deafened").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Character System Types
export type GameCharacter = typeof gameCharacters.$inferSelect;
export type InsertGameCharacter = typeof gameCharacters.$inferInsert;
export type UserCharacter = typeof userCharacters.$inferSelect;
export type InsertUserCharacter = typeof userCharacters.$inferInsert;
export type CharacterItem = typeof characterItems.$inferSelect;
export type InsertCharacterItem = typeof characterItems.$inferInsert;
export type UserCharacterItem = typeof userCharacterItems.$inferSelect;
export type InsertUserCharacterItem = typeof userCharacterItems.$inferInsert;
export type VoiceChatRoom = typeof voiceChatRooms.$inferSelect;
export type InsertVoiceChatRoom = typeof voiceChatRooms.$inferInsert;
export type VoiceChatParticipant = typeof voiceChatParticipants.$inferSelect;
export type InsertVoiceChatParticipant = typeof voiceChatParticipants.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Notifications types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Create notification schema for validation
export const insertNotificationSchema = createInsertSchema(notifications);
export type InsertNotificationSchema = z.infer<typeof insertNotificationSchema>;

// Virtual Pets System
export const virtualPets = pgTable("virtual_pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull().default("أرنوب الصغير"),
  type: varchar("type").notNull().default("rabbit"), // rabbit, cat, dog, etc.
  health: integer("health").notNull().default(80),
  happiness: integer("happiness").notNull().default(60),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  lastFed: timestamp("last_fed").defaultNow(),
  lastPlayed: timestamp("last_played").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Garden Items that users can buy for their pets
export const gardenItems = pgTable("garden_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description"),
  emoji: varchar("emoji").notNull(),
  type: varchar("type").notNull(), // food, toy, decoration, clothing
  price: integer("price").notNull(),
  healthBoost: integer("health_boost").default(0),
  happinessBoost: integer("happiness_boost").default(0),
  experienceBoost: integer("experience_boost").default(0),
  rarity: varchar("rarity").notNull().default("common"), // common, rare, epic, legendary
  createdAt: timestamp("created_at").defaultNow(),
});

// User's inventory of garden items
export const userInventory = pgTable("user_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  itemId: varchar("item_id").references(() => gardenItems.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Garden activities log
export const gardenActivities = pgTable("garden_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  petId: varchar("pet_id").references(() => virtualPets.id).notNull(),
  activityType: varchar("activity_type").notNull(), // feed, play, clean, visit
  itemUsed: varchar("item_used"), // if applicable
  healthChange: integer("health_change").default(0),
  happinessChange: integer("happiness_change").default(0),
  experienceGained: integer("experience_gained").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Garden visits between friends
export const gardenVisits = pgTable("garden_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: varchar("visitor_id").references(() => users.id).notNull(),
  hostId: varchar("host_id").references(() => users.id).notNull(),
  petId: varchar("pet_id").references(() => virtualPets.id).notNull(),
  giftGiven: varchar("gift_given"), // item id if gift was given
  createdAt: timestamp("created_at").defaultNow(),
});

// Pet achievements and milestones
export const petAchievements = pgTable("pet_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  petId: varchar("pet_id").references(() => virtualPets.id).notNull(),
  achievementType: varchar("achievement_type").notNull(), // level_up, max_health, friendship, etc.
  achievementValue: integer("achievement_value").notNull(),
  unlocked: boolean("unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game rooms for multiplayer games
export const gameRooms = pgTable("game_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameType: varchar("game_type").notNull(), // pet-race, treasure-hunt, etc.
  hostId: varchar("host_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: varchar("description"),
  maxPlayers: integer("max_players").notNull().default(4),
  currentPlayers: integer("current_players").notNull().default(1),
  status: varchar("status").notNull().default("waiting"), // waiting, playing, finished
  entryFee: integer("entry_fee").notNull().default(0), // points required to join
  prizePool: integer("prize_pool").notNull().default(0),
  isPrivate: boolean("is_private").notNull().default(false),
  gameData: text("game_data"), // JSON data for game state
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
});

// Game room participants
export const gameParticipants = pgTable("game_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").references(() => gameRooms.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  petId: varchar("pet_id").references(() => virtualPets.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  score: integer("score").default(0),
  position: integer("position"), // final ranking
  pointsSpent: integer("points_spent").default(0),
  pointsWon: integer("points_won").default(0),
  isReady: boolean("is_ready").default(false),
});

// Player rankings and leaderboards
export const playerRankings = pgTable("player_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameType: varchar("game_type").notNull(),
  totalGames: integer("total_games").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalPointsSpent: integer("total_points_spent").notNull().default(0),
  totalPointsWon: integer("total_points_won").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  rank: varchar("rank").notNull().default("bronze"), // bronze, silver, gold, platinum, diamond
  lastPlayed: timestamp("last_played"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Garden support system (monetization)
export const gardenSupport = pgTable("garden_support", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").references(() => users.id).notNull(),
  gardenOwnerId: varchar("garden_owner_id").references(() => users.id).notNull(),
  supportType: varchar("support_type").notNull(), // monthly, one-time, gift
  amount: integer("amount").notNull(), // points or real money amount
  currency: varchar("currency").notNull().default("points"), // points, usd, etc.
  message: text("message"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  endsAt: timestamp("ends_at"),
});

// Enhanced user profiles for gardens
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bio: text("bio"),
  favoriteGame: varchar("favorite_game"),
  gardenTheme: varchar("garden_theme").default("default"),
  totalSupportReceived: integer("total_support_received").default(0),
  totalSupportGiven: integer("total_support_given").default(0),
  gardenLevel: integer("garden_level").default(1),
  gardenExperience: integer("garden_experience").default(0),
  isPublic: boolean("is_public").default(true),
  allowVisitors: boolean("allow_visitors").default(true),
  allowGifts: boolean("allow_gifts").default(true),
  customizations: text("customizations"), // JSON for garden decorations
  achievements: text("achievements"), // JSON array of achievement IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const virtualPetsRelations = relations(virtualPets, ({ one, many }) => ({
  owner: one(users, { fields: [virtualPets.userId], references: [users.id] }),
  activities: many(gardenActivities),
  achievements: many(petAchievements),
  visits: many(gardenVisits),
}));

export const gardenItemsRelations = relations(gardenItems, ({ many }) => ({
  inventory: many(userInventory),
}));

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(users, { fields: [userInventory.userId], references: [users.id] }),
  item: one(gardenItems, { fields: [userInventory.itemId], references: [gardenItems.id] }),
}));

export const gardenActivitiesRelations = relations(gardenActivities, ({ one }) => ({
  user: one(users, { fields: [gardenActivities.userId], references: [users.id] }),
  pet: one(virtualPets, { fields: [gardenActivities.petId], references: [virtualPets.id] }),
}));

export const gardenVisitsRelations = relations(gardenVisits, ({ one }) => ({
  visitor: one(users, { fields: [gardenVisits.visitorId], references: [users.id] }),
  host: one(users, { fields: [gardenVisits.hostId], references: [users.id] }),
  pet: one(virtualPets, { fields: [gardenVisits.petId], references: [virtualPets.id] }),
}));

export const petAchievementsRelations = relations(petAchievements, ({ one }) => ({
  user: one(users, { fields: [petAchievements.userId], references: [users.id] }),
  pet: one(virtualPets, { fields: [petAchievements.petId], references: [virtualPets.id] }),
}));

export const gameRoomsRelations = relations(gameRooms, ({ one, many }) => ({
  host: one(users, { fields: [gameRooms.hostId], references: [users.id] }),
  participants: many(gameParticipants),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  room: one(gameRooms, { fields: [gameParticipants.roomId], references: [gameRooms.id] }),
  user: one(users, { fields: [gameParticipants.userId], references: [users.id] }),
  pet: one(virtualPets, { fields: [gameParticipants.petId], references: [virtualPets.id] }),
}));

export const playerRankingsRelations = relations(playerRankings, ({ one }) => ({
  user: one(users, { fields: [playerRankings.userId], references: [users.id] }),
}));

export const gardenSupportRelations = relations(gardenSupport, ({ one }) => ({
  supporter: one(users, { fields: [gardenSupport.supporterId], references: [users.id] }),
  gardenOwner: one(users, { fields: [gardenSupport.gardenOwnerId], references: [users.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

// Private Photo Albums
export const privateAlbums = pgTable("private_albums", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  albumType: varchar("album_type").notNull(), // 'locked_album' or 'individual_photos'
  giftRequired: jsonb("gift_required"), // Gift details for locked albums
  accessPrice: integer("access_price").default(0), // Points required for locked albums
  isActive: boolean("is_active").default(true),
  totalPhotos: integer("total_photos").default(0),
  totalViews: integer("total_views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Private Album Photos
export const albumPhotos = pgTable("album_photos", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => privateAlbums.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  giftRequired: jsonb("gift_required"), // Gift details for individual photos
  accessPrice: integer("access_price").default(0), // Points required for individual photos
  totalViews: integer("total_views").default(0),
  isActive: boolean("is_active").default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Album Access Purchases
export const albumAccess = pgTable("album_access", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => privateAlbums.id),
  photoId: integer("photo_id").references(() => albumPhotos.id), // For individual photo access
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  accessType: varchar("access_type").notNull(), // 'full_album' or 'single_photo'
  giftPaid: jsonb("gift_paid").notNull(), // Gift details that were paid
  amountPaid: integer("amount_paid").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiry for access
});

// Enhanced Wallet Transactions for all types including album purchases

// Private Album Relations
export const privateAlbumsRelations = relations(privateAlbums, ({ one, many }) => ({
  user: one(users, { fields: [privateAlbums.userId], references: [users.id] }),
  photos: many(albumPhotos),
  access: many(albumAccess),
}));

export const albumPhotosRelations = relations(albumPhotos, ({ one, many }) => ({
  album: one(privateAlbums, { fields: [albumPhotos.albumId], references: [privateAlbums.id] }),
  access: many(albumAccess),
}));

export const albumAccessRelations = relations(albumAccess, ({ one }) => ({
  album: one(privateAlbums, { fields: [albumAccess.albumId], references: [privateAlbums.id] }),
  photo: one(albumPhotos, { fields: [albumAccess.photoId], references: [albumPhotos.id] }),
  buyer: one(users, { fields: [albumAccess.buyerId], references: [users.id] }),
  seller: one(users, { fields: [albumAccess.sellerId], references: [users.id] }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, { fields: [walletTransactions.userId], references: [users.id] }),
  gift: one(gifts, { fields: [walletTransactions.giftId], references: [gifts.id] }),
}));

// Types
export type PrivateAlbum = typeof privateAlbums.$inferSelect;
export type InsertPrivateAlbum = typeof privateAlbums.$inferInsert;
export type AlbumPhoto = typeof albumPhotos.$inferSelect;
export type InsertAlbumPhoto = typeof albumPhotos.$inferInsert;
export type AlbumAccess = typeof albumAccess.$inferSelect;
export type InsertAlbumAccess = typeof albumAccess.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

export type VirtualPet = typeof virtualPets.$inferSelect;
export type InsertVirtualPet = typeof virtualPets.$inferInsert;
export type GardenItem = typeof gardenItems.$inferSelect;
export type InsertGardenItem = typeof gardenItems.$inferInsert;
export type UserInventory = typeof userInventory.$inferSelect;
export type InsertUserInventory = typeof userInventory.$inferInsert;
export type GardenActivity = typeof gardenActivities.$inferSelect;
export type InsertGardenActivity = typeof gardenActivities.$inferInsert;
export type GardenVisit = typeof gardenVisits.$inferSelect;
export type InsertGardenVisit = typeof gardenVisits.$inferInsert;
export type PetAchievement = typeof petAchievements.$inferSelect;
export type InsertPetAchievement = typeof petAchievements.$inferInsert;

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = typeof gameRooms.$inferInsert;

export type GameParticipant = typeof gameParticipants.$inferSelect;
export type InsertGameParticipant = typeof gameParticipants.$inferInsert;

export type PlayerRanking = typeof playerRankings.$inferSelect;
export type InsertPlayerRanking = typeof playerRankings.$inferInsert;

export type GardenSupport = typeof gardenSupport.$inferSelect;
export type InsertGardenSupport = typeof gardenSupport.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type InsertStream = typeof streams.$inferInsert;
export type Stream = typeof streams.$inferSelect;

export type InsertGiftCharacter = typeof giftCharacters.$inferInsert;
export type GiftCharacter = typeof giftCharacters.$inferSelect;

export type InsertGift = typeof gifts.$inferInsert;
export type Gift = typeof gifts.$inferSelect;

export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertPointTransaction = typeof pointTransactions.$inferInsert;
export type PointTransaction = typeof pointTransactions.$inferSelect;

export type InsertFollower = typeof followers.$inferInsert;
export type Follower = typeof followers.$inferSelect;

export type InsertBlockedUser = typeof blockedUsers.$inferInsert;
export type BlockedUser = typeof blockedUsers.$inferSelect;

export type InsertPremiumAlbum = typeof premiumAlbums.$inferInsert;
export type PremiumAlbum = typeof premiumAlbums.$inferSelect;

export type InsertPremiumAlbumMedia = typeof premiumAlbumMedia.$inferInsert;
export type PremiumAlbumMedia = typeof premiumAlbumMedia.$inferSelect;

export type InsertPremiumAlbumPurchase = typeof premiumAlbumPurchases.$inferInsert;
export type PremiumAlbumPurchase = typeof premiumAlbumPurchases.$inferSelect;

export type InsertPremiumMessage = typeof premiumMessages.$inferInsert;
export type PremiumMessage = typeof premiumMessages.$inferSelect;

export type InsertMemoryFragment = typeof memoryFragments.$inferInsert;
export type MemoryFragment = typeof memoryFragments.$inferSelect;

export type InsertMemoryView = typeof memoryViews.$inferInsert;
export type MemoryView = typeof memoryViews.$inferSelect;

export type InsertMemoryInteraction = typeof memoryInteractions.$inferInsert;
export type MemoryInteraction = typeof memoryInteractions.$inferSelect;

export type InsertMemoryCollection = typeof memoryCollections.$inferInsert;
export type MemoryCollection = typeof memoryCollections.$inferSelect;

export type InsertPrivateMessage = typeof privateMessages.$inferInsert;
export type PrivateMessage = typeof privateMessages.$inferSelect;

export type InsertMessageRequest = typeof messageRequests.$inferInsert;
export type MessageRequest = typeof messageRequests.$inferSelect;

export type InsertFragmentCollection = typeof fragmentCollections.$inferInsert;
export type FragmentCollection = typeof fragmentCollections.$inferSelect;

export type InsertComment = typeof comments.$inferInsert;
export type Comment = typeof comments.$inferSelect;

export type InsertCommentLike = typeof commentLikes.$inferInsert;
export type CommentLike = typeof commentLikes.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل").max(20, "اسم المستخدم لا يمكن أن يزيد عن 20 حرف"),
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "الاسم الأخير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيد كلمة المرور غير متطابقين",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const insertStreamSchema = createInsertSchema(streams).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});

export const insertGiftSchema = createInsertSchema(gifts).omit({
  id: true,
  sentAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  sentAt: true,
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertMemoryFragmentSchema = createInsertSchema(memoryFragments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
  shareCount: true,
  giftCount: true,
});

export const insertMemoryInteractionSchema = createInsertSchema(memoryInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
  createdAt: true,
});

export const insertMemoryCollectionSchema = createInsertSchema(memoryCollections).omit({
  id: true,
  createdAt: true,
  fragmentCount: true,
});

// Types for supporter system
export type SupporterLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// User with supporter information
export type UserWithSupporter = typeof users.$inferSelect & {
  supporterLevel: number;
  totalGiftsSent: string;
  totalGiftsReceived: string;
  supporterBadge: string | null;
};

// Locked Albums Schema
export const lockedAlbums = pgTable("locked_albums", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull().default(100), // Price in points
  coverImage: text("cover_image"), // Optional cover image
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Locked Album Content Schema
export const lockedAlbumContent = pgTable("locked_album_content", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  albumId: text("album_id").notNull().references(() => lockedAlbums.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["image", "video", "audio", "text"] }).notNull(),
  url: text("url"), // For media files
  content: text("content"), // For text content
  thumbnail: text("thumbnail"), // For video thumbnails
  caption: text("caption"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Album Purchases Schema
export const albumPurchases = pgTable("album_purchases", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  albumId: text("album_id").notNull().references(() => lockedAlbums.id, { onDelete: "cascade" }),
  buyerId: text("buyer_id").notNull().references(() => users.id),
  price: integer("price").notNull(), // Price paid at time of purchase
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
}, (table) => ({
  uniquePurchase: unique().on(table.albumId, table.buyerId), // One purchase per user per album
}));

// Private Content Requests Schema
export const privateContentRequests = pgTable("private_content_requests", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  fromUserId: text("from_user_id").notNull().references(() => users.id),
  toUserId: text("to_user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["image", "video", "audio", "text"] }).notNull(),
  description: text("description").notNull(),
  offeredPrice: integer("offered_price").notNull(), // Points offered
  status: text("status", { enum: ["pending", "accepted", "rejected", "completed"] }).notNull().default("pending"),
  contentUrl: text("content_url"), // Filled when content is delivered
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  completedAt: timestamp("completed_at"),
});

export const insertLockedAlbumSchema = createInsertSchema(lockedAlbums).omit({
  id: true,
  createdAt: true,
});
export type InsertLockedAlbum = z.infer<typeof insertLockedAlbumSchema>;
export type LockedAlbum = typeof lockedAlbums.$inferSelect;

export const insertLockedAlbumContentSchema = createInsertSchema(lockedAlbumContent).omit({
  id: true,
  createdAt: true,
});
export type InsertLockedAlbumContent = z.infer<typeof insertLockedAlbumContentSchema>;
export type LockedAlbumContent = typeof lockedAlbumContent.$inferSelect;

export const insertAlbumPurchaseSchema = createInsertSchema(albumPurchases).omit({
  id: true,
  purchasedAt: true,
});
export type InsertAlbumPurchase = z.infer<typeof insertAlbumPurchaseSchema>;
export type AlbumPurchase = typeof albumPurchases.$inferSelect;

export const insertPrivateContentRequestSchema = createInsertSchema(privateContentRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
  completedAt: true,
});
export type InsertPrivateContentRequest = z.infer<typeof insertPrivateContentRequestSchema>;
export type PrivateContentRequest = typeof privateContentRequests.$inferSelect;
