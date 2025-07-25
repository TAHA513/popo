import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Heart, ShoppingBag, Sparkles, Users, GamepadIcon } from "lucide-react";
import CharacterSelector from "@/components/CharacterSelector";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import FriendsGardens from "@/components/FriendsGardens";
import MultiplayerGames from "@/components/MultiplayerGames";

export default function SimpleExplore() {
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
  };

  const handlePlayWithPet = () => {
    playPetMutation.mutate();
  };

  const handleBuyItem = (itemId: string) => {
    buyItemMutation.mutate({ itemId, quantity: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🎮</div>
              <h1 className="text-xl font-bold text-purple-600">صالة الألعاب</h1>
            </div>
            
            {/* Create Memory Button - Right Side */}
            <Button 
              onClick={() => setLocation('/create-memory')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">إنشاء ذكرى</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Player Profile & Achievements */}
        <div className="p-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                  🎮
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.username || "اللاعب"}</h2>
                  <p className="text-sm opacity-90">المستوى {Math.floor((user?.points || 0) / 100) + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{user?.points || 0}</div>
                <div className="text-xs opacity-80">نقطة</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">التقدم للمستوى التالي</span>
                <span className="text-sm opacity-90">{((user?.points || 0) % 100)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((user?.points || 0) % 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-lg font-bold">🎮</div>
                <div className="text-xs">4 شخصيات مملوكة</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="text-lg font-bold">⭐</div>
                  <div className="text-xs">المستوى</div>
                  <div className="text-sm font-bold">{Math.floor((user?.points || 0) / 100) + 1}</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="text-lg font-bold">🏆</div>
                  <div className="text-xs">الانتصارات</div>
                  <div className="text-sm font-bold">45</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="text-lg font-bold">🎁</div>
                  <div className="text-xs">هدايا مرسلة</div>
                  <div className="text-sm font-bold">12</div>
                </div>
              </div>
            </div>
          </div>

          {/* الحديقة الشخصية */}
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-6 mb-6">
            {petLoading ? (
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="text-6xl mb-4">🐰</div>
                  <div className="h-4 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-24 mx-auto mb-4"></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🐰</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{(pet as any)?.name || "أرنوب الصغير"}</h3>
                <p className="text-sm text-gray-600 mb-1">المستوى {(pet as any)?.level || 1}</p>
                <p className="text-xs text-gray-500 mb-4">الخبرة: {(pet as any)?.experience || 0} نقطة</p>
                
                {/* شريط الصحة */}
                <div className="bg-white/50 rounded-full p-1 mb-4">
                  <div 
                    className="bg-green-500 h-3 rounded-full relative transition-all duration-300"
                    style={{ width: `${(pet as any)?.health || 80}%` }}
                  >
                    <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center">
                      صحة {(pet as any)?.health || 80}%
                    </span>
                  </div>
                </div>
                
                {/* شريط السعادة */}
                <div className="bg-white/50 rounded-full p-1 mb-6">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full relative transition-all duration-300"
                    style={{ width: `${(pet as any)?.happiness || 60}%` }}
                  >
                    <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center">
                      سعادة {(pet as any)?.happiness || 60}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => setShowCharacters(!showCharacters)}
                  >
                    🎮 شخصيات
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={() => setShowShopping(!showShopping)}
                  >
                    🛒 متجر
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={() => setShowGiftSending(!showGiftSending)}
                  >
                    🎁 هدايا
                  </Button>
                </div>

                {/* Character Selection Section */}
                {showCharacters && (
                  <div className="bg-white/80 rounded-xl p-4">
                    <CharacterSelector />
                  </div>
                )}

                {/* Gift Sending Interface */}
                {showGiftSending && (
                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 mt-4">
                    <h5 className="text-lg font-bold text-purple-600 mb-4 text-center">🎁 إرسال الهدايا والشخصيات</h5>
                    
                    {/* Friend Selection */}
                    <div className="mb-4">
                      <h6 className="font-bold text-gray-800 mb-2">اختر صديق لإرسال الهدية:</h6>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {(friends as any[] || []).map((friend: any) => (
                          <Button
                            key={friend.user.id}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs p-2"
                            onClick={() => alert(`تم اختيار ${friend.user.username} لإرسال الهدية`)}
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span>👤</span>
                              <span>{friend.user.username}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Gift Type Selection */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <h6 className="font-bold text-gray-800 mb-2">🎮 إرسال شخصية</h6>
                        <div className="grid grid-cols-3 gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" 
                                  onClick={() => alert("إرسال علي المحارب بـ 200 نقطة!\nسيتم خصم النقاط من محفظتك")}>
                            ⚔️ علي (200)
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  onClick={() => alert("إرسال محمد الساحر بـ 300 نقطة!\nسيتم خصم النقاط من محفظتك")}>
                            🧙‍♂️ محمد (300)
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                  onClick={() => alert("إرسال أسطورة التنانين بـ 8000 نقطة!\nشخصية VIP حصرية 👑")}>
                            🐲 أسطورة (8000)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shopping Interface */}
                {showShopping && (
                  <div className="bg-white/80 rounded-xl p-4 mt-4">
                    <h5 className="text-lg font-bold text-purple-600 mb-4 text-center">🛒 متجر التطويرات</h5>
                    
                    {/* Shopping Items Preview */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">🔋</div>
                        <h6 className="font-bold text-sm mb-1">طاقة +1</h6>
                        <p className="text-xs text-gray-600 mb-2">زيادة النمو والنشاط</p>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full">
                          800 نقطة
                        </Button>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">🧠</div>
                        <h6 className="font-bold text-sm mb-1">ذكاء +1</h6>
                        <p className="text-xs text-gray-600 mb-2">نقاط مضاعفة</p>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                          1200 نقطة
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Free Decorative Items */}
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">🎁 الهدايا التزيينية</h3>
              <div className="text-sm text-green-600 font-bold">
                🆓 مجاني للجميع
              </div>
            </div>
            
            {itemsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-gray-100 rounded-xl p-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-1"></div>
                    <div className="h-2 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(gardenItems as any[] || []).slice(0, 6).map((item: any) => (
                  <div key={item.id} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-3 text-center relative">
                    <div className="text-2xl mb-2">{item.emoji || "🎁"}</div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{item.name || "هدية"}</p>
                    <p className="text-xs text-gray-500 mb-2">{item.price || 0} نقطة</p>
                    <Button 
                      size="sm" 
                      className="text-xs w-full bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => handleBuyItem(item.id)}
                      disabled={buyItemMutation.isPending || (user?.points || 0) < item.price}
                    >
                      {buyItemMutation.isPending ? "..." : 
                       (user?.points || 0) < item.price ? "غير متاح" : "شراء"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* حدائق الأصدقاء */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <FriendsGardens />
          </div>

          {/* الألعاب الجماعية */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <MultiplayerGames />
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}