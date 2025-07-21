import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Search,
  Plus,
  MessageCircle,
  User
} from "lucide-react";

export default function BottomNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "الرئيسية" },
    { href: "/explore", icon: Search, label: "استكشف" },
    { href: "/create-memory", icon: Plus, label: "إنشاء", isSpecial: true },
    { href: "/messages", icon: MessageCircle, label: "الرسائل" },
    { href: "/profile", icon: User, label: "الملف الشخصي" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          if (item.isSpecial) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center justify-center -mt-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{item.label}</span>
                </div>
              </Link>
            );
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center p-2 ${
                isActive ? 'text-purple-600' : 'text-gray-500'
              }`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}