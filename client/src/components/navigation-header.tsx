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
  MessageCircle,
  LogOut,
  Sparkles,
  Camera,
  Crown,
  Search
} from "lucide-react";

export default function NavigationHeader() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                LaaBoBo Live
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Button>
            </Link>
            
            <Link href="/profile">
              <Button 
                variant={location === "/profile" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <User className="w-4 h-4" />
                <span>الملف الشخصي</span>
              </Button>
            </Link>

            <Link href="/explore">
              <Button 
                variant={location === "/explore" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Search className="w-4 h-4" />
                <span>استكشف</span>
              </Button>
            </Link>

            <Link href="/gifts">
              <Button 
                variant={location === "/gifts" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Gift className="w-4 h-4" />
                <span>الهدايا</span>
              </Button>
            </Link>

            <Link href="/start-stream">
              <Button 
                variant={location === "/start-stream" ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-1 rtl:space-x-reverse"
              >
                <Video className="w-4 h-4" />
                <span>بث مباشر</span>
              </Button>
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* Create Memory Button */}
            <Link href="/create-memory">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                إنشاء ذكرى
              </Button>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || user.username || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="hidden sm:block">
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

            {/* Settings Button */}
            <Link href="/account">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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