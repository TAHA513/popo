import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
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
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const logout = async () => {
    console.log("Logout function called");
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      console.log("Logout response:", response.status);
      
      // Clear all cached data
      queryClient.clear();
      
      // Force reload to ensure complete logout
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local data and redirect
      queryClient.clear();
      window.location.replace("/login");
    }
  };

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading,
    logout,
  };
}