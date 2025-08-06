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

  // Auto-redirect will be enabled only for the new owner account you create

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
