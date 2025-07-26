import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Heart, ShoppingBag, Sparkles, Users, GamepadIcon, ArrowLeft } from "lucide-react";
import CharacterSelector from "@/components/CharacterSelector";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import FriendsGardens from "@/components/FriendsGardens";
import MultiplayerGames from "@/components/MultiplayerGames";

export default function GamesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCharacters, setShowCharacters] = useState(false);
  const [showGiftSending, setShowGiftSending] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  
  // Fetch user's pet
  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['/api/garden/pet'],
    enabled: !!user,
  });

  // Fetch garden items/shop
  const { data: gardenItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/garden/shop'],
    enabled: !!user,
  });

  // Fetch user's inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/garden/inventory'],
    enabled: !!user,
  });

  // Fetch user's friends
  const { data: friends = [] } = useQuery({
    queryKey: ['/api/friends'],
    enabled: !!user,
  });

  // Feed pet mutation
  const feedPetMutation = useMutation({
    mutationFn: (itemId?: string) => apiRequest('/api/garden/pet/feed', 'POST', { itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/garden/pet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/garden/inventory'] });
    }
  });

  // Play with pet mutation
  const playPetMutation = useMutation({
    mutationFn: () => apiRequest('/api/garden/pet/play', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/garden/pet'] });
    }
  });

  // Buy item mutation
  const buyItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => 
      apiRequest('/api/garden/shop/buy', 'POST', { itemId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/garden/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }); // Refresh user points
    }
  });

  const handleFeedPet = () => {
    feedPetMutation.mutate(undefined);
    toast({
      title: "🍎 تم إطعام الحيوان الأليف!",
      description: "أرنوب الصغير سعيد جداً",
    });
  };

  const handlePlayWithPet = () => {
    playPetMutation.mutate();
    toast({
      title: "🎾 وقت اللعب!",
      description: "أرنوب الصغير يستمتع باللعب معك",
    });
  };

  const handleBuyItem = (itemId: string, quantity: number = 1) => {
    buyItemMutation.mutate({ itemId, quantity });
    toast({
      title: "🛒 تم الشراء بنجاح!",
      description: "تم إضافة العنصر إلى مخزنك",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول أولاً</h2>
          <Button onClick={() => setLocation("/login")}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>العودة</span>
            </button>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-sm mx-auto">
        {/* الألعاب - نظام الحديقة والألعاب */}
        <div className="p-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎮 صالة الألعاب</h2>
            <p className="text-gray-600 text-sm">اعتني بحيوانك الأليف والعب مع الأصدقاء</p>
          </div>

          {/* My Pet Section */}
          {petLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">جاري تحميل حيوانك الأليف...</p>
            </div>
          ) : pet ? (
            <div className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-6 rounded-2xl mb-6 shadow-xl">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{pet.character?.emoji || '🐰'}</div>
                <h3 className="text-white text-xl font-bold">{pet.name || 'أرنوب الصغير'}</h3>
                <p className="text-white/80 text-sm">المستوى {pet.level || 1}</p>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="bg-white/20 rounded-full p-2">
                  <div className="flex justify-between text-white text-sm mb-1">
                    <span>الصحة</span>
                    <span>{pet.health || 80}/100</span>
                  </div>
                  <div className="bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pet.health || 80}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white/20 rounded-full p-2">
                  <div className="flex justify-between text-white text-sm mb-1">
                    <span>السعادة</span>
                    <span>{pet.happiness || 75}/100</span>
                  </div>
                  <div className="bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pet.happiness || 75}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleFeedPet}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs py-2 px-3 rounded-lg"
                  disabled={feedPetMutation.isPending}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  إطعام
                </Button>
                <Button
                  onClick={handlePlayWithPet}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded-lg"
                  disabled={playPetMutation.isPending}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  لعب
                </Button>
                <Button
                  onClick={() => setShowShopping(!showShopping)}
                  className="bg-purple-500 hover:bg-purple-600 text-white text-xs py-2 px-3 rounded-lg"
                >
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  تسوق
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🐰</div>
              <p className="text-gray-500 mb-4">لم يتم العثور على حيوان أليف</p>
              <Button onClick={() => setShowCharacters(true)}>
                اختر حيوانك الأليف
              </Button>
            </div>
          )}

          {/* Character Selection Modal */}
          {showCharacters && (
            <CharacterSelector
              isOpen={showCharacters}
              onClose={() => setShowCharacters(false)}
              onSelectCharacter={(character) => {
                console.log('Selected character:', character);
                setShowCharacters(false);
              }}
            />
          )}

          {/* Shopping Section */}
          {showShopping && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" />
                متجر الحديقة
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {gardenItems.slice(0, 8).map((item: any) => (
                  <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border">
                    <div className="text-2xl mb-2 text-center">{item.emoji || '🎁'}</div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-1">{item.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600 font-bold text-sm">{item.cost} نقطة</span>
                      <Button
                        onClick={() => handleBuyItem(item.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded"
                        disabled={buyItemMutation.isPending}
                      >
                        شراء
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multiplayer Games Section */}
          <MultiplayerGames />

          {/* Friends Gardens Section */}
          <FriendsGardens friends={friends} />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}