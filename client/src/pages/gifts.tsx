import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Crown, Diamond, Car, Plane, Castle, Gift, Coins, TrendingUp } from 'lucide-react';
import { GiftShop } from '@/components/gift-shop';
import { useAuth } from '@/hooks/useAuth';

interface GiftCharacter {
  id: number;
  name: string;
  emoji?: string;
  description?: string;
  pointCost: number;
  rarity?: string;
  animationType?: string;
  isActive?: boolean;
  hasSound?: boolean;
  hasSpecialEffects?: boolean;
  effectDuration?: number;
}

const giftIcons: Record<string, React.ReactNode> = {
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

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-500';
    case 'rare': return 'bg-blue-500';
    case 'epic': return 'bg-purple-500';
    case 'legendary': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
};

const getRarityText = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'عادي';
    case 'rare': return 'نادر';
    case 'epic': return 'أسطوري';
    case 'legendary': return 'خرافي';
    default: return 'عادي';
  }
};

export default function GiftsPage() {
  console.log('🎁 GiftsPage component rendered');
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const { user } = useAuth();
  
  console.log('🎁 Current user:', user);

  // Fetch available gifts
  const { data: giftCharacters = [], isLoading, error } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      console.log('🎁 Fetching gift characters...');
      try {
        const response = await fetch('/api/gifts/characters', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🎁 Gift characters loaded:', data);
        return data;
      } catch (err) {
        console.error('🎁 Error fetching gift characters:', err);
        throw err;
      }
    },
    staleTime: 30000, // Cache for 30 seconds
  });
  


  // Fetch user's sent gifts
  const { data: sentGifts = [] } = useQuery({
    queryKey: ['/api/gifts/sent', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/gifts/sent/${user?.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sent gifts');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch user's received gifts
  const { data: receivedGifts = [] } = useQuery({
    queryKey: ['/api/gifts/received', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/gifts/received/${user?.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch received gifts');
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    console.log('🎁 Loading gifts page...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-lg text-gray-600">جاري تحميل الهدايا...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('🎁 Error in gifts page:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Gift className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-lg text-red-600">خطأ في تحميل الهدايا</p>
              <p className="text-gray-500 mt-2">{error.toString()}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                إعادة المحاولة
              </button>
            </div>
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

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              تصفح الهدايا
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              الهدايا المرسلة
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              الهدايا المستقبلة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="text-center p-6">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))
              ) : giftCharacters && giftCharacters.length > 0 ? (
                giftCharacters.map((gift: GiftCharacter) => (
                <Card key={gift.id} className="hover:shadow-lg transition-all duration-300 group cursor-pointer border-2 hover:border-pink-300">
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                      {gift.emoji ? <span className="text-5xl">{gift.emoji}</span> : (giftIcons[gift.name] || <Gift className="w-12 h-12 text-pink-500" />)}
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {gift.name}
                    </CardTitle>
                    {gift.rarity && (
                      <Badge className={`${getRarityColor(gift.rarity)} text-white text-xs`}>
                        {getRarityText(gift.rarity)}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-xl font-bold text-gray-700">
                        {gift.pointCost}
                      </span>
                      <span className="text-sm text-gray-500">نقطة</span>
                    </div>
                    <Button 
                      onClick={() => handleGiftSelect(gift)}
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
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 mb-2">لا توجد هدايا متاحة حالياً</p>
                  <p className="text-gray-400">يرجى المحاولة لاحقاً</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="space-y-4">
              {sentGifts.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لم ترسل أي هدايا بعد</p>
                </div>
              ) : (
                sentGifts.map((gift: any) => (
                  <Card key={gift.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {giftIcons[gift.characterName] || <Gift className="w-8 h-8 text-pink-500" />}
                        <div>
                          <p className="font-semibold">{gift.characterName}</p>
                          <p className="text-sm text-gray-500">إلى: {gift.receiverName}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          {gift.pointCost} نقطة
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(gift.sentAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="received">
            <div className="space-y-4">
              {receivedGifts.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لم تستقبل أي هدايا بعد</p>
                </div>
              ) : (
                receivedGifts.map((gift: any) => (
                  <Card key={gift.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {giftIcons[gift.characterName] || <Gift className="w-8 h-8 text-pink-500" />}
                        <div>
                          <p className="font-semibold">{gift.characterName}</p>
                          <p className="text-sm text-gray-500">من: {gift.senderName}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="flex items-center gap-1 text-green-600">
                          <Coins className="w-4 h-4" />
                          +{Math.floor(gift.pointCost * 0.6)} نقطة
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(gift.sentAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Gift Shop Modal */}
        <GiftShop
          isOpen={showGiftShop}
          onClose={() => {
            setShowGiftShop(false);
            setSelectedGift(null);
          }}
          receiverId="placeholder" // Will show user selector 
          receiverName="اختر المستلم"
          onGiftSent={() => {
            setShowGiftShop(false);
            setSelectedGift(null);
          }}
        />
      </div>
    </div>
  );
}