import React, { useState, useEffect } from 'react';
import { Gift, Coins, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SimpleNavigation from '@/components/simple-navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface GiftCharacter {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pointCost: number;
}

export default function GiftsTest() {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGifts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('بدء تحميل الهدايا...');
      
      const response = await fetch('/api/gifts/characters', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('حالة الاستجابة:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`خطأ HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('البيانات المحملة:', data);
      
      if (Array.isArray(data)) {
        setGifts(data);
        console.log(`تم تحميل ${data.length} هدية بنجاح`);
      } else {
        throw new Error('البيانات المستلمة ليست مصفوفة');
      }
      
    } catch (err) {
      console.error('خطأ في تحميل الهدايا:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGifts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Gift className="w-12 h-12 text-pink-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">متجر الهدايا - اختبار</h1>
          </div>
          
          {user && (
            <div className="bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 inline-flex items-center gap-2 mb-4">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-xl font-bold text-gray-800">
                {user.points || 0} نقطة
              </span>
            </div>
          )}
          
          <Button 
            onClick={loadGifts} 
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تحميل
          </Button>
        </div>

        {/* Status Information */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-4">معلومات حالة التحميل:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <span className="text-blue-700 font-semibold">حالة التحميل: </span>
              <span className={`font-bold ${isLoading ? 'text-orange-600' : 'text-green-600'}`}>
                {isLoading ? '🔄 جاري التحميل...' : '✅ مكتمل'}
              </span>
            </div>
            <div className="bg-white p-3 rounded">
              <span className="text-blue-700 font-semibold">عدد الهدايا: </span>
              <span className="font-bold text-purple-600">{gifts.length}</span>
            </div>
            <div className="bg-white p-3 rounded">
              <span className="text-blue-700 font-semibold">نوع البيانات: </span>
              <span className="font-bold text-green-600">
                {Array.isArray(gifts) ? '✅ مصفوفة صحيحة' : '❌ غير صحيح'}
              </span>
            </div>
            <div className="bg-white p-3 rounded">
              <span className="text-blue-700 font-semibold">المستخدم: </span>
              <span className="font-bold text-indigo-600">
                {user ? `✅ ${user.username}` : '❌ غير مسجل'}
              </span>
            </div>
            <div className="bg-white p-3 rounded">
              <span className="text-blue-700 font-semibold">حالة الخطأ: </span>
              <span className={`font-bold ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error ? `❌ ${error}` : '✅ لا يوجد'}
              </span>
            </div>
            <div className="bg-white p-3 rounded">
              <span className="text-blue-700 font-semibold">وقت التحديث: </span>
              <span className="font-bold text-gray-600">
                {new Date().toLocaleTimeString('ar-SA')}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-2xl text-gray-700 mb-2">جاري تحميل الهدايا...</p>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 mx-auto max-w-lg">
              <Gift className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">خطأ في التحميل</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                onClick={loadGifts} 
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* Success State - Show Gifts */}
        {!isLoading && !error && gifts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {gifts.map((gift) => (
              <Card 
                key={gift.id} 
                className="bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-pink-400 group transform hover:scale-105"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-4 group-hover:animate-bounce">
                    {gift.emoji || '🎁'}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {gift.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 h-12 flex items-center justify-center">
                    {gift.description || 'هدية رائعة'}
                  </p>
                  
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full px-4 py-2 mb-4">
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{gift.pointCost}</span>
                      <span className="text-sm">نقطة</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-full"
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

        {/* Empty State */}
        {!isLoading && !error && gifts.length === 0 && (
          <div className="text-center py-16">
            <Gift className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-600 mb-4">لا توجد هدايا متاحة</h2>
            <p className="text-gray-500 text-lg mb-6">لم يتم العثور على أي هدايا في قاعدة البيانات</p>
            <Button 
              onClick={loadGifts} 
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              إعادة المحاولة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}