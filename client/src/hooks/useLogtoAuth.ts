import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface LogtoUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: string;
  points: number;
  isVerified: boolean;
  provider: 'logto' | 'local';
}

export function useLogtoAuth() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Check Logto authentication status
  const { data: authData, isLoading: authLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error('Authentication check failed');
      }
      
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  const signOut = async () => {
    try {
      // Check if using Logto
      const logtoResponse = await fetch('/api/logto/user');
      const logtoData = await logtoResponse.json();
      
      if (logtoData.isAuthenticated) {
        // Redirect to Logto sign out
        window.location.href = '/logto/sign-out';
      } else {
        // Use local logout
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback to local logout
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    }
  };

  return {
    user: authData as AuthUser | null,
    isAuthenticated: !!authData && !error,
    isLoading,
    signOut,
    error
  };
}