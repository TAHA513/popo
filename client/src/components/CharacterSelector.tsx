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

  // Mock data for demonstration
  const availableCharacters: Character[] = [
    {
      id: "1",
      name: "المحارب الشجاع",
      type: "warrior",
      rarity: "common",
      price: 0,
      description: "محارب قوي يعتمد على القوة والدفاع"
    },
    {
      id: "2",
      name: "الساحر الحكيم",
      type: "mage",
      rarity: "rare",
      price: 300,
      description: "ساحر قوي يستخدم السحر"
    },
    {
      id: "3",
      name: "أسطورة التنانين",
      type: "dragon",
      rarity: "legendary",
      price: 8000,
      description: "شخصية أسطورية نادرة"
    }
  ];

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
      case 'dragon': return '🐲';
      case 'archer': return '🏹';
      case 'assassin': return '🗡️';
      case 'healer': return '💚';
      case 'tank': return '🛡️';
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
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">📦 الشخصيات المتاحة</h3>
        <div className="grid grid-cols-1 gap-4">
          {availableCharacters.map((character) => (
            <div 
              key={character.id} 
              className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedCharacter?.id === character.id 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleSelectCharacter(character)}
            >
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl">
                  {getCharacterTypeEmoji(character.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{character.name}</h3>
                  <p className="text-sm text-gray-600">{character.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getRarityIcon(character.rarity)}
                      <span className="text-xs text-gray-600 capitalize">{character.rarity}</span>
                    </div>
                    <div className="text-sm font-bold text-purple-600">
                      {character.price === 0 ? 'مجاني' : `${character.price} نقطة`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}