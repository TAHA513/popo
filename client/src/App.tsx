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
import { LanguageOption } from "@/types";
import TestCameraSimple from "@/pages/test-camera-simple";
import DirectStreamTest from "@/pages/direct-stream-test";
import SuperSimpleStream from "@/pages/super-simple-stream";
import UltraSimpleStream from "@/pages/ultra-simple-stream";
import ZegoRealStream from "@/pages/zego-real-stream";


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
          <Route path="/feed" component={FeedPage} />
          <Route path="/new-stream" component={LazyComponents.SimpleStreamPage} />
          <Route path="/zego-stream" component={LazyComponents.ZegoStreamPage} />
          <Route path="/direct-camera" component={LazyComponents.DirectCameraStreamPage} />
          <Route path="/webrtc-stream" component={LazyComponents.WebRTCLiveStreamPage} />
          <Route path="/camera-test">
            <ZegoRealStream />
          </Route>
          <Route path="/zego-real-stream">
            <ZegoRealStream />
          </Route>
          <Route path="/test-zego" component={LazyComponents.TestZegoPage} />
          <Route path="/zego-viewer/:roomId" component={LazyComponents.ZegoViewerPage} />
          <Route path="/join/:roomId" component={LazyComponents.StreamPage} />
          <Route path="/cloud-stream-guide" component={LazyComponents.CloudStreamGuidePage} />
          <Route path="/stream/:id" component={LazyComponents.StreamPage} />
          <Route path="/admin" component={LazyComponents.AdminPage} />
          <Route path="/panel-9bd2f2-control" component={LazyComponents.AdminPage} />

          <Route path="/account" component={AccountPage} />
          <Route path="/create-memory" component={LazyComponents.CreateMemoryPage} />
          <Route path="/profile" component={LazyComponents.ProfileSimplePage} />
          <Route path="/profile/:userId" component={LazyComponents.ProfileSimplePage} />
          <Route path="/user/:userId" component={LazyComponents.ProfileSimplePage} />
          <Route path="/explore" component={SimpleExplore} />
          <Route path="/gifts" component={LazyComponents.GiftsPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/messages/requests" component={LazyComponents.MessageRequestsPage} />
          <Route path="/messages/:userId" component={LazyComponents.ConversationPage} />
          <Route path="/video/:videoId" component={LazyComponents.VideoPage} />
          <Route path="/single-video" component={LazyComponents.SingleVideoPage} />
          <Route path="/performance-test" component={LazyComponents.PerformanceTestPage} />
          <Route path="/:rest*" component={SimpleHome} />
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
    
    // Performance monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            console.log('Navigation timing:', entry.toJSON());
          }
        });
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
    
    // Memory usage monitoring (for development)
    if (process.env.NODE_ENV === 'development') {
      const checkMemory = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          console.log('Memory usage:', {
            used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
          });
        }
      };
      
      const memoryInterval = setInterval(checkMemory, 30000); // كل 30 ثانية
      return () => clearInterval(memoryInterval);
    }
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`app-container ${language === 'ar' ? 'rtl' : ''}`}>
        <Toaster />
        <Router />
      </div>
    </QueryClientProvider>
  );
}

export default App;
