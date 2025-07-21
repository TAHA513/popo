import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Gift, Users, Settings } from "lucide-react";

export default function HomeSimple() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-purple-600">LaaBoBo Live</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">مرحباً، {user.firstName || user.username}</span>
              <Button 
                variant="outline" 
                onClick={async () => {
                  await fetch("/api/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  window.location.href = "/";
                }}
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">
            أهلاً وسهلاً، {user.firstName || user.username}!
          </h2>
          <p className="text-lg opacity-90">
            مرحباً بك في منصة LaaBoBo Live للبث المباشر والتفاعل الاجتماعي
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Video className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">ابدأ بث مباشر</h3>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/start-stream'}
              >
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">تصفح البث المباشر</h3>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/explore'}
              >
                تصفح
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Gift className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">متجر الهدايا</h3>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/gifts'}
              >
                تسوق
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">حسابي</h3>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/account'}
              >
                إعدادات
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائياتك</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{user.points || 0}</div>
                <div className="text-gray-600">النقاط المتاحة</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{user.isStreamer ? 'نعم' : 'لا'}</div>
                <div className="text-gray-600">حساب مبدع</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{user.totalEarnings || '0'}</div>
                <div className="text-gray-600">الأرباح الإجمالية</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}