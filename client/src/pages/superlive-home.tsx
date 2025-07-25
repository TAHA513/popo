import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search,
  Plus,
  Eye,
  Heart,
  Gift,
  User,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Stream } from "@/types";
import LazyImage from "@/components/lazy-image";

interface LiveUser {
  id: string;
  name: string;
  avatar: string;
  viewers: number;
  isOnline: boolean;
  category?: string;
  hearts?: string;
  isPrivate?: boolean;
}

export default function SuperLiveHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("شائع");

  // Fetch live streams
  const { data: streams = [] } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Fetch memories/posts for content
  const { data: memories = [] } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // استخدام البيانات الحقيقية من النظام فقط
  const liveUsers: LiveUser[] = streams.map((stream: Stream) => ({
    id: stream.id.toString(),
    name: stream.title || `البث رقم ${stream.id}`,
    avatar: '/api/placeholder/40/40',
    viewers: stream.viewerCount || 0,
    isOnline: true,
    category: stream.category || 'عام',
    hearts: '0',
    isPrivate: false
  }));

  const tabs = ["شائع", "اكتشف", "في المنافسة", "متعدد الصفوف"];

  const handleJoinStream = (userId: string) => {
    const realStream = streams.find(s => s.id.toString() === userId);
    if (realStream) {
      setLocation(`/stream/${realStream.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="text-2xl mr-2">🐰</div>
            <h1 className="text-2xl font-bold text-laa-pink">LaaBoBo</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Users Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {liveUsers.map((user) => (
            <Card 
              key={user.id}
              className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleJoinStream(user.id)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] bg-gradient-to-b from-purple-500 to-pink-500">
                  {/* Background Image */}
                  <LazyImage
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Viewer Count Badge */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                    <Eye className="w-3 h-3 text-white mr-1" />
                    <span className="text-white text-xs font-semibold">{user.viewers}</span>
                  </div>
                  
                  {/* Category Badge (if exists) */}
                  {user.category && (
                    <div className="absolute bottom-12 left-3 right-3">
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-2 py-1 rounded-full w-fit">
                        {user.category}
                      </Badge>
                    </div>
                  )}
                  
                  {/* User Info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{user.name}</h3>
                        <div className="flex items-center mt-1">
                          <Heart className="w-3 h-3 text-red-500 mr-1" />
                          <span className="text-white text-xs">{user.hearts}</span>
                        </div>
                      </div>
                      
                      {/* Avatar with Live Indicator */}
                      <div className="relative ml-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                          <LazyImage
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={() => setLocation('/start-stream')}
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Bottom Navigation - استخدام الشريط الموجود في النظام */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-50 shadow-2xl">
        <div className="flex items-center justify-around py-2 px-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center p-2"
            onClick={() => setLocation('/')}
          >
            <div className="w-6 h-6 text-laa-pink">🏠</div>
            <span className="text-xs text-gray-600 mt-1">الرئيسية</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center p-2"
            onClick={() => setLocation('/explore')}
          >
            <Search className="w-5 h-5 text-gray-500" />
            <span className="text-xs text-gray-600 mt-1">استكشف</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center p-2 -mt-4 relative"
            onClick={() => setLocation('/start-stream')}
          >
            <div className="w-14 h-14 bg-gradient-to-r from-laa-pink to-purple-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-laa-pink font-medium mt-1">بث مباشر</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center p-2"
            onClick={() => setLocation('/messages')}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-gray-500" />
            </div>
            <span className="text-xs text-gray-600 mt-1">رسائل</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center p-2"
            onClick={() => setLocation('/profile')}
          >
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-xs text-gray-600 mt-1">الملف</span>
          </Button>
        </div>
      </div>
    </div>
  );
}