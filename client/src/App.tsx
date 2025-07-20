import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import StreamPage from "@/pages/stream";
import AdminPage from "@/pages/admin";
import StartStreamPage from "@/pages/start-stream";
import PWAInstallButton from "@/components/pwa-install-button";

type Language = 'en' | 'ar';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/stream/:id" component={StreamPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/panel-9bd2f2-control" component={AdminPage} />
          <Route path="/start-stream" component={StartStreamPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Set document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle device orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    // Handle app visibility change (PWA lifecycle)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.refetchQueries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={`app-container full-screen-mobile ios-fix ${language === 'ar' ? 'rtl' : ''}`}>
          {/* Offline indicator */}
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm safe-top">
              غير متصل بالإنترنت - بعض الميزات قد لا تعمل
            </div>
          )}
          
          <Toaster />
          <Router />
          <PWAInstallButton />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
