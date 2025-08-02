import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Heart, TrendingUp, Coins, Sparkles, Star, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
// Navigation component not needed for this simple page

interface GiftCharacter {
  id: number;
  name: string;
  emoji?: string;
  description: string;
  pointCost: number;
  animationType: string;
  isActive: boolean;
  rarity?: string;
}

export default function GiftsPage() {
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const { user } = useAuth();

  // Fetch available gifts
  const { data: giftCharacters = [], isLoading } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/gifts/characters');
      return response.json();
    },
  });

  const handleGiftSelect = (gift: GiftCharacter) => {
    setSelectedGift(gift);
    // Here you can add gift sending logic
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الهدايا...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-12 h-12 text-pink-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              متجر الهدايا
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            اختر من مجموعة واسعة من الهدايا الرائعة لإرسالها لأصدقائك
          </p>
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-semibold text-gray-700">
              نقاطك: {user?.points || 0}
            </span>
          </div>
        </div>

        {/* Gifts Grid */}
        <div className="max-w-6xl mx-auto">
          {giftCharacters && giftCharacters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {giftCharacters.map((gift: GiftCharacter) => (
                <Card key={gift.id} className="hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 hover:border-pink-300 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                      {gift.emoji ? (
                        <span className="text-5xl">{gift.emoji}</span>
                      ) : (
                        <Gift className="w-12 h-12 text-pink-500" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {gift.name}
                    </CardTitle>
                    {gift.rarity && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                        {gift.rarity}
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
                    {gift.description && (
                      <p className="text-xs text-gray-500 mt-2">
                        {gift.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">لا توجد هدايا متاحة حالياً</p>
              <p className="text-gray-400">يرجى المحاولة لاحقاً</p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-pink-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-gray-700">نصيحة</span>
          </div>
          <p className="text-gray-600">
            يمكنك كسب المزيد من النقاط من خلال التفاعل مع المحتوى وإنشاء ذكريات جديدة
          </p>
        </div>
      </div>
    </div>
  );
}