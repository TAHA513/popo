import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { initPerformanceOptimizations } from "@/lib/performance";

import Landing from "@/pages/landing";
import LiveStreams from "@/pages/live-streams";

import SimpleHome from "@/pages/simple-home";
import SimpleExplore from "@/pages/simple-explore";
import SimpleStreamPage from "@/pages/simple-stream";
import AccountPage from "@/pages/account";
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import FeedPage from "@/pages/feed";
import MessagesPage from "@/pages/messages";
import NewChatPage from "@/pages/new-chat";
import MessageRequestsPage from "@/pages/message-requests";
import SimplePrivateChatPage from "@/pages/simple-private-chat";
import ConversationPage from "@/pages/conversation";
import ChatPage from "@/pages/chat";
import LockedAlbums from "@/components/LockedAlbums";
import PrivateAlbumsPage from "@/pages/private-albums";
import WatchStreamPage from "@/pages/watch-stream";
import VideoPage from "@/pages/video";
import SingleVideoPage from "@/pages/single-video";
import CreatePrivateRoomPage from "@/pages/create-private-room";
import CreateGroupRoomPage from "@/pages/create-group-room";
import BrowseGroupRoomsPage from "@/pages/browse-group-rooms";
import RoomInvitationsPage from "@/pages/room-invitations";
import WalletPage from "@/pages/wallet";
import CommentsPage from "@/pages/comments";
import FollowersManagementPage from "@/pages/followers-management";
import ProfileRedesignPage from "@/pages/profile-redesign";
// Core page imports
import CreateMemoryPage from "@/pages/create-memory";
import ProfileSimplePage from "@/pages/profile-simple";
import ExplorePage from "@/pages/explore";
import GamesSimplePage from "@/pages/games-simple";
import { LanguageOption } from "@/types";

type Language = 'en' | 'ar';

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Always show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  // Once loaded, show appropriate routes based on auth status
  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <SimpleHome /> : <LoginPage />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <SimpleHome /> : <RegisterPage />}
      </Route>
      {isAuthenticated ? (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
            <div className="text-white text-lg">جاري التحميل...</div>
          </div>
        }>
          <Route path="/" component={SimpleHome} />
          <Route path="/home" component={SimpleHome} />
          <Route path="/explore" component={LiveStreams} />
          <Route path="/feed" component={FeedPage} />
          <Route path="/albums" component={LockedAlbums} />
          <Route path="/private-albums" component={PrivateAlbumsPage} />
          <Route path="/start-stream" component={SimpleStreamPage} />
          <Route path="/stream/:id" component={WatchStreamPage} />
          <Route path="/create-memory" component={CreateMemoryPage} />
          <Route path="/games" component={GamesSimplePage} />
          <Route path="/profile" component={ProfileRedesignPage} />
          <Route path="/profile-old" component={ProfileSimplePage} />
          <Route path="/user/:userId" component={ProfileRedesignPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/video/:videoId" component={VideoPage} />
          <Route path="/single-video" component={SingleVideoPage} />
          <Route path="/messages/new-chat" component={NewChatPage} />
          <Route path="/messages/requests" component={MessageRequestsPage} />
          <Route path="/messages/chat/:userId" component={ChatPage} />
          <Route path="/messages/:userId" component={SimplePrivateChatPage} />
          <Route path="/create-private-room" component={CreatePrivateRoomPage} />
          <Route path="/create-group-room" component={CreateGroupRoomPage} />
          <Route path="/browse-group-rooms" component={BrowseGroupRoomsPage} />
          <Route path="/room-invitations" component={RoomInvitationsPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/messages/conversation/:conversationId" component={ConversationPage} />
          <Route path="/comments/:id" component={CommentsPage} />
          <Route path="/followers-management" component={FollowersManagementPage} />
          <Route path="/account" component={AccountPage} />
        </Suspense>
      ) : (
        <>
          <Route path="/" component={LoginPage} />
          <Route path="/landing" component={Landing} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route component={LoginPage} />
        </>
      )}
    </Switch>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Set document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Initialize performance optimizations
    initPerformanceOptimizations();
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${language === 'ar' ? 'rtl' : 'ltr'} min-h-screen`}>
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;