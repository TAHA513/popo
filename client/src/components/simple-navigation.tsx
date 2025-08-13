import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuthFixed";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import NotificationBell from "@/components/notification-bell";

export default function SimpleNavigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();

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

  // Clear all notifications mutation
  const clearAllNotifications = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to clear notifications');
      return response.json();
    },
    onSuccess: () => {
      // Update notification count immediately
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      alert('تم مسح جميع الإشعارات ✅');
    },
    onError: (error) => {
      console.error('Error clearing notifications:', error);
      alert('فشل في مسح الإشعارات');
    }
  });

  return (
    <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="w-full px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
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
            
            {/* Notification Bell */}
            <NotificationBell />
            
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
                <div className="text-xl font-bold text-white tracking-wide">
                  LaaBoBo Live
                </div>
              </div>
            </Link>
          </div>

          {/* Right Side - Search, Settings & Logout Buttons */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* Gifts Button */}
            <Link href="/gifts">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full" title="الهدايا">
                <Gift className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* Search Button */}
            <Link href="/search">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full" title="البحث">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* Clear Notifications Button (Temporary for Testing) */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full bg-red-500/20"
              onClick={() => clearAllNotifications.mutate()}
              disabled={clearAllNotifications.isPending}
              title="مسح جميع الإشعارات"
            >
              <span className="text-xs">🧹</span>
            </Button>
            
            <Link href="/account">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-white/80 hover:text-white hover:bg-red-500/20 p-2 rounded-full transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Layout - Simplified */}
        <div className="md:hidden flex items-center justify-between">
          {/* Left - Profile only */}
          <div className="flex items-center">
            <Link href="/profile">
              <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || user.username || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Center - App Name */}
          <div className="flex-1 flex justify-center">
            <Link href="/">
              <div className="text-center flex items-center space-x-1 rtl:space-x-reverse">
                <div className="text-lg animate-bounce">🐰</div>
                <div className="text-base font-bold text-white tracking-wide">
                  LaaBoBo
                </div>
              </div>
            </Link>
          </div>

          {/* Right - Essential buttons only */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <Link href="/messages">
              <button className="relative p-1.5 text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-full">
                <MessageCircle className="w-4 h-4" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center text-[10px]">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </button>
            </Link>
            
            <Link href="/account">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-white/80 hover:text-white hover:bg-red-500/20 p-1.5 rounded-full transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 px-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex justify-center space-x-1 rtl:space-x-reverse overflow-x-auto">
            <Link href="/">
              <Button 
                variant={location === "/" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/search">
              <Button 
                variant={location === "/search" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/search" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                title="البحث"
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            <div className="relative flex-shrink-0">
              <NotificationBell />
            </div>
            <Link href="/explore">
              <Button 
                variant={location === "/explore" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/explore" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                title="حديقة LaaBoBo"
              >
                🌸
              </Button>
            </Link>
            <Link href="/create-memory">
              <Button 
                variant={location === "/create-memory" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/create-memory" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/start-stream">
              <Button 
                variant={location === "/start-stream" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/start-stream" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Video className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/single-video">
              <Button 
                variant={location === "/single-video" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/single-video" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                title="مشغل الفيديو المفرد"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/gifts-test">
              <Button 
                variant={location === "/gifts-test" ? "secondary" : "ghost"} 
                size="sm"
                className={`rounded-full flex-shrink-0 ${location === "/gifts-test" ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
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