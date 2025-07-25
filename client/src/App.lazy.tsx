import { lazy } from 'react';

// Lazy loading المكونات الثقيلة لتحسين الأداء
export const StreamPage = lazy(() => import('@/pages/stream'));
export const NewStreamPage = lazy(() => import('@/pages/new-stream'));
export const AdminPage = lazy(() => import('@/pages/admin'));
export const StartStreamPage = lazy(() => import('@/pages/start-stream'));
export const CreateMemoryPage = lazy(() => import('@/pages/create-memory'));
export const CharacterSelectionPage = lazy(() => import('@/pages/CharacterSelection'));
export const ProfileSimplePage = lazy(() => import('@/pages/profile-simple'));
export const ExplorePage = lazy(() => import('@/pages/explore'));
export const GiftsPage = lazy(() => import('@/pages/gifts'));
export const ConversationPage = lazy(() => import('@/pages/conversation'));
export const VideoPage = lazy(() => import('@/pages/video'));
export const SingleVideoPage = lazy(() => import('@/pages/single-video'));
export const MessageRequestsPage = lazy(() => import('@/pages/message-requests'));
export const PerformanceTestPage = lazy(() => import('@/pages/performance-test'));