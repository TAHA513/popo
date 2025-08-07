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
      
      // Check if user is system owner and on home page
      if (user.email && systemOwnerEmails.includes(user.email) && 
          location === '/' &&
          !location.includes('admin') &&
          !location.includes('owner-welcome')) {
        
        // Auto-redirect to welcome page first
        setTimeout(() => {
          setLocation('/owner-welcome');
        }, 1000);
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
