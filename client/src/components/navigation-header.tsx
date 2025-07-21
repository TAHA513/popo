import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Globe, Settings, LogOut, Shield, Moon, Sun, Download } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { usePWA } from "@/hooks/usePWA";

type Language = 'en' | 'ar';

interface NavigationHeaderProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export default function NavigationHeader({ 
  language = 'en', 
  onLanguageChange 
}: NavigationHeaderProps) {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  const { theme, toggleTheme } = useTheme();
  const { canInstall, installApp } = usePWA();

  const handleLanguageToggle = () => {
    const newLang: Language = currentLanguage === 'en' ? 'ar' : 'en';
    setCurrentLanguage(newLang);
    onLanguageChange?.(newLang);
    
    // Update document direction
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b-2 border-gradient sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🐰</span>
            </div>
            <span className="font-bold text-2xl gradient-text">LaaBoBo Live</span>
          </div>
          
          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-laa-dark hover:text-laa-pink transition-colors">
              Home
            </a>
            <a href="#live" className="text-laa-dark hover:text-laa-pink transition-colors">
              Live Streams
            </a>
            <a href="#gifts" className="text-laa-dark hover:text-laa-pink transition-colors">
              Gifts
            </a>
            <a href="#creators" className="text-laa-dark hover:text-laa-pink transition-colors">
              Creators
            </a>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-laa-gray" />
              )}
            </Button>

            {/* PWA Install Button */}
            {canInstall && (
              <Button
                variant="ghost"
                size="sm"
                onClick={installApp}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4 text-laa-gray" />
                <span className="text-sm hidden md:inline">تثبيت</span>
              </Button>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLanguageToggle}
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4 text-laa-gray" />
              <span className="text-sm">{currentLanguage.toUpperCase()}</span>
            </Button>
            
            {/* Points Balance */}
            <Badge className="gradient-bg text-white px-4 py-2 text-sm font-semibold">
              <span className="mr-1">💎</span>
              {user?.points || 0}
            </Badge>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-laa-pink">
                    <AvatarImage 
                      src={user?.profileImageUrl || undefined} 
                      alt={user?.firstName || user?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-laa-pink text-white">
                      {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user?.firstName || user?.username || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>الوضع النهاري</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>الوضع الليلي</span>
                    </>
                  )}
                </DropdownMenuItem>
                {canInstall && (
                  <DropdownMenuItem className="cursor-pointer" onClick={installApp}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>تثبيت التطبيق</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/account'}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>إدارة الحساب</span>
                </DropdownMenuItem>
                {user?.role === 'super_admin' && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/panel-9bd2f2-control'}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>لوحة التحكم الرئيسية</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
