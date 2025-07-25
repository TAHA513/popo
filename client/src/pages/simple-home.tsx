import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

import BottomNavigation from "@/components/bottom-navigation";
import LiveStreamCard from "@/components/LiveStreamCard";
import TopNavigation from "@/components/TopNavigation";

export default function SimpleHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [allActiveStreams, setAllActiveStreams] = useState<any[]>([]);

  // Fetch active streams from database
  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        const response = await fetch('/api/streams');
        if (response.ok) {
          const streams = await response.json();
          console.log('📡 Active streams from database:', streams);
          
          // Check if current user is publishing any stream
          const currentStreamID = localStorage.getItem('currentStreamID');
          const isPublisher = localStorage.getItem('isPublisher') === 'true';
          
          const enhancedStreams = streams.map((stream: any) => ({
            ...stream,
            isPublisher: isPublisher && stream.streamId === currentStreamID
          }));
          
          setAllActiveStreams(enhancedStreams);
          if (enhancedStreams.length > 0) {
            setCurrentStream(enhancedStreams[0]);
          } else {
            setCurrentStream(null);
          }
        } else {
          console.error('❌ Failed to fetch streams');
          setAllActiveStreams([]);
          setCurrentStream(null);
        }
      } catch (error) {
        console.error('Error fetching streams:', error);
        setAllActiveStreams([]);
        setCurrentStream(null);
      }
    };

    // Initial fetch
    fetchActiveStreams();
    
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchActiveStreams, 5000);

    return () => clearInterval(interval);
  }, []);
  
  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            
            {/* Action Buttons - Right Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button 
                onClick={() => setLocation('/simple-live-streaming')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-full shadow-lg"
                title="بث مباشر"
              >
                🔴
              </Button>
              <Button 
                onClick={() => {
                  setLocation('/create-memory');
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-bold">إنشاء ذكرى</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Live Streams Section - Show ALL active streams */}
        {allActiveStreams.length > 0 ? (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full ml-2"></span>
              البثوث المباشرة ({allActiveStreams.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allActiveStreams.map((stream) => (
                <LiveStreamCard 
                  key={stream.id} 
                  stream={stream} 
                  onStreamEnd={() => {
                    // Refresh streams after ending
                    setAllActiveStreams(prev => prev.filter(s => s.id !== stream.id));
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🐰</span>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد بثوث مباشرة حالياً</h3>
              <p className="text-gray-500 text-sm">ابدأ بث مباشر من الأيقونة الحمراء أعلاه 🔴</p>
              
              <div className="mt-4">
                <Button 
                  onClick={() => setLocation('/explore')}
                  className="bg-laa-pink hover:bg-laa-pink/90 text-white"
                >
                  استكشف المحتوى
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <BottomNavigation />
      </div>
    </div>
  );
}