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
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  username: varchar("username").unique().notNull(), // Required and unique
  passwordHash: varchar("password_hash").notNull(), // Required for local auth
  bio: text("bio"),
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

// Followers table
export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followedId: varchar("followed_id").notNull().references(() => users.id),
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
  memoryType: varchar("memory_type").default("fleeting"), // 'fleeting', 'precious', 'legendary'
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
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

// Types
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

export type InsertMemoryFragment = typeof memoryFragments.$inferInsert;
export type MemoryFragment = typeof memoryFragments.$inferSelect;

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
