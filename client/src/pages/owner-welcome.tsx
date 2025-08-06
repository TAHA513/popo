import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Shield } from "lucide-react";

export default function OwnerWelcome() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto-redirect to admin panel after welcome message
    const timer = setTimeout(() => {
      setLocation('/tiktok-admin-panel-secure-access-laabobogarden-owner-dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4 bg-gray-900/90 border-yellow-500 border-2 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <div className="mb-8">
            <Crown className="h-20 w-20 text-yellow-400 mx-auto mb-6 animate-pulse" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">مرحباً مالك النظام</h1>
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-purple-300 text-lg">أهلاً بك في LaaBoBo Garden</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <Shield className="h-5 w-5" />
              <span>تم التحقق من الهوية بنجاح</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-blue-400">
              <Crown className="h-5 w-5" />
              <span>صلاحيات المدير الفائق مفعلة</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 border border-purple-500/30">
            <p className="text-white text-sm mb-3">جاري توجيهك للوحة التحكم...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
          </div>

          <p className="text-gray-400 text-xs mt-6">
            TikTok-Style Security • LaaBoBo Owner Panel
          </p>
        </CardContent>
      </Card>
    </div>
  );
}