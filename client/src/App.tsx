import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";


import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { initPerformanceOptimizations } from "@/lib/performance";

import Landing from "@/pages/landing";
import SimpleHome from "@/pages/simple-home";
import SimpleExplore from "@/pages/simple-explore";
import AccountPage from "@/pages/account";
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import FeedPage from "@/pages/feed";
import MessagesPage from "@/pages/messages";
import * as LazyComponents from "@/App.lazy";
import SimpleLiveStreaming from '@/pages/simple-live-streaming';
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
          <Route path="/explore" component={SimpleExplore} />
          <Route path="/start-streaming" component={LazyComponents.StartStreamingPage} />
          <Route path="/simple-live" component={() => <SimpleLiveStreaming />} />
          <Route path="/simple-live-streaming" component={() => <SimpleLiveStreaming />} />
          <Route path="/feed" component={FeedPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/account" component={AccountPage} />
          
          <Route path="/admin" component={LazyComponents.AdminPage} />
          <Route path="/create-memory" component={LazyComponents.CreateMemoryPage} />
          <Route path="/profile-simple" component={LazyComponents.ProfileSimplePage} />
          <Route path="/profile" component={LazyComponents.ProfileSimplePage} />
          <Route path="/gifts" component={LazyComponents.GiftsPage} />
          <Route path="/conversation/:userId" component={LazyComponents.ConversationPage} />
          <Route path="/video/:id" component={LazyComponents.VideoPage} />
          <Route path="/single-video" component={LazyComponents.SingleVideoPage} />
          <Route path="/user/:userId" component={LazyComponents.ProfileSimplePage} />
          <Route path="/message-requests" component={LazyComponents.MessageRequestsPage} />
          <Route path="/performance-test" component={LazyComponents.PerformanceTestPage} />
          <Route path="/zego-live" component={LazyComponents.ZegoLivePage} />
          
          {/* Admin panel hidden route */}
          <Route path="/panel-9bd2f2-control" component={LazyComponents.AdminPage} />
          
          {/* 404 fallback */}
          <Route>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🐰</div>
                <h1 className="text-2xl font-bold text-gray-700 mb-2">الصفحة غير موجودة</h1>
                <p className="text-gray-500 mb-6">عذراً، الصفحة التي تبحث عنها غير متوفرة</p>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-laa-pink text-white rounded-lg hover:bg-laa-pink/90 transition-colors"
                >
                  العودة للرئيسية
                </a>
              </div>
            </div>
          </Route>
        </Suspense>
      ) : (
        <Route component={Landing} />
      )}
    </Switch>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    // Initialize performance optimizations
    initPerformanceOptimizations();
    
    // Cleanup function for when the component unmounts
    return () => {
      // Any necessary cleanup can go here
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`app ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;