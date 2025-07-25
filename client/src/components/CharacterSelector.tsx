import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Trophy, Sparkles } from "lucide-react";

interface Character {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  description: string;
}

export default function CharacterSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Rich character collection with varied pricing
  const availableCharacters: Character[] = [
    // Free Characters
    {
      id: "1",
      name: "المحارب المبتدئ",
      type: "warrior",
      rarity: "common",
      price: 0,
      description: "محارب مبتدئ قوي ومتوازن"
    },
    {
      id: "2", 
      name: "الرامي البسيط",
      type: "archer",
      rarity: "common",
      price: 0,
      description: "رامي ماهر بالقوس والسهام"
    },
    
    // Cheap Characters (50-200 points)
    {
      id: "3",
      name: "الفارس الشجاع",
      type: "knight",
      rarity: "common", 
      price: 50,
      description: "فارس نبيل يحمي الضعفاء"
    },
    {
      id: "4",
      name: "الساحر المتدرب",
      type: "mage",
      rarity: "common",
      price: 80,
      description: "ساحر يتعلم الفنون السحرية"
    },
    {
      id: "5",
      name: "اللص الماكر",
      type: "thief",
      rarity: "common",
      price: 120,
      description: "لص سريع وذكي في المهمات"
    },
    {
      id: "6",
      name: "الحارس الأمين",
      type: "guard",
      rarity: "common",
      price: 150,
      description: "حارس مخلص يحمي الحدود"
    },
    {
      id: "7",
      name: "الصياد البري",
      type: "hunter",
      rarity: "common", 
      price: 200,
      description: "صياد ماهر في البراري"
    },
    
    // Medium Characters (300-800 points)
    {
      id: "8",
      name: "الساحر الأزرق",
      type: "mage",
      rarity: "rare",
      price: 300,
      description: "ساحر قوي يتحكم بالعناصر"
    },
    {
      id: "9",
      name: "المحارب الذهبي",
      type: "warrior",
      rarity: "rare",
      price: 400,
      description: "محارب بدرع ذهبي لامع"
    },
    {
      id: "10",
      name: "النينجا الظلي",
      type: "ninja",
      rarity: "rare",
      price: 500,
      description: "نينجا يتحرك في الظلام"
    },
    {
      id: "11",
      name: "الكاهنة المقدسة",
      type: "priest",
      rarity: "rare",
      price: 600,
      description: "كاهنة تشفي وتحمي الفريق"
    },
    {
      id: "12",
      name: "ملك القراصنة",
      type: "pirate",
      rarity: "epic",
      price: 700,
      description: "قبطان سفينة قرصنة عظيم"
    },
    {
      id: "13",
      name: "فارس التنين",
      type: "dragonknight",
      rarity: "epic",
      price: 800,
      description: "فارس يركب التنانين العظيمة"
    },
    
    // Expensive Characters (1000-5000 points)
    {
      id: "14",
      name: "إمبراطور الجليد",
      type: "ice_emperor",
      rarity: "epic",
      price: 1000,
      description: "إمبراطور يتحكم بقوى الجليد"
    },
    {
      id: "15",
      name: "ملكة النار",
      type: "fire_queen",
      rarity: "epic",
      price: 1200,
      description: "ملكة تسيطر على ألسنة اللهب"
    },
    {
      id: "16",
      name: "حارس الأرواح",
      type: "spirit_guardian",
      rarity: "epic",
      price: 1500,
      description: "حارس الأرواح المقدسة"
    },
    {
      id: "17",
      name: "سيد الزمن",
      type: "time_master",
      rarity: "legendary",
      price: 2000,
      description: "سيد يتحكم في الزمن نفسه"
    },
    {
      id: "18",
      name: "إله البرق",
      type: "thunder_god",
      rarity: "legendary",
      price: 2500,
      description: "إله قوي يرمي صواعق البرق"
    },
    {
      id: "19",
      name: "ملك الشياطين",
      type: "demon_lord",
      rarity: "legendary",
      price: 3000,
      description: "ملك عالم الشياطين المظلم"
    },
    {
      id: "20",
      name: "إمبراطور الكون",
      type: "cosmic_emperor",
      rarity: "legendary",
      price: 4000,
      description: "حاكم المجرات والنجوم"
    },
    {
      id: "21",
      name: "خالق العوالم",
      type: "world_creator",
      rarity: "legendary",
      price: 5000,
      description: "الخالق العظيم للعوالم المختلفة"
    },
    
    // Ultra Expensive Characters (8000-20000 points)
    {
      id: "22",
      name: "أسطورة التنانين",
      type: "dragon_legend",
      rarity: "mythic",
      price: 8000,
      description: "أسطورة حية من عصر التنانين"
    },
    {
      id: "23",
      name: "إله الحرب الأعظم",
      type: "supreme_war_god",
      rarity: "mythic", 
      price: 10000,
      description: "إله الحرب الذي لا يُقهر"
    },
    {
      id: "24",
      name: "حاكم الأبعاد",
      type: "dimension_ruler",
      rarity: "mythic",
      price: 12000,
      description: "حاكم جميع الأبعاد المتوازية"
    },
    {
      id: "25",
      name: "إمبراطور الآلهة",
      type: "god_emperor",
      rarity: "mythic",
      price: 15000,
      description: "إمبراطور يحكم الآلهة أنفسهم"
    },
    {
      id: "26",
      name: "الكائن الأسمى",
      type: "supreme_being",
      rarity: "divine",
      price: 20000,
      description: "الكائن الأسمى في كل الوجود"
    }
  ];

  const getRarityIcon = (rarity: string) => {
    switch(rarity) {
      case 'divine': return <div className="text-rainbow animate-pulse">💫</div>;
      case 'mythic': return <div className="text-purple-600 animate-pulse">👑</div>;
      case 'legendary': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'epic': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'rare': return <Star className="w-4 h-4 text-blue-500" />;
      default: return <Trophy className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'divine': return 'from-rainbow-500 to-rainbow-700 border-rainbow-400';
      case 'mythic': return 'from-purple-600 to-pink-600 border-purple-400';
      case 'legendary': return 'from-yellow-500 to-orange-500 border-yellow-400';
      case 'epic': return 'from-purple-500 to-blue-500 border-purple-400';
      case 'rare': return 'from-blue-400 to-cyan-400 border-blue-400';
      default: return 'from-gray-400 to-gray-500 border-gray-400';
    }
  };

  const getCharacterTypeEmoji = (type: string) => {
    switch(type) {
      case 'warrior': return '⚔️';
      case 'mage': return '🔮';
      case 'archer': return '🏹';
      case 'knight': return '🏰';
      case 'thief': return '🥷';
      case 'guard': return '🛡️';
      case 'hunter': return '🏹';
      case 'ninja': return '🥷';
      case 'priest': return '✨';
      case 'pirate': return '🏴‍☠️';
      case 'dragonknight': return '🐉';
      case 'ice_emperor': return '❄️';
      case 'fire_queen': return '🔥';
      case 'spirit_guardian': return '👻';
      case 'time_master': return '⏰';
      case 'thunder_god': return '⚡';
      case 'demon_lord': return '😈';
      case 'cosmic_emperor': return '🌌';
      case 'world_creator': return '🌍';
      case 'dragon_legend': return '🐲';
      case 'supreme_war_god': return '⚔️';
      case 'dimension_ruler': return '🌀';
      case 'god_emperor': return '👑';
      case 'supreme_being': return '💫';
      default: return '🎮';
    }
  };

  const handleSelectCharacter = (character: Character) => {
    if (character.price > 0 && (!user || (user.points || 0) < character.price)) {
      toast({
        title: "نقاط غير كافية",
        description: `تحتاج إلى ${character.price} نقطة لشراء هذه الشخصية`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedCharacter(character);
    toast({
      title: "تم اختيار الشخصية",
      description: `تم اختيار ${character.name} بنجاح`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-600 mb-2">🎮 اختر شخصيتك</h2>
        <p className="text-gray-600">اختر الشخصية التي ستلعب بها في الألعاب الجماعية</p>
      </div>

      {/* Selected Character Display */}
      {selectedCharacter && (
        <div className="bg-purple-100 border-2 border-purple-300 rounded-xl p-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl">
              {getCharacterTypeEmoji(selectedCharacter.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-purple-800">{selectedCharacter.name}</h3>
              <p className="text-sm text-purple-600">{selectedCharacter.description}</p>
              <div className="flex items-center space-x-2 space-x-reverse mt-2">
                {getRarityIcon(selectedCharacter.rarity)}
                <span className="text-xs text-purple-700 capitalize">{selectedCharacter.rarity}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Characters */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">📦 مجموعة الشخصيات المتاحة</h3>
        
        {/* Filter by Price Category */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
          <h4 className="text-md font-bold text-gray-700 mb-3">🆓 الشخصيات المجانية</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCharacters.filter(char => char.price === 0).map((character) => (
              <div 
                key={character.id} 
                className={`bg-white rounded-lg p-3 border-2 transition-all cursor-pointer hover:shadow-lg ${
                  selectedCharacter?.id === character.id 
                    ? `border-green-400 bg-green-50 shadow-lg` 
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => handleSelectCharacter(character)}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getRarityColor(character.rarity)} rounded-lg flex items-center justify-center text-xl`}>
                    {getCharacterTypeEmoji(character.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">{character.name}</h4>
                    <p className="text-xs text-gray-600">{character.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        {getRarityIcon(character.rarity)}
                        <span className="text-xs text-gray-500 capitalize">{character.rarity}</span>
                      </div>
                      <span className="text-xs font-bold text-green-600">مجاني</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <h4 className="text-md font-bold text-gray-700 mb-3">💰 الشخصيات المتوسطة (50-800 نقطة)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCharacters.filter(char => char.price > 0 && char.price <= 800).map((character) => (
              <div 
                key={character.id} 
                className={`bg-white rounded-lg p-3 border-2 transition-all cursor-pointer hover:shadow-lg ${
                  selectedCharacter?.id === character.id 
                    ? `border-blue-400 bg-blue-50 shadow-lg` 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleSelectCharacter(character)}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getRarityColor(character.rarity)} rounded-lg flex items-center justify-center text-xl`}>
                    {getCharacterTypeEmoji(character.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">{character.name}</h4>
                    <p className="text-xs text-gray-600">{character.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        {getRarityIcon(character.rarity)}
                        <span className="text-xs text-gray-500 capitalize">{character.rarity}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{character.price} نقطة</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <h4 className="text-md font-bold text-gray-700 mb-3">💎 الشخصيات المتقدمة (1000-5000 نقطة)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCharacters.filter(char => char.price >= 1000 && char.price <= 5000).map((character) => (
              <div 
                key={character.id} 
                className={`bg-white rounded-lg p-3 border-2 transition-all cursor-pointer hover:shadow-lg ${
                  selectedCharacter?.id === character.id 
                    ? `border-purple-400 bg-purple-50 shadow-lg` 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleSelectCharacter(character)}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getRarityColor(character.rarity)} rounded-lg flex items-center justify-center text-xl relative`}>
                    {getCharacterTypeEmoji(character.type)}
                    {character.rarity === 'legendary' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">{character.name}</h4>
                    <p className="text-xs text-gray-600">{character.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        {getRarityIcon(character.rarity)}
                        <span className="text-xs text-gray-500 capitalize">{character.rarity}</span>
                      </div>
                      <span className="text-xs font-bold text-purple-600">{character.price} نقطة</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-300">
          <h4 className="text-md font-bold text-gray-700 mb-3">👑 الشخصيات الأسطورية (8000+ نقطة)</h4>
          <div className="grid grid-cols-1 gap-4">
            {availableCharacters.filter(char => char.price >= 8000).map((character) => (
              <div 
                key={character.id} 
                className={`bg-white rounded-lg p-4 border-2 transition-all cursor-pointer hover:shadow-xl relative overflow-hidden ${
                  selectedCharacter?.id === character.id 
                    ? `border-yellow-400 bg-yellow-50 shadow-xl` 
                    : 'border-gray-200 hover:border-yellow-400'
                }`}
                onClick={() => handleSelectCharacter(character)}
              >
                {character.rarity === 'divine' && (
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
                )}
                {character.rarity === 'mythic' && (
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                )}
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getRarityColor(character.rarity)} rounded-xl flex items-center justify-center text-2xl relative`}>
                    {getCharacterTypeEmoji(character.type)}
                    {character.rarity === 'mythic' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>}
                    {character.rarity === 'divine' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-rainbow-500 rounded-full animate-spin"></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800">{character.name}</h4>
                    <p className="text-sm text-gray-600">{character.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getRarityIcon(character.rarity)}
                        <span className="text-sm text-gray-600 capitalize font-semibold">{character.rarity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-yellow-600">{character.price.toLocaleString()} نقطة</span>
                        {character.price >= 15000 && (
                          <p className="text-xs text-yellow-600">حصري جداً 🌟</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}