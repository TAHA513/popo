import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleNavigation } from '@/components/simple-navigation';
import { Heart, Crown, Diamond, Car, Plane, Castle, Gift, Coins, TrendingUp } from 'lucide-react';
import { GiftShop } from '@/components/gift-shop';
import { useAuth } from '@/hooks/useAuth';

interface GiftCharacter {
  id: number;
  name: string;
  emoji?: string;
  description?: string;
  pointCost?: number;
  point_cost?: number;
  rarity?: string;
  animationType?: string;
  animation_type?: string;
  isActive?: boolean;
  is_active?: boolean;
}

// Gift icons mapping
const giftIcons: Record<string, JSX.Element> = {
  'قلب': <span className="text-5xl">❤️</span>,
  'وردة': <span className="text-5xl">🌹</span>,
  'تاج': <span className="text-5xl">👑</span>,
  'ألماسة': <span className="text-5xl">💎</span>,
  'سيارة': <span className="text-5xl">🚗</span>,
  'طائرة': <span className="text-5xl">✈️</span>,
  'قلعة': <span className="text-5xl">🏰</span>,
  'BoBo Love': <span className="text-5xl">🐰💕</span>,
  'BoFire': <span className="text-5xl">🐲🔥</span>,
  'Nunu Magic': <span className="text-5xl">🦄🌟</span>,
  'Dodo Splash': <span className="text-5xl">🦆💦</span>,
  'Meemo Wink': <span className="text-5xl">🐱🌈</span>,
  'Love Heart': <span className="text-5xl">💝</span>
};

export default function GiftsPageFixed() {
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const { user } = useAuth();

  // Fetch available gifts
  const { data: giftCharacters = [], isLoading, error } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/gifts/characters');
      const data = await response.json();
      console.log('Fetched gifts:', data);
      return data;
    },
    staleTime: 30000,
  });

  console.log('Current state:', { giftCharacters, isLoading, error });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <SimpleNavigation />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="ml-4">جاري تحميل الهدايا...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleGiftSelect = (gift: GiftCharacter) => {
    setSelectedGift(gift);
    setShowGiftShop(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <SimpleNavigation />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-10 h-10 text-pink-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              متجر الهدايا
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            اختر من مجموعة واسعة من الهدايا الرائعة لإرسالها لأصدقائك
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-semibold text-gray-700">
              نقاطك: {user?.points || 0}
            </span>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4 text-sm">
          <p>Debug: عدد الهدايا المحملة: {giftCharacters?.length || 0}</p>
          <p>Loading: {isLoading ? 'نعم' : 'لا'}</p>
          <p>Error: {error ? 'نعم' : 'لا'}</p>
        </div>

        {/* Gifts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {giftCharacters && giftCharacters.length > 0 ? (
            giftCharacters.map((gift: GiftCharacter) => (
              <Card key={gift.id} className="hover:shadow-lg transition-all duration-300 group cursor-pointer border-2 hover:border-pink-300">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                    {gift.emoji ? 
                      <span className="text-5xl">{gift.emoji}</span> : 
                      (giftIcons[gift.name] || <Gift className="w-12 h-12 text-pink-500" />)
                    }
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">
                    {gift.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-xl font-bold text-gray-700">
                      {gift.pointCost || gift.point_cost || 0}
                    </span>
                    <span className="text-sm text-gray-500">نقطة</span>
                  </div>
                  <Button 
                    onClick={() => handleGiftSelect(gift)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    disabled={(user?.points || 0) < (gift.pointCost || gift.point_cost || 0)}
                  >
                    {(user?.points || 0) < (gift.pointCost || gift.point_cost || 0) ? (
                      "نقاط غير كافية"
                    ) : (
                      "إرسال هدية"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">لا توجد هدايا</p>
              <p className="text-sm text-gray-400">البيانات: {JSON.stringify(giftCharacters)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gift Shop Modal */}
      {showGiftShop && selectedGift && (
        <GiftShop
          gift={selectedGift}
          onClose={() => {
            setShowGiftShop(false);
            setSelectedGift(null);
          }}
        />
      )}
    </div>
  );
}