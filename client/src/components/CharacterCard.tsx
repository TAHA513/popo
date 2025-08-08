import { Button } from "@/components/ui/button";
import { Crown, Star, Trophy, Sparkles, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

interface CharacterCardProps {
  character: Character;
  isOwned?: boolean;
  onPurchase?: (characterId: string) => void;
  onSelect?: (characterId: string) => void;
  isPurchasing?: boolean;
  userPoints?: number;
}

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return <Crown className="w-5 h-5 text-yellow-500" />;
    case 'epic': return <Trophy className="w-5 h-5 text-purple-500" />;
    case 'rare': return <Star className="w-5 h-5 text-blue-500" />;
    default: return <Sparkles className="w-5 h-5 text-gray-500" />;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 to-orange-500';
    case 'epic': return 'from-purple-500 to-pink-500';
    case 'rare': return 'from-blue-500 to-indigo-500';
    default: return 'from-gray-400 to-gray-600';
  }
};

const getTypeEmoji = (type: string) => {
  switch (type) {
    case 'warrior': return '⚔️';
    case 'mage': return '🧙‍♂️';
    case 'archer': return '🏹';
    case 'healer': return '✨';
    default: return '🎮';
  }
};

export default function CharacterCard({ 
  character, 
  isOwned = false, 
  onPurchase, 
  onSelect, 
  isPurchasing = false,
  userPoints = 0
}: CharacterCardProps) {
  const { t, isRTL } = useLanguage();
  const canAfford = userPoints >= character.price;
  const rarityColor = getRarityColor(character.rarity);
  const rarityIcon = getRarityIcon(character.rarity);
  const typeEmoji = getTypeEmoji(character.type);

  return (
    <div className={`relative rounded-xl p-6 border-2 transition-all duration-300 hover:scale-105 bg-gradient-to-br ${rarityColor} text-white shadow-lg`}>
      {/* Premium Badge */}
      {character.isPremium && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Crown className="w-3 h-3" />
          <span>{isRTL ? 'مميز' : 'Premium'}</span>
        </div>
      )}

      {/* Character Avatar */}
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">{typeEmoji}</div>
        <div className="flex items-center justify-center space-x-2 space-x-reverse">
          {rarityIcon}
          <h3 className="text-xl font-bold">{character.name}</h3>
        </div>
        <p className="text-sm opacity-90 capitalize">{character.type}</p>
      </div>

      {/* Character Stats */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black bg-opacity-20 rounded p-2">
            <span className="font-bold">قوة:</span> {character.baseStats.strength}
          </div>
          <div className="bg-black bg-opacity-20 rounded p-2">
            <span className="font-bold">سرعة:</span> {character.baseStats.agility}
          </div>
          <div className="bg-black bg-opacity-20 rounded p-2">
            <span className="font-bold">ذكاء:</span> {character.baseStats.intelligence}
          </div>
          <div className="bg-black bg-opacity-20 rounded p-2">
            <span className="font-bold">صحة:</span> {character.baseStats.health}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm opacity-90 mb-4 text-center">{character.description}</p>

      {/* Skills */}
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2">المهارات:</h4>
        <div className="flex flex-wrap gap-1">
          {character.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="bg-black bg-opacity-20 px-2 py-1 rounded text-xs">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {isOwned ? (
          <Button 
            onClick={() => onSelect?.(character.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            ✅ اختيار الشخصية
          </Button>
        ) : (
          <>
            {character.price === 0 ? (
              <Button 
                onClick={() => onPurchase?.(character.id)}
                disabled={isPurchasing}
                className="w-full bg-white text-purple-600 hover:bg-gray-100"
              >
                {isPurchasing ? "جاري الحصول..." : "🆓 احصل عليها مجاناً"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-lg font-bold">💎 {character.price} نقطة</span>
                </div>
                <Button 
                  onClick={() => onPurchase?.(character.id)}
                  disabled={isPurchasing || !canAfford}
                  className={`w-full ${
                    canAfford 
                      ? "bg-white text-purple-600 hover:bg-gray-100" 
                      : "bg-gray-600 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {isPurchasing ? (
                    "جاري الشراء..."
                  ) : canAfford ? (
                    `💳 شراء بـ ${character.price} نقطة`
                  ) : (
                    <span className="flex items-center justify-center space-x-2 space-x-reverse">
                      <Lock className="w-4 h-4" />
                      <span>نقاط غير كافية</span>
                    </span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}