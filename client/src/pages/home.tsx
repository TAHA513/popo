import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "@/components/navigation-header";
import LiveStreamsGrid from "@/components/live-streams-grid";
import GiftCharacters from "@/components/gift-characters";
import UserProfile from "@/components/user-profile";
import MobileNavigation from "@/components/mobile-navigation";
// import MobileStreamCard from "@/components/mobile-stream-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Play, Users, TrendingUp, Plus, Search, Bell, Settings, Moon, Sun, Eye } from "lucide-react";
import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useQuery } from "@tanstack/react-query";

interface Stream {
  id: number;
  title: string;
  viewerCount: number;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  thumbnail?: string;
  category?: string;
  isLive: boolean;
  totalGifts: number;
}

type Language = 'en' | 'ar';
type Theme = 'light' | 'dark';

export default function Home() {
  const { user } = useAuth();
  const { isInstalled } = usePWA();
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('light');

  // Fetch live streams
  const { data: streams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const renderMobileContent = () => {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="laa-gradient-bg safe-top">
          <div className="px-4 py-6 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">🐰</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">LaaBoBo Live</h1>
                  <p className="text-white/90 text-sm font-medium">مرحباً {user?.firstName || user?.email || 'بك'}!</p>
                </div>
              </div>
              
              {/* Language and Theme Controls */}
              <div className="flex items-center gap-2 text-xs">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-white/30 text-white text-xs px-2 py-1 rounded-lg border-none outline-none backdrop-blur-sm font-medium"
                >
                  <option value="ar" className="text-gray-900 bg-white">عربي</option>
                  <option value="en" className="text-gray-900 bg-white">EN</option>
                </select>
                
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center touch-target backdrop-blur-sm"
                  title={theme === 'light' ? 'وضع ليلي' : 'وضع نهاري'}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
                </button>
                
                <button className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center touch-target backdrop-blur-sm" title="الإشعارات">
                  <Bell className="w-4 h-4 text-white" />
                </button>
                
                <button className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center touch-target backdrop-blur-sm" title="الإعدادات">
                  <Settings className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="mobile-button bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                onClick={() => window.location.href = '/start-stream'}
              >
                <Plus className="w-4 h-4 mr-2" />
                بدء البث
              </Button>
              <Button
                variant="outline"
                className="mobile-button border-white/30 text-white hover:bg-white/20"
              >
                <Users className="w-4 h-4 mr-2" />
                متابعة الأصدقاء
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-4 py-4 pb-20">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="laa-card-mobile">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-6 h-6 text-laa-pink mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{streams.length}</p>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold">بث مباشر</p>
              </CardContent>
            </Card>
            <Card className="laa-card-mobile">
              <CardContent className="p-3 text-center">
                <Users className="w-6 h-6 text-laa-purple mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {streams.reduce((sum, s) => sum + s.viewerCount, 0)}
                </p>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold">مشاهد</p>
              </CardContent>
            </Card>
            <Card className="laa-card-mobile">
              <CardContent className="p-3 text-center">
                <Video className="w-6 h-6 text-laa-blue mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {user?.points || 0}
                </p>
                <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold">نقاطك</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Streams Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">البث المباشر</h2>
              <Button variant="ghost" size="sm" className="text-laa-pink">
                عرض الكل
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="laa-card-mobile animate-pulse">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-2xl"></div>
                    <div className="p-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : streams.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {streams.slice(0, 5).map((stream) => (
                  <Card key={stream.id} className="laa-card-mobile cursor-pointer hover:shadow-xl transition-all duration-300 touch-target">
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-gradient-to-br from-laa-pink via-laa-purple to-laa-blue rounded-t-2xl overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-white opacity-70" />
                        </div>
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse">
                          مباشر
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{stream.viewerCount}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {stream.title || 'Live Stream'}
                        </h3>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          بواسطة {stream.streamerName || 'Unknown'}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>{stream.viewerCount} مشاهد</span>
                          <span>{stream.totalGifts} هدية</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="laa-card-mobile">
                <CardContent className="p-8 text-center">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    لا توجد بثوث مباشرة حالياً
                  </p>
                  <Button 
                    className="mobile-button bg-laa-pink text-white"
                    onClick={() => window.location.href = '/start-stream'}
                  >
                    كن أول من يبدأ البث!
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gift Characters Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">شخصيات الهدايا</h2>
              <Button variant="ghost" size="sm" className="text-laa-pink">
                عرض الكل
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {['BoBo Love', 'BoFire', 'Nunu Magic', 'Dodo Splash'].map((character) => (
                <div key={character} className="flex-shrink-0">
                  <Card className="w-20 laa-card-mobile">
                    <CardContent className="p-3 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-laa-pink to-laa-purple rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{character[0] || 'G'}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {character}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation />
      </div>
    );
  };

  const renderDesktopContent = () => {
    switch (activeTab) {
      case 'live':
        return <LiveStreamsGrid />;
      case 'gifts':
        return <GiftCharacters />;
      case 'profile':
        return <UserProfile />;
      default:
        return (
          <>
            {/* Hero Section */}
            <section className="laa-gradient-bg py-16">
              <div className="container mx-auto px-4 text-center">
                <h1 className="font-bold text-4xl md:text-6xl text-white mb-6">
                  أهلاً بك، {user?.firstName || user?.username || 'المبدع'}!
                </h1>
                <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  هل أنت مستعد للبث المباشر أو اكتشاف بثوث رائعة من المبدعين حول العالم؟
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="bg-white text-laa-pink hover:bg-gray-100 text-lg px-8 py-4"
                    onClick={() => window.location.href = '/start-stream'}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    بدء البث
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-laa-pink text-lg px-8 py-4"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    تصفح البثوث
                  </Button>
                </div>
              </div>
            </section>

            <LiveStreamsGrid />
            <GiftCharacters />
          </>
        );
    }
  };

  // Check if we're on mobile device
  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        renderMobileContent()
      ) : (
        <>
          <NavigationHeader />
          {renderDesktopContent()}
        </>
      )}
    </div>
  );
}