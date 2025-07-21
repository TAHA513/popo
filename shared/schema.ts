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

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  points: integer("points").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  isStreamer: boolean("is_streamer").default(false),
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role").default("user").notNull(), // 'user' | 'admin' | 'super_admin'
  // Account privacy settings
  isPrivateAccount: boolean("is_private_account").default(false),
  allowDirectMessages: boolean("allow_direct_messages").default(true),
  allowGiftsFromStrangers: boolean("allow_gifts_from_strangers").default(true),
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

// Schema exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

export type InsertFragmentCollection = typeof fragmentCollections.$inferInsert;
export type FragmentCollection = typeof fragmentCollections.$inferSelect;

// Zod schemas
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

export const insertMemoryCollectionSchema = createInsertSchema(memoryCollections).omit({
  id: true,
  createdAt: true,
  fragmentCount: true,
});
