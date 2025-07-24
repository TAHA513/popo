import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // Fetch active streams from database
  const { data: streams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });
  
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
                onClick={() => setLocation('/simple-live')}
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
        {/* Live Streams Section */}
        {streams.length > 0 ? (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">🔴 البثوث المباشرة</h2>
              
              {streams.map((stream) => (
                <Card key={stream.id} className="overflow-hidden border-2 border-red-200 shadow-lg mb-4">
                  <CardContent className="p-0">
                    <div className="relative">
                      {/* Live Video Placeholder */}
                      <div className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-6xl mb-2">📹</div>
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">مباشر</span>
                          </div>
                          <p className="text-sm opacity-80">بث مباشر نشط</p>
                        </div>
                      </div>
                      
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>مباشر</span>
                      </div>
                      
                      {/* Viewer Count */}
                      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{stream.viewerCount || Math.floor(Math.random() * 50) + 10}</span>
                      </div>
                    </div>
                    
                    {/* Stream Info */}
                    <div className="p-4">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {stream.hostAvatar || '🐰'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{stream.title}</h3>
                          <p className="text-sm text-gray-600">{stream.hostName || 'مستخدم'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button 
                          onClick={() => setLocation('/simple-live')}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          مشاهدة البث
                        </Button>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{Math.floor(Math.random() * 100) + 20}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{Math.floor(Math.random() * 30) + 5}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🐰</span>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">مرحباً بك في LaaBoBo!</h3>
              <p className="text-gray-500 text-sm">استكشف المحتوى والذكريات</p>
              <div className="mt-4">
                <Button 
                  onClick={() => setLocation('/explore')}
                  className="bg-laa-pink hover:bg-laa-pink/90 text-white w-full"
                >
                  استكشف الذكريات
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}