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
