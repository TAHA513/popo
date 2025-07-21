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
import AccountPage from "@/pages/account";
import { LanguageOption } from "@/types";

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
          <Route path="/account" component={AccountPage} />
        </>
      )}
      <Route component={NotFound} />
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
      <TooltipProvider>
        <div className={`app-container ${language === 'ar' ? 'rtl' : ''}`}>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
