import { lazy } from 'react';

// Lazy loading المكونات الثقيلة لتحسين الأداء
export const AdminPage = lazy(() => import('@/pages/admin'));
export const CreateMemoryPage = lazy(() => import('@/pages/create-memory'));
export const ProfileSimplePage = lazy(() => import('@/pages/profile-simple'));
export const ExplorePage = lazy(() => import('@/pages/explore'));
export const GiftsPage = lazy(() => import('@/pages/gifts'));
export const ConversationPage = lazy(() => import('@/pages/conversation'));
export const VideoPage = lazy(() => import('@/pages/video'));
export const SingleVideoPage = lazy(() => import('@/pages/single-video'));
export const MessageRequestsPage = lazy(() => import('@/pages/message-requests'));
export const PerformanceTestPage = lazy(() => import('@/pages/performance-test'));
export const ZegoLivePage = lazy(() => import('@/pages/zego-live'));