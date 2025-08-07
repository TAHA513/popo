import { UserProfile, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageCircle, Gift, Settings, Shield } from 'lucide-react';

// صفحة لوحة التحكم الرئيسية بعد تسجيل الدخول باستخدام Clerk
export default function ClerkDashboard() {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                مرحباً بك في LaaBoBo Garden
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                استكشف منصة التفاعل الاجتماعي والذكريات
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link href="/memories">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Users className="w-5 h-5" />
                      الذكريات
                    </CardTitle>
                    <CardDescription>
                      شارك وشاهد الذكريات الجميلة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      انشر ذكرياتك وتفاعل مع ذكريات الآخرين
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/chat">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
                      <MessageCircle className="w-5 h-5" />
                      المحادثات
                    </CardTitle>
                    <CardDescription>
                      تواصل مع الأصدقاء
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      أرسل الرسائل والهدايا للأصدقاء
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/gifts">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Gift className="w-5 h-5" />
                      الهدايا
                    </CardTitle>
                    <CardDescription>
                      متجر الهدايا المذهلة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      اشترِ وأرسل الهدايا الثلاثية الأبعاد
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* User Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Clerk User Profile */}
              <Card className="bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Settings className="w-5 h-5" />
                    إعدادات الحساب
                  </CardTitle>
                  <CardDescription>
                    إدارة معلومات حسابك وإعداداتك
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <UserProfile 
                      appearance={{
                        elements: {
                          card: "bg-transparent shadow-none border-none",
                          navbar: "hidden",
                          pageScrollBox: "p-0",
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Platform Features */}
              <div className="space-y-6">
                <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Shield className="w-5 h-5" />
                      الأمان والخصوصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      حسابك محمي بنظام Clerk المتقدم للمصادقة
                    </p>
                    <Link href="/privacy">
                      <Button variant="outline" className="w-full">
                        عرض سياسة الخصوصية
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-700 dark:text-orange-300">
                      الميزات المتقدمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ✨ نظام الهدايا ثلاثي الأبعاد
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      💫 الذكريات الدائمة
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      🎮 البث المباشر التفاعلي
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      🏆 نظام التحقق والشارات
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}