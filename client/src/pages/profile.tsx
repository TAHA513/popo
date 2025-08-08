import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  User, 
  Lock, 
  Settings, 
  LogOut, 
  ArrowLeft,
  Heart,
  MessageSquare,
  Share,
  Gift,
  Camera,
  Video
} from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [, setLocation] = useLocation();

  // جلب بيانات المستخدم
  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user
  });

  // جلب الألبومات المحمية للمستخدم
  const { data: lockedAlbums = [] } = useQuery<any[]>({
    queryKey: ['/api/locked-albums/my-albums'],
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">{t('auth.login_required')}</h2>
            <Button onClick={() => setLocation("/login")} className="w-full">
              {t('auth.login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      window.location.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('nav.back')}</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">{t('nav.profile')}</h1>
            <button 
              onClick={() => setLocation('/account')}
              className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors text-sm"
              title={t('nav.settings')}
            >
              <Settings className="w-4 h-4" />
              <span>{t('nav.settings')}</span>
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20" style={{ touchAction: 'pan-y' }}>
        <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className="text-white/80">{t('profile.laaboboo_user')}</p>
                <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
                  <span className="text-sm">{t('profile.user_points')}: {user.points || 0}</span>
                  <span className="text-sm">{t('profile.user_followers')}: 0</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="text-center p-3">
            <Heart className="w-6 h-6 mx-auto text-red-500 mb-1" />
            <div className="text-sm font-bold">0</div>
            <div className="text-xs text-gray-500">{t('profile.user_likes')}</div>
          </Card>
          <Card className="text-center p-3">
            <MessageSquare className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <div className="text-sm font-bold">0</div>
            <div className="text-xs text-gray-500">{t('profile.user_comments')}</div>
          </Card>
          <Card className="text-center p-3">
            <Share className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <div className="text-sm font-bold">0</div>
            <div className="text-xs text-gray-500">{t('profile.user_shares')}</div>
          </Card>
          <Card className="text-center p-3">
            <Gift className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
            <div className="text-sm font-bold">0</div>
            <div className="text-xs text-gray-500">{t('profile.user_gifts')}</div>
          </Card>
        </div>

        {/* Locked Albums Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Lock className="w-5 h-5 text-purple-600" />
              <span>{t('profile.protected_albums')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/albums')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
{t('profile.view_albums')}
              </Button>
              
              {lockedAlbums.length > 0 ? (
                <div className="text-sm text-gray-600">
{t('profile.albums_count').replace('{count}', lockedAlbums.length.toString())}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
{t('profile.no_locked_albums')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Creation */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.my_content')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setLocation('/create-memory')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
{t('memory.create')}
            </Button>
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
{t('stream.start_streaming')}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Settings className="w-5 h-5" />
              <span>{t('profile.account_settings')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation('/account')}
            >
              <User className="w-4 h-4 mr-2" />
{t('account.settings')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
{t('profile.logout_action')}
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}