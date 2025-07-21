import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home-simple";
import StreamPage from "@/pages/stream";
import AdminPage from "@/pages/admin";
import StartStreamPage from "@/pages/start-stream";
import AccountPage from "@/pages/account";
import CreateMemoryPage from "@/pages/create-memory";
import ProfileSimplePage from "@/pages/profile-simple";
import ExplorePage from "@/pages/explore";
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import GiftsPage from "@/pages/gifts";
import FeedPage from "@/pages/feed";
import MessagesPage from "@/pages/messages";
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
        {isAuthenticated ? <FeedPage /> : <LoginPage />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <FeedPage /> : <RegisterPage />}
      </Route>
      {isAuthenticated ? (
        <>
          <Route path="/" component={FeedPage} />
          <Route path="/home" component={Home} />
          <Route path="/stream/:id" component={StreamPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/panel-9bd2f2-control" component={AdminPage} />
          <Route path="/start-stream" component={StartStreamPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/create-memory" component={CreateMemoryPage} />
          <Route path="/profile" component={ProfileSimplePage} />
          <Route path="/profile/:userId" component={ProfileSimplePage} />
          <Route path="/explore" component={ExplorePage} />
          <Route path="/gifts" component={GiftsPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={LoginPage} />
          <Route path="/landing" component={Landing} />
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
