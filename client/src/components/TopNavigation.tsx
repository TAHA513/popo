import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuthFixed";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search,
  Plus,
  MessageCircle,
  User
} from "lucide-react";

export default function TopNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <nav className="hidden md:flex bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 w-full">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🐰</span>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              LaaBoBo
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Button>
            </Link>
            
            <Link href="/explore">
              <Button 
                variant={location === "/explore" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Search className="w-4 h-4" />
                <span>استكشف</span>
              </Button>
            </Link>

            <Link href="/create-memory">
              <Button 
                variant={location === "/create-memory" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء</span>
              </Button>
            </Link>

            {/* Live Streaming Button - Red */}
            <Button 
              onClick={() => window.open('https://console.zegocloud.com/', '_blank')}
              className="bg-red-500 hover:bg-red-600 text-white flex items-center space-x-2 rtl:space-x-reverse animate-pulse"
              size="sm"
            >
              <span className="text-lg">🔴</span>
              <span>بث مباشر</span>
            </Button>

            <Link href="/messages">
              <Button 
                variant={location === "/messages" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <MessageCircle className="w-4 h-4" />
                <span>الرسائل</span>
              </Button>
            </Link>

            <Link href="/profile">
              <Button 
                variant={location === "/profile" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <User className="w-4 h-4" />
                <span>الملف الشخصي</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}