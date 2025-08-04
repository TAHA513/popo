import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Sparkles, Crown, Heart, Star } from "lucide-react";
import { EnhancedGiftModal } from "@/components/enhanced-gift-modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";

export default function GiftDemo() {
  const [showGiftModal, setShowGiftModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const demoUsers = [
    { id: 'user1', name: 'أحمد محمد', avatar: '👤' },
    { id: 'user2', name: 'فاطمة علي', avatar: '👩' },
    { id: 'user3', name: 'عمر خالد', avatar: '👨' },
    { id: 'user4', name: 'نور الدين', avatar: '🧑' },
  ];

  const [selectedUser, setSelectedUser] = useState(demoUsers[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-6xl">🎁</div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                تجربة إرسال الهدايا
              </h1>
              <p className="text-gray-600 mt-2">اختبر واجهة إرسال الهدايا الجديدة المحسنة</p>
            </div>
          </div>
        </div>

        {/* User Points Display */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <div>
                <h3 className="text-2xl font-bold text-yellow-700">
                  {user?.points || 1000} نقطة
                </h3>
                <p className="text-yellow-600">رصيدك الحالي</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-purple-700">
              اختر مستقبل الهدية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {demoUsers.map((demoUser) => (
                <div
                  key={demoUser.id}
                  onClick={() => setSelectedUser(demoUser)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                    selectedUser.id === demoUser.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-4xl mb-2">{demoUser.avatar}</div>
                  <h4 className="font-semibold">{demoUser.name}</h4>
                  {selectedUser.id === demoUser.id && (
                    <div className="mt-2">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        مختار ✓
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gift Features Showcase */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-purple-700">
              مميزات واجهة الهدايا الجديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <Gift className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <h4 className="font-bold text-purple-700 mb-2">تصميم محسن</h4>
                <p className="text-sm text-purple-600">
                  واجهة جديدة بتدرج بنفسجي جميل مطابقة للتصميم المطلوب
                </p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-bold text-yellow-700 mb-2">هدايا متنوعة</h4>
                <p className="text-sm text-yellow-600">
                  مجموعة واسعة من الهدايا المنظمة حسب السعر والتصنيف
                </p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-blue-50">
                <Star className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-green-700 mb-2">تفاعل سهل</h4>
                <p className="text-sm text-green-600">
                  واجهة سهلة الاستخدام مع رسوم متحركة وتأثيرات بصرية
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Action Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowGiftModal(true)}
            size="lg"
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 text-white text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <Gift className="w-8 h-8 ml-3" />
            <span className="font-bold">جرب إرسال هدية الآن</span>
            <Sparkles className="w-6 h-6 mr-3" />
          </Button>
          
          <p className="text-gray-600 mt-4 text-sm">
            سيتم إرسال الهدية إلى: <span className="font-bold text-purple-600">{selectedUser.name}</span>
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-bold text-green-700">متصل</h4>
              <p className="text-sm text-green-600">النظام يعمل بكفاءة</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-bold text-blue-700">محسن</h4>
              <p className="text-sm text-blue-600">واجهة محدثة ومطورة</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-bold text-purple-700">جاهز</h4>
              <p className="text-sm text-purple-600">تم تطبيق التحديثات</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />

      {/* Enhanced Gift Modal */}
      <EnhancedGiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        receiverId={selectedUser.id}
        receiverName={selectedUser.name}
        onGiftSent={(gift) => {
          toast({
            title: "تم إرسال الهدية بنجاح! 🎉",
            description: `تم إرسال ${gift.name} إلى ${selectedUser.name}`,
          });
          
          // Show success animation or feedback
          setTimeout(() => {
            toast({
              title: "مفاجأة! 💝",
              description: "حصلت على نقاط مكافأة لإرسال الهدية",
            });
          }, 2000);
        }}
      />
    </div>
  );
}