export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  username?: string;
  bio?: string;
  points: number;
  totalEarnings: string;
  isStreamer: boolean;
  isAdmin: boolean;
  followers?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stream {
  id: number;
  hostId: string;
  title: string;
  description?: string;
  category: string;
  thumbnailUrl?: string;
  isLive: boolean;
  viewerCount: number;
  totalGifts: number;
  startedAt: string;
  endedAt?: string;
  host?: User;
}

export interface GiftCharacter {
  id: number;
  name: string;
  emoji: string;
  description?: string;
  pointCost: number;
  animationType?: string;
  isActive: boolean;
}

export interface Gift {
  id: number;
  senderId: string;
  receiverId: string;
  streamId?: number;
  characterId: number;
  pointCost: number;
  message?: string;
  sentAt: string;
  character?: GiftCharacter;
  sender?: User;
}

export interface ChatMessage {
  id: number;
  streamId: number;
  userId: string;
  message: string;
  sentAt: string;
  user?: User;
}

export interface WebSocketMessage {
  type: 'join_stream' | 'leave_stream' | 'chat_message' | 'gift_sent' | 'viewer_count_update';
  streamId?: number;
  userId?: string;
  text?: string;
  user?: User;
  gift?: Gift;
  count?: number;
  message?: ChatMessage;
}

export interface AdminStats {
  activeUsers: number;
  liveStreams: number;
  dailyRevenue: number;
  giftsSent: number;
}

export type Language = 'en' | 'ar';
