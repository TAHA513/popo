import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">🚀</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent hidden sm:block">
                LaaBoBo Live
              </span>
            </div>
          </Link>

          {/* Search Bar - Mobile */}
          <div className="flex-1 mx-4 md:hidden">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                className="w-full bg-gray-100 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Navigation Links - Desktop Only */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"} 
                size="sm"
              >
                <Home className="w-4 h-4 ml-1" />
                الرئيسية
              </Button>
            </Link>

            <Link href="/explore">
              <Button 
                variant={location === "/explore" ? "default" : "ghost"} 
                size="sm"
              >
                <Search className="w-4 h-4 ml-1" />
                استكشف
              </Button>
            </Link>

            <Link href="/start-stream">
              <Button 
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Video className="w-4 h-4 ml-1" />
                بث مباشر
              </Button>
            </Link>

            <Link href="/create-memory">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 ml-1" />
                إنشاء
              </Button>
            </Link>
          </nav>

          {/* User Info - Desktop Only */}
          <div className="hidden md:flex items-center space-x-3 rtl:space-x-reverse">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Profile */}
            <Link href="/profile">
              <div className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer hover:opacity-80 transition-opacity">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || user.username || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-purple-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center border-2 border-purple-200">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">
                  {user?.firstName || user?.username || 'مستخدم'}
                </p>
                {user?.points !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {user.points} نقطة
                  </Badge>
                )}
              </div>
            </div>
            </Link>

            {/* Settings Button */}
            <Link href="/account">
              <Button variant="ghost" size="sm" title="الإعدادات">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 flex justify-center space-x-2 rtl:space-x-reverse">
          <Link href="/">
            <Button variant={location === "/" ? "default" : "ghost"} size="sm">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant={location === "/profile" ? "default" : "ghost"} size="sm">
              <User className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant={location === "/explore" ? "default" : "ghost"} size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/create-memory">
            <Button variant={location === "/create-memory" ? "default" : "ghost"} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/gifts">
            <Button variant={location === "/gifts" ? "default" : "ghost"} size="sm">
              <Gift className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/start-stream">
            <Button variant={location === "/start-stream" ? "default" : "ghost"} size="sm">
              <Video className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}