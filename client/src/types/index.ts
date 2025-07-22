// Re-export all types from shared schema for client use
export type {
  User,
  Stream,
  GiftCharacter,
  Gift,
  ChatMessage,
  PointTransaction,
  Follower,
  UpsertUser,
  InsertStream,
  InsertGift,
  InsertChatMessage,
  InsertPointTransaction,
  InsertFollower
} from '@shared/schema';

// Client-specific types
export interface AdminStats {
  activeUsers: number;
  liveStreams: number;
  dailyRevenue: number;
  giftsSent: number;
}

export interface WebSocketMessage {
  type: 'join_stream' | 'leave_stream' | 'chat_message' | 'gift_sent' | 'viewer_count_update';
  streamId?: number;
  userId?: string;
  text?: string;
  user?: any;
  data?: any;
  timestamp?: string;
}

export interface StreamCategory {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
}

export interface LanguageOption {
  code: 'en' | 'ar';
  name: string;
  direction: 'ltr' | 'rtl';
}