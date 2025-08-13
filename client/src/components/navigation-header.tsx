import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuthFixed";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/notification-bell";
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
  const { t, isRTL } = useLanguage();
  const [location] = useLocation();

  return (
    <header className="bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-blue-500/80 backdrop-blur-sm shadow-sm" style={{ height: '40px' }}>
      <div className="container mx-auto px-2 py-1">


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