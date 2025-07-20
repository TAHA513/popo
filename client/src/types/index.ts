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
  type: 'chat' | 'gift' | 'viewer_count' | 'stream_status';
  data: any;
  streamId?: string;
  userId?: string;
  timestamp: string;
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