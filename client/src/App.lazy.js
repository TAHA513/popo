import { lazy } from 'react';

export const CreateMemoryPage = lazy(() => import('./pages/create-memory-new'));
export const AdminPage = lazy(() => import('./pages/admin').catch(() => ({ default: () => <div>صفحة الإدارة غير متوفرة</div> })));
export const CharacterSelectionPage = lazy(() => import('./pages/CharacterSelection').catch(() => ({ default: () => <div>اختيار الشخصية</div> })));
export const GamesPage = lazy(() => import('./pages/games').catch(() => ({ default: () => <div>الألعاب</div> })));
export const ProfileSimplePage = lazy(() => import('./pages/profile-simple'));
export const ExplorePage = lazy(() => import('./pages/explore').catch(() => ({ default: () => <div>الاستكشاف</div> })));
export const GiftsPage = lazy(() => import('./pages/gifts').catch(() => ({ default: () => <div>الهدايا</div> })));
export const ConversationPage = lazy(() => import('./pages/conversation').catch(() => ({ default: () => <div>المحادثة</div> })));
export const VideoPage = lazy(() => import('./pages/video').catch(() => ({ default: () => <div>الفيديو</div> })));
export const SingleVideoPage = lazy(() => import('./pages/single-video').catch(() => ({ default: () => <div>فيديو واحد</div> })));
export const MessageRequestsPage = lazy(() => import('./pages/message-requests').catch(() => ({ default: () => <div>طلبات الرسائل</div> })));
export const NewChatPage = lazy(() => import('./pages/new-chat').catch(() => ({ default: () => <div>دردشة جديدة</div> })));
export const PrivateChatPage = lazy(() => import('./pages/private-chat').catch(() => ({ default: () => <div>دردشة خاصة</div> })));
export const ChatGiftSelectionPage = lazy(() => import('./pages/chat-gift-selection').catch(() => ({ default: () => <div>اختيار هدية</div> })));
export const PerformanceTestPage = lazy(() => import('./pages/performance-test').catch(() => ({ default: () => <div>اختبار الأداء</div> })));
export const WatchStreamPage = lazy(() => import('./pages/watch-stream'));