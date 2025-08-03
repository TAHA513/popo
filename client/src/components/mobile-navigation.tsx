import { Button } from "@/components/ui/button";
import { Home, Gift, User } from "lucide-react";

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      labelAr: 'الرئيسية'
    },
    {
      id: 'gifts',
      label: 'Gifts',
      icon: Gift,
      labelAr: 'هدايا'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      labelAr: 'الملف'
    }
  ];

  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center py-2 px-4 h-auto ${
                isActive 
                  ? 'text-laa-pink bg-laa-pink/10' 
                  : 'text-gray-500 hover:text-laa-pink hover:bg-laa-pink/5'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-laa-pink' : ''}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>
                {isRTL ? item.labelAr : item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
