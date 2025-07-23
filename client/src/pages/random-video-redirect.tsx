import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface Memory {
  id: number;
  [key: string]: any;
}

export default function RandomVideoRedirect() {
  const [, setLocation] = useLocation();
  
  // Fetch all videos to select a random one
  const { data: videos = [], isLoading } = useQuery<Memory[]>({
    queryKey: ['/api/memories/public'],
    retry: 1,
    staleTime: 30000, // 30 seconds cache
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading && videos.length > 0) {
      // Select a random video (only once)
      const randomIndex = Math.floor(Math.random() * videos.length);
      const randomVideo = videos[randomIndex];
      
      if (randomVideo && randomVideo.id) {
        // Single redirect to the random video
        window.location.href = `/video/${randomVideo.id}`;
      } else {
        // Fallback to home if no valid video found
        window.location.href = '/home';
      }
    } else if (!isLoading && videos.length === 0) {
      // No videos available, go to home
      window.location.href = '/home';
    }
  }, [videos, isLoading]);

  // Show loading screen while fetching videos
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-pink-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }}></div>
        </div>
        <p className="text-white text-xl font-medium mb-2">مرحباً بك في LaaBoBo!</p>
        <p className="text-gray-300 text-sm">جاري اختيار فيديو عشوائي لك...</p>
        <div className="w-48 h-2 bg-gray-700 rounded-full mt-4 mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}