import { lazy } from 'react';

// Lazy loading المكونات الثقيلة لتحسين الأداء
export const StreamPage = lazy(() => import('@/pages/stream'));
export const NewStreamPage = lazy(() => import('@/pages/new-stream'));
export const SimpleStreamPage = lazy(() => import('@/pages/simple-stream'));
export const AdminPage = lazy(() => import('@/pages/admin'));
export const StartStreamPage = lazy(() => import('@/pages/start-stream'));
export const CreateMemoryPage = lazy(() => import('@/pages/create-memory'));
export const ProfileSimplePage = lazy(() => import('@/pages/profile-simple'));
export const ExplorePage = lazy(() => import('@/pages/explore'));
export const GiftsPage = lazy(() => import('@/pages/gifts'));
export const ConversationPage = lazy(() => import('@/pages/conversation'));
export const VideoPage = lazy(() => import('@/pages/video'));
export const SingleVideoPage = lazy(() => import('@/pages/single-video'));
export const ZegoStreamPage = lazy(() => import('@/pages/zego-real-stream'));
export const ZegoViewerPage = lazy(() => import('@/pages/zego-viewer'));
export const TestZegoPage = lazy(() => import('@/pages/test-zego'));
export const SimpleZegoStreamPage = lazy(() => import('@/pages/simple-zego-stream'));
export const DirectCameraStreamPage = lazy(() => import('@/pages/direct-camera-stream'));
export const WebRTCLiveStreamPage = lazy(() => import('@/pages/webrtc-live-stream'));
export const SimpleCameraTestPage = lazy(() => import('@/pages/simple-camera-test'));

export const CloudStreamGuidePage = lazy(() => import('@/pages/cloud-stream-guide'));
export const MessageRequestsPage = lazy(() => import('@/pages/message-requests'));
export const PerformanceTestPage = lazy(() => import('@/pages/performance-test'));