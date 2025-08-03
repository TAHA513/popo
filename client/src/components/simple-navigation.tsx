import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  User, 
  Settings, 
  Gift, 
  Plus, 
  Video,
  LogOut,
  Sparkles,
  Camera,
  Crown,
  Search,
  MessageCircle
} from "lucide-react";

export default function SimpleNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  // Fetch conversations to get unread count
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/messages/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    enabled: !!user
  });

  // Calculate total unread messages
  const totalUnreadCount = conversations.reduce((total: number, conv: any) => 
    total + (conv.unreadCount || 0), 0
  );

  return (
    <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Profile & Notifications */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Link href="/profile">
              <div className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer hover:opacity-80 transition-opacity">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || user.username || 'User'}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </Link>
            
            <Link href="/messages">
              <button className="relative p-2 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-full">
                <MessageCircle className="w-5 h-5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </button>
            </Link>
          </div>

          {/* Center - App Name with Rabbit */}
          <div className="flex-1 flex justify-center">
            <Link href="/">
              <div className="text-center flex items-center space-x-2 rtl:space-x-reverse">
                <div className="text-2xl animate-bounce">🐰</div>
                <div>
                  <div className="text-xl font-bold text-white tracking-wide">
                    LaaBoBo Live
                  </div>
                  <div className="text-xs text-white/80 font-medium">
                    لايف بوبو
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Side - Search & Stream Button */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <button className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-full">
              <Search className="w-5 h-5" />
            </button>
            
            
            
            
            
            <Link href="/account">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 px-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex justify-center space-x-1 rtl:space-x-reverse">
            <Link href="/">
              <Button 
                variant={location === "/" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full ${location === "/" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button 
                variant={location === "/explore" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full ${location === "/explore" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                title="حديقة LaaBoBo"
              >
                🌸
              </Button>
            </Link>
            <Link href="/create-memory">
              <Button 
                variant={location === "/create-memory" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full ${location === "/create-memory" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/start-stream">
              <Button 
                variant={location === "/start-stream" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full ${location === "/start-stream" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Video className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/single-video">
              <Button 
                variant={location === "/single-video" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full ${location === "/single-video" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                title="مشغل الفيديو المفرد"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/gifts-test">
              <Button 
                variant={location === "/gifts-test" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full ${location === "/gifts-test" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Gift className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}