import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

import ChatPage from "@/pages/chat";
import PremiumAlbumsPage from "@/pages/premium-albums";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <div>Please login first</div>;
  }

  return (
    <Switch>
      <Route path="/chat/:userId" component={ChatPage} />
      <Route path="/premium-albums" component={PremiumAlbumsPage} />
      <Route path="/">
        <Redirect href="/premium-albums" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}