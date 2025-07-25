import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, ArrowLeft, Camera, Monitor } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect } from 'react';

export default function ZegoRedirect() {
  const { user } = useAuth();

  // Auto redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.open('https://console.zegocloud.com/', '_blank');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">يجب تسجيل الدخول أولاً</h2>
            <Link href="/login">
              <Button className="w-full">تسجيل الدخول</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🐰</span>
            </div>
            <h1 className="text-3xl font-bold text-white">LaaBoBo Live</h1>
          </div>
          <p className="text-purple-200 text-lg">جاري توجيهك إلى وحدة تحكم ZEGO Cloud</p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center space-x-3 rtl:space-x-reverse">
              <Camera className="w-8 h-8 text-red-400" />
              <span>ابدأ البث المباشر</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold mb-2">مرحباً {user.firstName || user.username}!</h3>
              <p className="text-purple-200">سيتم توجيهك إلى وحدة تحكم ZEGO Cloud لبدء البث المباشر</p>
            </div>

            {/* ZEGO Cloud Info */}
            <div className="bg-blue-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                <Monitor className="w-6 h-6 text-blue-300" />
                <h4 className="font-semibold">معلومات الاتصال:</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">App ID:</span>
                  <span className="font-mono bg-white/10 px-2 py-1 rounded">1034062164</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">المستخدم:</span>
                  <span className="font-mono bg-white/10 px-2 py-1 rounded">{user.id}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => window.open('https://console.zegocloud.com/', '_blank')}
                className="bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <ExternalLink className="w-5 h-5" />
                <span>فتح وحدة التحكم</span>
              </Button>
              
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full py-4 text-lg border-white/30 text-white hover:bg-white/10 flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>العودة للرئيسية</span>
                </Button>
              </Link>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-yellow-200">تعليمات البث:</h4>
              <ol className="text-sm space-y-1 text-yellow-100 list-decimal list-inside">
                <li>استخدم App ID: 1034062164</li>
                <li>أدخل User ID الخاص بك: {user.id}</li>
                <li>اختر Room ID مناسب لبثك</li>
                <li>ابدأ البث وشارك الرابط مع المتابعين</li>
              </ol>
            </div>

            {/* Auto Redirect Notice */}
            <div className="text-center">
              <p className="text-sm text-purple-300">
                سيتم فتح وحدة التحكم تلقائياً خلال 3 ثواني...
              </p>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}