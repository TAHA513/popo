import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Coins, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import SimpleNavigation from '@/components/simple-navigation';

interface GiftCharacter {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pointCost: number;
}

export default function SimpleGifts() {
  const { user } = useAuth();

  // Fetch available gifts
  const { data: gifts = [], isLoading, error } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/gifts/characters');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('تم تحميل الهدايا:', data);
        return data;
      } catch (err) {
        console.error('خطأ في تحميل الهدايا:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Gift className="w-12 h-12 text-pink-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">متجر الهدايا</h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            اختر من مجموعة واسعة من الهدايا الرائعة
          </p>
          
          {user && (
            <div className="bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 inline-flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-xl font-bold text-gray-800">
                {user.points || 0} نقطة
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">جاري تحميل الهدايا...</p>
            <p className="text-sm text-gray-500 mt-2">يرجى الانتظار قليلاً...</p>
            <div className="mt-4 text-xs text-gray-400">
              إذا استمر التحميل طويلاً، تحقق من الاتصال بالإنترنت
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-xl text-red-600">خطأ في تحميل الهدايا</p>
            <p className="text-gray-500 mt-2">تفاصيل الخطأ: {error.toString()}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white"
            >
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Debug Information */}
        {!isLoading && !error && (
          <div className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">معلومات التحميل:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">حالة التحميل: </span>
                <span className="font-semibold">{isLoading ? 'جاري التحميل' : 'مكتمل'}</span>
              </div>
              <div>
                <span className="text-blue-700">عدد الهدايا: </span>
                <span className="font-semibold">{gifts?.length || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">نوع البيانات: </span>
                <span className="font-semibold">{Array.isArray(gifts) ? 'مصفوفة صحيحة' : typeof gifts}</span>
              </div>
              <div>
                <span className="text-blue-700">المستخدم: </span>
                <span className="font-semibold">{user ? user.username : 'غير مسجل'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Gifts Grid */}
        {!isLoading && !error && gifts && gifts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {gifts.map((gift: GiftCharacter) => (
              <Card 
                key={gift.id} 
                className="bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-pink-400 group transform hover:scale-105"
              >
                <CardContent className="p-6 text-center">
                  {/* Gift Emoji */}
                  <div className="text-6xl mb-4 group-hover:animate-bounce">
                    {gift.emoji || '🎁'}
                  </div>
                  
                  {/* Gift Name */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {gift.name}
                  </h3>
                  
                  {/* Gift Description */}
                  <p className="text-sm text-gray-600 mb-4 h-12 flex items-center justify-center">
                    {gift.description || 'هدية رائعة'}
                  </p>
                  
                  {/* Price */}
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full px-4 py-2 mb-4">
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{gift.pointCost}</span>
                      <span className="text-sm">نقطة</span>
                    </div>
                  </div>
                  
                  {/* Send Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300"
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
        ) : !isLoading && !error && (
          <div className="text-center py-16">
            <Gift className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-600 mb-4">لا توجد هدايا متاحة</h2>
            <p className="text-gray-500 text-lg">سيتم إضافة المزيد من الهدايا قريباً</p>
          </div>
        )}
      </div>
    </div>
  );
}