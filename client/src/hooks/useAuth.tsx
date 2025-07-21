import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  points: number;
  profileImageUrl?: string;
  bio?: string;
  isStreamer: boolean;
  totalEarnings: string;
  isPrivateAccount: boolean;
  allowDirectMessages: boolean;
  allowGiftsFromStrangers: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [authChecked, setAuthChecked] = useState(false);

  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async (): Promise<User> => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      return response.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
  });

  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
    }
  }, [isLoading]);

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to landing page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading: isLoading || !authChecked,
    logout,
  };
}