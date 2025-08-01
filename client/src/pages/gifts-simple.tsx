import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Coins, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { GiftShop } from '@/components/gift-shop';

interface GiftCharacter {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pointCost: number;
  animationType: string;
  isActive: boolean;
}

export default function GiftsSimple() {
  const [showGiftShop, setShowGiftShop] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const { user } = useAuth();

  // Fetch available gifts
  const { data: gifts = [], isLoading, error } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/gifts/characters');
      const data = await response.json();
      console.log('Gifts data:', data);
      return data;
    },
  });

  const handleGiftClick = (gift: GiftCharacter) => {
    setSelectedGift(gift);
    setShowGiftShop(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">جاري تحميل الهدايا...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-lg text-red-600">خطأ في تحميل الهدايا</p>
            <p className="text-gray-500 mt-2">{error.toString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/home">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎁 متجر الهدايا</h1>
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-700">
                نقاطك: {user?.points || 0}
              </span>
            </div>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">معلومات التشخيص:</h3>
          <p className="text-sm text-blue-700">عدد الهدايا المحملة: {gifts?.length || 0}</p>
          <p className="text-sm text-blue-700">حالة التحميل: {isLoading ? 'جاري التحميل' : 'مكتمل'}</p>
          <p className="text-sm text-blue-700">نوع البيانات: {Array.isArray(gifts) ? 'مصفوفة' : typeof gifts}</p>
        </div>

        {/* Gifts Grid */}
        {!gifts || gifts.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">لا توجد هدايا متاحة</h2>
            <p className="text-gray-500">سيتم إضافة المزيد من الهدايا قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gifts.map((gift: GiftCharacter) => (
              <Card 
                key={gift.id} 
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-pink-300 group"
                onClick={() => handleGiftClick(gift)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="text-6xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {gift.emoji}
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">
                    {gift.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600 mb-4 h-12 flex items-center justify-center">
                    {gift.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-xl font-bold text-gray-700">
                      {gift.pointCost}
                    </span>
                    <span className="text-sm text-gray-500">نقطة</span>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    disabled={(user?.points || 0) < gift.pointCost}
                  >
                    {(user?.points || 0) < gift.pointCost ? (
                      "نقاط غير كافية"
                    ) : (
                      "إرسال هدية"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Gift Shop Modal */}
        <GiftShop
          isOpen={showGiftShop}
          onClose={() => {
            setShowGiftShop(false);
            setSelectedGift(null);
          }}
          receiverId="test-user"
          receiverName="مستخدم تجريبي"
          onGiftSent={() => {
            setShowGiftShop(false);
            setSelectedGift(null);
          }}
        />
      </div>
    </div>
  );
}