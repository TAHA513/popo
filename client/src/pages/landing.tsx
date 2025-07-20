import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video, Globe, Users, Gift, Star, Download, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function Landing() {
  const { isInstallable, installApp, isInstalled } = usePWA();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 laa-gradient-bg rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🐰</span>
              </div>
              <span className="font-bold text-2xl text-gray-900 dark:text-white">LaaBoBo Live</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* PWA Install Button */}
              {isInstallable && !isInstalled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={installApp}
                  className="flex items-center gap-2 border-laa-pink text-laa-pink hover:bg-laa-pink hover:text-white"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">تثبيت التطبيق</span>
                </Button>
              )}
              
              <Button onClick={handleLogin} className="bg-laa-pink hover:bg-laa-pink/90 text-white">
                تسجيل الدخول
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="laa-gradient-bg py-20 safe-top">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-bold text-4xl md:text-6xl text-white mb-6">
              مرحباً بك في LaaBoBo Live
            </h1>
            <h2 className="text-xl md:text-2xl text-white/90 mb-6">
              منصة البث المباشر مع نظام الهدايا التفاعلية
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              ابدأ البث المباشر، تواصل مع المشاهدين، واربح من خلال نظام الهدايا الرائع مع شخصيات أصلية مميزة!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-white text-laa-pink hover:bg-gray-100 text-lg px-8 py-4 font-bold"
              >
                <Video className="w-5 h-5 mr-2" />
                ابدأ البث الآن
              </Button>
              
              {isInstallable && !isInstalled && (
                <Button
                  onClick={installApp}
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-laa-pink text-lg px-8 py-4"
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  تثبيت التطبيق
                </Button>
              )}
            </div>

            {/* App Installation Notice */}
            {isInstalled && (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
                <p className="text-white text-sm">
                  ✅ التطبيق مثبت على جهازك! استمتع بتجربة أفضل.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile App Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              تطبيق محمول متكامل
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              استمتع بتجربة LaaBoBo Live على هاتفك مع جميع الميزات المتقدمة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="laa-card-mobile">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-laa-pink/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-laa-pink" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  بث مباشر عالي الجودة
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  ابدأ البث المباشر بجودة HD مع أدوات تفاعلية متقدمة
                </p>
              </CardContent>
            </Card>

            <Card className="laa-card-mobile">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-laa-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-laa-purple" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  نظام هدايا تفاعلي
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  شخصيات أصلية مع تأثيرات بصرية رائعة وأرباح حقيقية
                </p>
              </CardContent>
            </Card>

            <Card className="laa-card-mobile">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-laa-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-laa-blue" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  مجتمع نشط
                </h3>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  تواصل مع المبدعين والمشاهدين من جميع أنحاء العالم
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gift Characters Preview */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              شخصيات الهدايا الأصلية
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              اكتشف مجموعة فريدة من شخصيات الهدايا التفاعلية
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'BoBo Love', emoji: '💖', color: 'from-pink-400 to-pink-600' },
              { name: 'BoFire', emoji: '🔥', color: 'from-orange-400 to-red-600' },
              { name: 'Nunu Magic', emoji: '✨', color: 'from-purple-400 to-purple-600' },
              { name: 'Dodo Splash', emoji: '💧', color: 'from-blue-400 to-blue-600' }
            ].map((character) => (
              <Card key={character.name} className="laa-card-mobile hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${character.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-2xl">{character.emoji}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {character.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    هدية تفاعلية
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="laa-gradient-bg py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            جاهز لتبدأ رحلتك؟
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            انضم إلى آلاف المبدعين والمشاهدين في LaaBoBo Live
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-white text-laa-pink hover:bg-gray-100 text-lg px-8 py-4 font-bold"
            >
              <Video className="w-5 h-5 mr-2" />
              ابدأ الآن
            </Button>
            
            {isInstallable && !isInstalled && (
              <Button
                onClick={installApp}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-laa-pink text-lg px-8 py-4"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                تثبيت التطبيق
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 laa-gradient-bg rounded-full flex items-center justify-center mr-3">
              <span className="text-white">🐰</span>
            </div>
            <span className="font-bold text-xl">LaaBoBo Live</span>
          </div>
          <p className="text-gray-400 mb-4">
            منصة البث المباشر مع نظام الهدايا التفاعلية
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 LaaBoBo Live. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}