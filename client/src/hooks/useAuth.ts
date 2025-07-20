import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // If there's an error (like 401), consider it as not authenticated
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}
