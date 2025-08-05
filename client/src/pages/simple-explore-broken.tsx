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
            
            {/* Player Profile & Owned Characters */}
            <div className="grid grid-cols-1 gap-3 text-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-lg font-bold mb-2">🎮 شخصياتي المملوكة</div>
                <div className="flex justify-center space-x-2 space-x-reverse mb-2">
                  <span className="text-2xl">⚔️</span>
                  <span className="text-2xl">👩‍⚕️</span>
                  <span className="text-2xl">🧙‍♂️</span>
                  <span className="text-2xl">🐲</span>
                </div>
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
                    <h5 className="text-lg font-bold text-purple-600 mb-4 text-center">🎭 اختر شخصيتك للألعاب</h5>
                    <div className="grid grid-cols-2 gap-2 mb-4 max-h-96 overflow-y-auto">
                      {[
                        // شخصيات مجانية
                        { id: "1", name: "علي المحارب", type: "warrior", emoji: "⚔️", rarity: "common", price: 0, badge: "" },
                        { id: "2", name: "فاطمة الطبيبة", type: "medic", emoji: "👩‍⚕️", rarity: "common", price: 0, badge: "" },
                        
                        // شخصيات عادية
                        { id: "3", name: "محمد الساحر", type: "mage", emoji: "🧙‍♂️", rarity: "rare", price: 200, badge: "" },
                        { id: "4", name: "عائشة الرامية", type: "archer", emoji: "🏹", rarity: "rare", price: 300, badge: "" },
                        { id: "5", name: "خالد الفارس", type: "knight", emoji: "🛡️", rarity: "rare", price: 250, badge: "" },
                        { id: "6", name: "زينب النينجا", type: "ninja", emoji: "🥷", rarity: "epic", price: 800, badge: "" },
                        { id: "7", name: "عمر الصياد", type: "hunter", emoji: "🏹", rarity: "epic", price: 700, badge: "" },
                        { id: "8", name: "مريم الأميرة", type: "healer", emoji: "✨", rarity: "legendary", price: 1500, badge: "" },
                        { id: "9", name: "يوسف البطل", type: "hero", emoji: "🦸‍♂️", rarity: "legendary", price: 1800, badge: "" },
                        { id: "10", name: "ليلى السحرية", type: "witch", emoji: "🔮", rarity: "legendary", price: 2000, badge: "" },
                        
                        // شخصيات VIP غالية جداً
                        { id: "11", name: "أسطورة التنانين", type: "dragon_lord", emoji: "🐲", rarity: "mythic", price: 8000, badge: "👑" },
                        { id: "12", name: "إمبراطور الليل", type: "night_emperor", emoji: "🌙", rarity: "mythic", price: 12000, badge: "🌟" },
                        { id: "13", name: "ملك الظلام", type: "shadow_king", emoji: "👤", rarity: "mythic", price: 15000, badge: "⚡" },
                        { id: "14", name: "آلهة النور", type: "light_goddess", emoji: "☀️", rarity: "mythic", price: 20000, badge: "🔥" },
                        { id: "15", name: "سلطان الكون", type: "universe_sultan", emoji: "🌌", rarity: "mythic", price: 25000, badge: "💎" },
                        { id: "16", name: "ملكة الزمن", type: "time_queen", emoji: "⏳", rarity: "mythic", price: 30000, badge: "⭐" },
                        { id: "17", name: "إمبراطور الجحيم", type: "hell_emperor", emoji: "🔥", rarity: "mythic", price: 35000, badge: "😈" },
                        { id: "18", name: "آلهة الجنة", type: "heaven_goddess", emoji: "👼", rarity: "mythic", price: 40000, badge: "😇" },
                        { id: "19", name: "سيد الأبعاد", type: "dimension_lord", emoji: "🌀", rarity: "mythic", price: 50000, badge: "🌈" },
                        { id: "20", name: "ملك الملوك", type: "king_of_kings", emoji: "👑", rarity: "mythic", price: 100000, badge: "💫" }
                      ].map((character) => (
                        <div key={character.id} className={`p-3 rounded-lg border-2 transition-all hover:scale-105 relative ${
                          character.rarity === 'mythic' ? 'bg-gradient-to-br from-purple-200 via-pink-200 to-red-200 border-purple-500 shadow-lg animate-pulse' :
                          character.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300' :
                          character.rarity === 'epic' ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300' :
                          character.rarity === 'rare' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300' :
                          'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
                        }`}>
                          {/* VIP Badge for Mythic Characters */}
                          {character.rarity === 'mythic' && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg animate-spin-slow">
                              {character.badge}
                            </div>
                          )}
                          
                          <div className="text-center">
                            <div className="text-3xl mb-2">{character.emoji}</div>
                            <h6 className={`text-sm font-bold mb-1 ${
                              character.rarity === 'mythic' ? 'text-purple-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-gray-800'
                            }`}>
                              {character.name}
                              {character.rarity === 'mythic' && <span className="ml-1">{character.badge}</span>}
                            </h6>
                            <p className="text-xs text-gray-600 mb-2 capitalize">{character.type}</p>
                            {character.rarity === 'mythic' && (
                              <div className="text-xs font-bold text-purple-600 mb-2 bg-purple-100 rounded-full px-2 py-1">
                                🌟 VIP حصري
                              </div>
                            )}
                            {character.price === 0 ? (
                              <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white text-xs" onClick={() => alert(`تم اختيار ${character.name}!`)}>
                                🆓 مجاني
                              </Button>
                            ) : character.rarity === 'mythic' ? (
                              <Button 
                                size="sm" 
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-lg"
                                onClick={() => alert(`شراء شخصية VIP: ${character.name} بـ ${character.price.toLocaleString()} نقطة!\nستحصل على علامة مميزة: ${character.badge}`)}
                                disabled={(user?.points || 0) < character.price}
                              >
                                👑 {character.price.toLocaleString()}
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs"
                                onClick={() => alert(`شراء ${character.name} بـ ${character.price} نقطة`)}
                                disabled={(user?.points || 0) < character.price}
                              >
                                💎 {character.price}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* VIP Benefits Info */}
                    <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-center mb-3">
                      <h6 className="font-bold mb-2">👑 مزايا الشخصيات VIP</h6>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white bg-opacity-20 rounded p-2">
                          <div className="text-lg mb-1">🌟</div>
                          <p>علامة مميزة</p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded p-2">
                          <div className="text-lg mb-1">⚡</div>
                          <p>قوة إضافية</p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded p-2">
                          <div className="text-lg mb-1">💎</div>
                          <p>مظهر خاص</p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded p-2">
                          <div className="text-lg mb-1">👑</div>
                          <p>مكانة VIP</p>
                        </div>
                      </div>
                    </div>

                    {/* Voice Chat Info */}
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-center">
                      <h6 className="font-bold mb-1">🎤 المحادثة الصوتية</h6>
                      <p className="text-xs opacity-90">تحدث مع اللاعبين الآخرين أثناء الألعاب الجماعية واستمتع بتجربة أكثر تفاعلية</p>
                    </div>
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

                      <div className="bg-white rounded-lg p-3">
                        <h6 className="font-bold text-gray-800 mb-2">💎 إرسال تطويرات</h6>
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                                  onClick={() => alert("إرسال تطوير الطاقة بـ 800 نقطة!\nسيساعد صديقك في تطوير شخصيته")}>
                            🔋 طاقة +1 (800)
                          </Button>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                  onClick={() => alert("إرسال تطوير القوة بـ 1000 نقطة!\nسيزيد قوة شخصية صديقك")}>
                            💪 قوة +1 (1000)
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3">
                        <h6 className="font-bold text-gray-800 mb-2">🎁 إرسال نقاط</h6>
                        <div className="grid grid-cols-3 gap-2">
                          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                                  onClick={() => alert("إرسال 500 نقطة لصديقك!\nسيتم خصمها من رصيدك")}>
                            💰 500 نقطة
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  onClick={() => alert("إرسال 1000 نقطة لصديقك!\nهدية كريمة ومفيدة")}>
                            💎 1000 نقطة
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                  onClick={() => alert("إرسال 5000 نقطة لصديقك!\nهدية ملكية فاخرة 👑")}>
                            👑 5000 نقطة
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shopping Interface */}
          {showShopping && (
                  <div className="bg-white/80 rounded-xl p-4 mt-4">
                    <h5 className="text-lg font-bold text-purple-600 mb-4 text-center">🛒 متجر التطويرات</h5>
                    
                    {/* Character Development */}
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-4">
                      <h6 className="font-bold text-gray-800 mb-3">⚡ تطوير القدرات</h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">🔋</div>
                          <h6 className="font-bold text-sm mb-1">طاقة +1</h6>
                          <p className="text-xs text-gray-600 mb-2">زيادة معدل النمو والنشاط اليومي</p>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full"
                                  onClick={() => alert("🔋 تطوير الطاقة بـ 800 نقطة!\n• زيادة النمو 50%\n• نشاط أكثر\n• صحة أفضل")}>
                            800 نقطة
                          </Button>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">🧠</div>
                          <h6 className="font-bold text-sm mb-1">ذكاء +1</h6>
                          <p className="text-xs text-gray-600 mb-2">زيادة النقاط من الألعاب والمهام</p>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                                  onClick={() => alert("🧠 تطوير الذكاء بـ 1200 نقطة!\n• نقاط مضاعفة من الألعاب\n• حل المهام أسرع\n• استراتيجية أفضل")}>
                            1200 نقطة
                          </Button>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">💪</div>
                          <h6 className="font-bold text-sm mb-1">قوة +1</h6>
                          <p className="text-xs text-gray-600 mb-2">أداء أقوى في المعارك والتحديات</p>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white w-full"
                                  onClick={() => alert("💪 تطوير القوة بـ 1000 نقطة!\n• انتصارات أكثر\n• دفاع أقوى\n• هجمات مضاعفة")}>
                            1000 نقطة
                          </Button>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">⚡</div>
                          <h6 className="font-bold text-sm mb-1">سرعة +1</h6>
                          <p className="text-xs text-gray-600 mb-2">حركة أسرع وردود فعل أفضل</p>
                          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                                  onClick={() => alert("⚡ تطوير السرعة بـ 900 نقطة!\n• حركة أسرع 40%\n• ردود فعل فورية\n• مراوغة ماهرة")}>
                            900 نقطة
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Garden Upgrades */}
                    <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 mb-4">
                      <h6 className="font-bold text-gray-800 mb-3">🌸 تحسين الحديقة</h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">🏠</div>
                          <h6 className="font-bold text-sm mb-1">توسيع المساحة</h6>
                          <p className="text-xs text-gray-600 mb-2">مساحة أكبر لزراعة النباتات والديكور</p>
                          <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white w-full"
                                  onClick={() => alert("🏠 توسيع الحديقة بـ 2000 نقطة!\n• مساحة مضاعفة\n• نباتات أكثر\n• ديكورات إضافية")}>
                            2000 نقطة
                          </Button>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">✨</div>
                          <h6 className="font-bold text-sm mb-1">ديكورات خاصة</h6>
                          <p className="text-xs text-gray-600 mb-2">إضافات جمالية ونقاط بونص يومية</p>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                                  onClick={() => alert("✨ ديكورات خاصة بـ 1500 نقطة!\n• جمال استثنائي\n• +50 نقطة يومياً\n• إعجاب الزوار")}>
                            1500 نقطة
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Premium Features */}
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl p-4">
                      <h6 className="font-bold mb-3">👑 المزايا الحصرية</h6>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                          <div className="text-2xl mb-2">🚀</div>
                          <h6 className="font-bold text-sm mb-1">عضوية VIP شهرية</h6>
                          <p className="text-xs opacity-90 mb-2">نقاط مضاعفة + شخصيات حصرية + دعم مميز</p>
                          <Button className="bg-white bg-opacity-30 hover:bg-opacity-40 text-white border-0 w-full"
                                  onClick={() => alert("🚀 عضوية VIP بـ 5000 نقطة!\n• نقاط مضاعفة x2\n• 3 شخصيات حصرية\n• أولوية في الألعاب\n• دعم فوري")}>
                            5000 نقطة
                          </Button>
                        </div>
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