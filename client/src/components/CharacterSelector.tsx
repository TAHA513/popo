import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Trophy, Sparkles, Lock, Gamepad2 } from "lucide-react";

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
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showUpgrades, setShowUpgrades] = useState(false);

  // Get available characters
  const { data: availableCharacters = [], isLoading: loadingAvailable } = useQuery<Character[]>({
    queryKey: ['/api/characters/available'],
    enabled: !!user,
  });

  // Get user's owned characters
  const { data: ownedCharacters = [], isLoading: loadingOwned } = useQuery<UserCharacter[]>({
    queryKey: ['/api/characters/owned'],
    enabled: !!user,
  });

  // Purchase character mutation
  const purchaseCharacterMutation = useMutation({
    mutationFn: (characterId: string) => 
      apiRequest('/api/characters/purchase', 'POST', { characterId }),
    onSuccess: () => {
      toast({
        title: "🎉 تم شراء الشخصية!",
        description: "يمكنك الآن استخدام شخصيتك الجديدة في الألعاب",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/characters/owned'] });
      setSelectedCharacter(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الشراء",
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