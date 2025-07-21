import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Gift, Users, Settings } from "lucide-react";

export default function HomeSimple() {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  // If no user after loading, redirect to login
  if (!user) {
    window.location.href = '/login';
    return null;
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
        {/* User Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">اسم المستخدم:</span>
                <span className="font-semibold">{user.username}</span>
              </div>
              {user.firstName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">الاسم الأول:</span>
                  <span className="font-semibold">{user.firstName}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">البريد الإلكتروني:</span>
                  <span className="font-semibold">{user.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">النقاط:</span>
                <span className="font-semibold text-purple-600">{user.points || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">حساب مبدع:</span>
                <span className="font-semibold text-blue-600">{user.isStreamer ? 'نعم' : 'لا'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الأرباح الإجمالية:</span>
                <span className="font-semibold text-green-600">{user.totalEarnings || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">نوع الحساب:</span>
                <span className="font-semibold">{user.role === 'super_admin' ? 'مسؤول عام' : user.role === 'admin' ? 'مسؤول' : 'مستخدم'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simple Navigation Links */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => window.location.href = '/explore'}>
            تصفح البث المباشر
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/start-stream'}>
            ابدأ بث مباشر
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/gifts'}>
            متجر الهدايا
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/account'}>
            إعدادات الحساب
          </Button>
        </div>
      </main>
    </div>
  );
}