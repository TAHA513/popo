import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User,
  Radio
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // البثوث المباشرة
  const { data: streams = [] } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 10000,
  });



  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            
            {/* Live Stream Button - Right Side */}
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <Radio className="w-4 h-4" />
              <span className="text-sm font-bold">بث مباشر</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-md mx-auto">
        {/* حديقة LaaBoBo الاجتماعية */}
        <div className="p-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🌸 حديقة LaaBoBo</h2>
            <p className="text-gray-600 text-sm">اعتني بشخصيتك وتفاعل مع الأصدقاء</p>
          </div>
          {/* الحديقة الشخصية */}
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🐰</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">أرنوب الصغير</h3>
              <p className="text-sm text-gray-600 mb-4">شخصيتك الافتراضية</p>
              
              {/* شريط الصحة */}
              <div className="bg-white/50 rounded-full p-1 mb-4">
                <div className="bg-green-500 h-3 rounded-full w-4/5 relative">
                  <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center">
                    صحة 80%
                  </span>
                </div>
              </div>
              
              {/* شريط السعادة */}
              <div className="bg-white/50 rounded-full p-1 mb-6">
                <div className="bg-yellow-500 h-3 rounded-full w-3/5 relative">
                  <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center">
                    سعادة 60%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  🍎 إطعام
                </Button>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                  🎮 لعب
                </Button>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                  🛍️ تسوق
                </Button>
              </div>
            </div>
          </div>

          {/* متجر الهدايا */}
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🎁 متجر الهدايا</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-3 text-center">
                <div className="text-3xl mb-2">🍯</div>
                <p className="text-sm font-semibold text-gray-700">عسل طبيعي</p>
                <p className="text-xs text-gray-500 mb-2">يزيد الصحة +20</p>
                <Button size="sm" className="bg-laa-pink hover:bg-laa-pink/90 w-full">
                  10 نقاط
                </Button>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-3 text-center">
                <div className="text-3xl mb-2">🎾</div>
                <p className="text-sm font-semibold text-gray-700">كرة ملونة</p>
                <p className="text-xs text-gray-500 mb-2">يزيد السعادة +30</p>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 w-full">
                  15 نقاط
                </Button>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-3 text-center">
                <div className="text-3xl mb-2">👑</div>
                <p className="text-sm font-semibold text-gray-700">تاج ذهبي</p>
                <p className="text-xs text-gray-500 mb-2">اكسسوار فاخر</p>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 w-full">
                  50 نقاط
                </Button>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-xl p-3 text-center">
                <div className="text-3xl mb-2">💐</div>
                <p className="text-sm font-semibold text-gray-700">باقة ورد</p>
                <p className="text-xs text-gray-500 mb-2">هدية رومانسية</p>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 w-full">
                  25 نقاط
                </Button>
              </div>
            </div>
          </div>

          {/* حدائق الأصدقاء */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🏘️ حدائق الأصدقاء</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🦊</div>
                  <div>
                    <p className="font-semibold text-gray-800">أحمد</p>
                    <p className="text-xs text-gray-500">ثعلب ذكي - مستوى 12</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  زيارة
                </Button>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🐱</div>
                  <div>
                    <p className="font-semibold text-gray-800">فاطمة</p>
                    <p className="text-xs text-gray-500">قطة لطيفة - مستوى 8</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  زيارة
                </Button>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🐺</div>
                  <div>
                    <p className="font-semibold text-gray-800">محمد</p>
                    <p className="text-xs text-gray-500">ذئب قوي - مستوى 15</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  زيارة
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}