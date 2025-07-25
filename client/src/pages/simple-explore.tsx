import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Heart, ShoppingBag, Sparkles } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";

export default function SimpleExplore() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
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
    feedPetMutation.mutate();
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
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
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
                <h3 className="text-lg font-bold text-gray-800 mb-2">{pet?.name || "أرنوب الصغير"}</h3>
                <p className="text-sm text-gray-600 mb-1">المستوى {pet?.level || 1}</p>
                <p className="text-xs text-gray-500 mb-4">الخبرة: {pet?.experience || 0} نقطة</p>
                
                {/* شريط الصحة */}
                <div className="bg-white/50 rounded-full p-1 mb-4">
                  <div 
                    className="bg-green-500 h-3 rounded-full relative transition-all duration-300"
                    style={{ width: `${pet?.health || 80}%` }}
                  >
                    <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center">
                      صحة {pet?.health || 80}%
                    </span>
                  </div>
                </div>
                
                {/* شريط السعادة */}
                <div className="bg-white/50 rounded-full p-1 mb-6">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full relative transition-all duration-300"
                    style={{ width: `${pet?.happiness || 60}%` }}
                  >
                    <span className="absolute inset-0 text-xs text-white font-bold flex items-center justify-center">
                      سعادة {pet?.happiness || 60}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleFeedPet}
                    disabled={feedPetMutation.isPending}
                  >
                    {feedPetMutation.isPending ? "..." : "🍎 إطعام"}
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={handlePlayWithPet}
                    disabled={playPetMutation.isPending}
                  >
                    {playPetMutation.isPending ? "..." : "🎮 لعب"}
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={() => {
                      document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    🛍️ تسوق
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* متجر الهدايا */}
          <div id="shop-section" className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">🎁 متجر الهدايا</h3>
              <div className="text-sm text-gray-600">
                💰 {user?.points || 0} نقطة
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
                {gardenItems.slice(0, 6).map((item: any) => (
                  <div key={item.id} className={`rounded-xl p-3 text-center relative ${
                    item.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300' :
                    item.rarity === 'epic' ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300' :
                    item.rarity === 'rare' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300' :
                    'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    {item.rarity === 'legendary' && <Sparkles className="absolute top-1 right-1 w-3 h-3 text-yellow-500" />}
                    <div className="text-2xl mb-2">{item.emoji}</div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{item.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{item.price} نقطة</p>
                    <Button 
                      size="sm" 
                      className={`text-xs w-full ${
                        item.type === 'food' ? 'bg-orange-500 hover:bg-orange-600' :
                        item.type === 'toy' ? 'bg-blue-500 hover:bg-blue-600' :
                        item.type === 'decoration' ? 'bg-green-500 hover:bg-green-600' :
                        'bg-purple-500 hover:bg-purple-600'
                      } text-white`}
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
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    alert("🏘️ زرت حديقة أحمد! ثعلب ذكي يرحب بك");
                  }}
                >
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
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    alert("🏘️ زرت حديقة فاطمة! القطة اللطيفة تموء بسعادة");
                  }}
                >
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
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    alert("🏘️ زرت حديقة محمد! الذئب القوي يرحب بك بحماس");
                  }}
                >
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