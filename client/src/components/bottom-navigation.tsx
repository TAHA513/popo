import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  Search,
  Plus,
  MessageCircle,
  User,
  LogOut
} from "lucide-react";

export default function BottomNavigation() {
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

  const navItems = [
    { href: "/", icon: Home, label: "الرئيسية" },
    { href: "/explore", icon: Search, label: "استكشف" },
    { href: "/create-memory", icon: Plus, label: "إنشاء", isSpecial: true },
    { href: "/messages", icon: MessageCircle, label: "الرسائل" },
    { href: "/profile", icon: User, label: "الملف" },
    { action: "logout", icon: LogOut, label: "خروج", isLogout: true }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-50 md:hidden shadow-2xl">
      <div className="flex items-center justify-around py-1 px-2">
        {navItems.map((item, index) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          if (item.isSpecial) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center justify-center -mt-4 relative">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 border-4 border-white">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs mt-1 text-purple-600 font-medium">{item.label}</span>
                </div>
              </Link>
            );
          }
          
          if (item.isLogout) {
            return (
              <button 
                key={index}
                onClick={async () => {
                  try {
                    const response = await fetch("/api/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    window.location.href = "/login";
                  } catch (error) {
                    console.error("Logout error:", error);
                    window.location.href = "/login";
                  }
                }}
                className="flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 relative ${
                isActive 
                  ? 'text-purple-600 bg-purple-50 scale-105' 
                  : 'text-gray-500 hover:text-purple-400 hover:bg-gray-50'
              }`}>
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                  {item.href === '/messages' && totalUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-purple-600' : ''}`}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}