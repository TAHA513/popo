import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Trophy, Sparkles, Lock, Gamepad2, ArrowLeft } from "lucide-react";
import CharacterCard from "./CharacterCard";
import { useLocation } from "wouter";

interface Character {
  id: string;
  name: string;
  type: string;
  rarity: string;
  baseStats: {
    strength: number;
    agility: number;
    intelligence: number;
    health: number;
  };
  appearance: {
    skin: string;
    hair: string;
    clothes: string;
    accessories: string[];
  };
  skills: string[];
  isPremium: boolean;
  price: number;
  description: string;
  imageUrl?: string;
}

interface UserCharacter {
  id: string;
  characterId: string;
  level: number;
  experience: number;
  currentStats: any;
  equipment: any;
  customization: any;
  character: Character;
}

export default function CharacterSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showUpgrades, setShowUpgrades] = useState(false);

  // Mock data for demonstration - في الواقع سيتم استدعاء البيانات من API
  const availableCharacters: Character[] = [
    {
      id: "1",
      name: "المحارب الشجاع",
      type: "warrior",
      rarity: "common",
      baseStats: { strength: 80, agility: 60, intelligence: 40, health: 100 },
      appearance: { skin: "medium", hair: "brown", clothes: "armor", accessories: ["sword", "shield"] },
      skills: ["ضربة السيف", "حاجز الدرع", "صرخة الحرب"],
      isPremium: false,
      price: 0,
      description: "محارب قوي يعتمد على القوة والدفاع"
    },
    {
      id: "2",
      name: "الساحر الحكيم",
      type: "mage",
      rarity: "rare",
      baseStats: { strength: 30, agility: 50, intelligence: 90, health: 70 },
      appearance: { skin: "light", hair: "white", clothes: "robes", accessories: ["staff", "hat"] },
      skills: ["كرة النار", "الشفاء", "النقل"],
      isPremium: false,
      price: 100,
      description: "ساحر ذكي يستخدم السحر والحكمة"
    },
    {
      id: "3",
      name: "الرامي الماهر",
      type: "archer",
      rarity: "epic",
      baseStats: { strength: 60, agility: 85, intelligence: 55, health: 80 },
      appearance: { skin: "dark", hair: "black", clothes: "leather", accessories: ["bow", "quiver"] },
      skills: ["رمية دقيقة", "أسهم متعددة", "عين النسر"],
      isPremium: true,
      price: 500,
      description: "رامي سريع ودقيق في إصابة الأهداف"
    },
    {
      id: "4",
      name: "الأميرة الذهبية",
      type: "healer",
      rarity: "legendary",
      baseStats: { strength: 40, agility: 70, intelligence: 95, health: 90 },
      appearance: { skin: "light", hair: "golden", clothes: "royal", accessories: ["crown", "magic_gem"] },
      skills: ["الشفاء الملكي", "البركة", "الحماية الإلهية"],
      isPremium: true,
      price: 1000,
      description: "أميرة قوية تملك قدرات الشفاء والحماية"
    }
  ];

  const ownedCharacters: UserCharacter[] = [];
  const loadingAvailable = false;
  const loadingOwned = false;

  const handlePurchaseCharacter = (characterId: string) => {
    const character = availableCharacters.find(c => c.id === characterId);
    if (character) {
      toast({
        title: "🎉 تم الحصول على الشخصية!",
        description: `حصلت على ${character.name} بنجاح! يمكنك الآن استخدامها في الألعاب`,
      });
    }
  };

  const handleSelectCharacter = (characterId: string) => {
    const character = availableCharacters.find(c => c.id === characterId);
    if (character) {
      toast({
        title: "✅ تم اختيار الشخصية!",
        description: `اخترت ${character.name} كشخصيتك الأساسية`,
      });
    }
  };

  if (loadingAvailable || loadingOwned) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الشخصيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => setLocation('/')}
            variant="ghost"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">🎮 اختر شخصيتك</h1>
            <p className="text-gray-600">اختر الشخصية التي تناسب أسلوب لعبك</p>
          </div>
          
          <div className="w-32"></div> {/* Spacer */}
        </div>

        {/* User Points Display */}
        <div className="bg-white rounded-xl p-4 mb-8 text-center shadow-lg">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <span className="text-2xl">💎</span>
            <span className="text-xl font-bold text-purple-600">
              {user?.points || 0} نقطة متاحة
            </span>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableCharacters.map((character) => {
            const isOwned = ownedCharacters.some(oc => oc.characterId === character.id);
            
            return (
              <CharacterCard
                key={character.id}
                character={character}
                isOwned={isOwned}
                onPurchase={handlePurchaseCharacter}
                onSelect={handleSelectCharacter}
                userPoints={user?.points || 0}
              />
            );
          })}
        </div>

        {/* Voice Chat Info */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🎤 المحادثة الصوتية في الألعاب</h2>
            <p className="text-lg opacity-90 mb-4">
              تحدث مع اللاعبين الآخرين أثناء الألعاب الجماعية باستخدام المحادثة الصوتية
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl mb-2">🎮</div>
                <h3 className="font-bold mb-1">ألعاب جماعية</h3>
                <p>شارك في الألعاب مع أصدقائك</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl mb-2">🗣️</div>
                <h3 className="font-bold mb-1">محادثة صوتية</h3>
                <p>تواصل مع الفريق بالصوت</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-bold mb-1">تطوير الشخصية</h3>
                <p>طور مهارات شخصيتك</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Info */}
        <div className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">👑 الميزات المميزة</h2>
            <p className="text-lg opacity-90 mb-4">
              احصل على شخصيات مميزة ومهارات إضافية لتعزيز تجربة اللعب
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl mb-2">⭐</div>
                <h3 className="font-bold mb-1">شخصيات نادرة</h3>
                <p>شخصيات بقدرات خاصة ومظهر مميز</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-bold mb-1">مهارات متقدمة</h3>
                <p>قدرات قتالية وسحرية قوية</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
        description: error.message || "فشل في شراء الشخصية",
        variant: "destructive",
      });
    },
  });

  // Select character mutation
  const selectCharacterMutation = useMutation({
    mutationFn: (userCharacterId: string) => 
      apiRequest('/api/characters/select', 'POST', { userCharacterId }),
    onSuccess: () => {
      toast({
        title: "✨ تم اختيار الشخصية!",
        description: "شخصيتك جاهزة للعب",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/characters/owned'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في اختيار الشخصية",
        variant: "destructive",
      });
    },
  });

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return <Crown className="w-4 h-4" />;
      case 'epic': return <Sparkles className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  const getCharacterTypeEmoji = (type: string) => {
    switch(type) {
      case 'warrior': return '⚔️';
      case 'mage': return '🔮';
      case 'archer': return '🏹';
      case 'assassin': return '🗡️';
      case 'healer': return '💚';
      case 'tank': return '🛡️';
      default: return '🎮';
    }
  };

  const handlePurchaseCharacter = (character: Character) => {
    if (user && user.points >= character.price) {
      purchaseCharacterMutation.mutate(character.id);
    } else {
      toast({
        title: "نقاط غير كافية",
        description: `تحتاج إلى ${character.price} نقطة لشراء هذه الشخصية`,
        variant: "destructive",
      });
    }
  };

  const handleSelectCharacter = (userCharacter: UserCharacter) => {
    selectCharacterMutation.mutate(userCharacter.id);
  };

  if (loadingAvailable || loadingOwned) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الشخصيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-600 mb-2">🎮 اختر شخصيتك</h2>
        <p className="text-gray-600">اختر الشخصية التي ستلعب بها في الألعاب الجماعية</p>
      </div>

      {/* Owned Characters */}
      {ownedCharacters.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">🏆 شخصياتك</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ownedCharacters.map((userChar) => {
              const character = userChar.character;
              return (
                <div 
                  key={userChar.id} 
                  className="bg-white rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer"
                  onClick={() => handleSelectCharacter(userChar)}
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl">
                      {getCharacterTypeEmoji(character.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <h4 className="font-bold text-gray-800">{character.name}</h4>
                        <div className={`flex items-center space-x-1 space-x-reverse text-white text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(character.rarity)}`}>
                          {getRarityIcon(character.rarity)}
                          <span>{character.rarity}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{character.type} - مستوى {userChar.level}</p>
                      
                      <div className="flex items-center space-x-4 space-x-reverse text-xs">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <span>💪</span>
                          <span>{userChar.currentStats?.strength || character.baseStats.strength}</span>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <span>⚡</span>
                          <span>{userChar.currentStats?.agility || character.baseStats.agility}</span>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <span>🧠</span>
                          <span>{userChar.currentStats?.intelligence || character.baseStats.intelligence}</span>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <span>❤️</span>
                          <span>{userChar.currentStats?.health || character.baseStats.health}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${(userChar.experience % 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">XP: {userChar.experience}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
                    disabled={selectCharacterMutation.isPending}
                  >
                    {selectCharacterMutation.isPending ? "جاري الاختيار..." : "اختيار هذه الشخصية"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Characters to Purchase */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">🛒 شخصيات متاحة للشراء</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableCharacters
            .filter(char => !ownedCharacters.some(owned => owned.characterId === char.id))
            .map((character) => (
            <div 
              key={character.id} 
              className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-purple-400 transition-all"
            >
              <div className="flex items-center space-x-4 space-x-reverse mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-2xl">
                  {getCharacterTypeEmoji(character.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <h4 className="font-bold text-gray-800">{character.name}</h4>
                    <div className={`flex items-center space-x-1 space-x-reverse text-white text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(character.rarity)}`}>
                      {getRarityIcon(character.rarity)}
                      <span>{character.rarity}</span>
                    </div>
                    {character.isPremium && (
                      <div className="flex items-center space-x-1 space-x-reverse text-yellow-600 text-xs">
                        <Lock className="w-3 h-3" />
                        <span>مدفوع</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{character.type}</p>
                  <p className="text-xs text-gray-500">{character.description}</p>
                  
                  <div className="flex items-center space-x-4 space-x-reverse text-xs mt-2">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <span>💪</span>
                      <span>{character.baseStats.strength}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <span>⚡</span>
                      <span>{character.baseStats.agility}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <span>🧠</span>
                      <span>{character.baseStats.intelligence}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <span>❤️</span>
                      <span>{character.baseStats.health}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg font-bold text-purple-600">{character.price}</span>
                  <span className="text-sm text-gray-600">💎</span>
                </div>
                
                <Button 
                  onClick={() => handlePurchaseCharacter(character)}
                  disabled={purchaseCharacterMutation.isPending || (user && user.points < character.price)}
                  className="bg-gradient-to-r from-green-500 to-blue-500"
                >
                  {purchaseCharacterMutation.isPending ? "جاري الشراء..." : "شراء"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {availableCharacters.length === 0 && ownedCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد شخصيات متاحة حالياً</h3>
          <p className="text-gray-500">سيتم إضافة شخصيات جديدة قريباً!</p>
        </div>
      )}
    </div>
  );
}