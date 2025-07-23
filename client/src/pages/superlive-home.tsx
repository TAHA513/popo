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
  User
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

  // Create live users from streams and memories
  const liveUsers: LiveUser[] = [
    // Live streams
    ...streams.map((stream: Stream) => ({
      id: stream.id.toString(),
      name: stream.hostId || 'مبث مجهول',
      avatar: `https://images.unsplash.com/photo-1494790108755-2616b332db19?w=200&h=200&fit=crop&crop=face`,
      viewers: stream.viewerCount || Math.floor(Math.random() * 500) + 50,
      isOnline: true,
      category: stream.category || 'عام',
      hearts: (Math.floor(Math.random() * 50) + 10) + 'K',
      isPrivate: false
    })),
    // Sample users for demo
    {
      id: 'demo1',
      name: 'سارة أحمد',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332db19?w=200&h=200&fit=crop&crop=face',
      viewers: 265,
      isOnline: true,
      hearts: '18.0K',
      category: 'جولة في المنطقة'
    },
    {
      id: 'demo2', 
      name: 'أحمد محمد',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      viewers: 198,
      isOnline: true,
      hearts: '11.2M',
      category: 'جولة في المنطقة'
    },
    {
      id: 'demo3',
      name: 'Hott Privett',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      viewers: 113,
      isOnline: true,
      hearts: '13.0K'
    },
    {
      id: 'demo4',
      name: 'Yyla فعم',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      viewers: 70,
      isOnline: true,
      hearts: '9.7M'
    },
    {
      id: 'demo5',
      name: 'علي حسن',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      viewers: 81,
      isOnline: true,
      hearts: '5.2K'
    },
    {
      id: 'demo6',
      name: 'فاطمة النور',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
      viewers: 117,
      isOnline: true,
      hearts: '7.8K'
    }
  ];

  const tabs = ["شائع", "اكتشف", "في المنافسة", "متعدد الصوف"];

  const handleJoinStream = (userId: string) => {
    // إذا كان من البثوث الحقيقية
    const realStream = streams.find(s => s.id.toString() === userId);
    if (realStream) {
      setLocation(`/stream/${realStream.id}`);
    } else {
      // للعرض التجريبي
      setLocation('/start-stream');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              <span className="text-blue-600">SUPER</span>
              <span className="text-gray-800">LIVE</span>
            </h1>
          </div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔥</span>
            </div>
            <span className="mr-2 text-blue-600 font-semibold">شائع</span>
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex items-center justify-around">
          <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">أنا</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
            <Gift className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">🎁</span>
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-lg">👑</span>
            </div>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
            <User className="w-5 h-5 text-gray-400" />
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 text-blue-600">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">$</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}