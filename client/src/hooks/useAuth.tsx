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
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login page after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local data and redirect
      queryClient.clear();
      window.location.href = "/login";
    }
  };

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading,
    logout,
  };
}