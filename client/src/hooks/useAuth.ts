import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [location, setLocation] = useLocation();

  // Auto-redirect system owner to admin panel
  useEffect(() => {
    if (user && user.isAdmin && user.role === 'super_admin') {
      const systemOwnerEmails = ['fnnm945@gmail.com'];
      
      // System owner should only see admin panel - no regular interface
      if (user.email && systemOwnerEmails.includes(user.email)) {
        // Force redirect to admin panel for any non-admin path
        if (!location.includes('tiktok-admin-panel-secure-access-laabobogarden-owner-dashboard')) {
          setLocation('/tiktok-admin-panel-secure-access-laabobogarden-owner-dashboard');
        }
      }
    }
  }, [user, location, setLocation]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: async () => {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.reload();
    }
  };
}
