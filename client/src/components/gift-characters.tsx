import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiftCharacter } from "@/types";

interface GiftCharactersProps {
  onSelectGift?: (character: GiftCharacter) => void;
  showPurchaseButton?: boolean;
}

export default function GiftCharacters({ 
  onSelectGift, 
  showPurchaseButton = false 
}: GiftCharactersProps) {
  const { data: characters = [], isLoading } = useQuery<GiftCharacter[]>({
    queryKey: ['/api/gifts/characters'],
  });

  const handleSelectGift = (character: GiftCharacter) => {
    if (onSelectGift) {
      onSelectGift(character);
    } else {
      // Default behavior - could show a modal or navigate
      console.log('Selected gift character:', character);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-pink-50 to-purple-50" id="gifts">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading gift characters...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback characters if API doesn't return any
  const fallbackCharacters: GiftCharacter[] = [
    { id: 1, name: 'BoBo Love', emoji: '🐰💕', description: 'Rabbit with flying hearts', pointCost: 100, animationType: 'hearts', isActive: true },
    { id: 2, name: 'BoFire', emoji: '🐲🔥', description: 'Dragon with neon fire', pointCost: 500, animationType: 'fire', isActive: true },
    { id: 3, name: 'Nunu Magic', emoji: '🦄🌟', description: 'Flying horse with stars', pointCost: 1000, animationType: 'rainbow', isActive: true },
    { id: 4, name: 'Dodo Splash', emoji: '🦆💦', description: 'Duck with bubbles', pointCost: 250, animationType: 'bubbles', isActive: true },
    { id: 5, name: 'Meemo Wink', emoji: '🐱🌈', description: 'Cat with rainbow', pointCost: 750, animationType: 'rainbow_wave', isActive: true },
  ];

  const displayCharacters = characters.length > 0 ? characters : fallbackCharacters;

  return (
    <section className="py-12 bg-gradient-to-r from-pink-50 to-purple-50" id="gifts">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bold text-4xl gradient-text mb-4">Meet Our Gift Characters</h2>
          <p className="text-laa-gray text-lg max-w-2xl mx-auto">
            Send magical gifts to your favorite streamers with our adorable characters!
          </p>
          <p className="text-laa-gray text-lg max-w-2xl mx-auto mt-2" dir="rtl">
            إرسل هدايا سحرية لمذيعيك المفضلين مع شخصياتنا الرائعة!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {displayCharacters.map((character) => (
            <Card 
              key={character.id}
              className="hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer group"
              onClick={() => handleSelectGift(character)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-laa-pink to-red-400 rounded-full flex items-center justify-center text-3xl group-hover:animate-bounce">
                    {character.emoji}
                  </div>
                  
                  <h3 className="font-bold text-lg text-laa-dark mb-2">
                    {character.name}
                  </h3>
                  
                  <p className="text-sm text-laa-gray mb-4">
                    {character.description}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-laa-pink">💎</span>
                    <span className="font-semibold text-laa-dark">
                      {character.pointCost} Points
                    </span>
                  </div>

                  {showPurchaseButton && (
                    <Button 
                      size="sm" 
                      className="w-full bg-laa-pink hover:bg-pink-600"
                    >
                      Send Gift
                    </Button>
                  )}
                  
                  <Badge 
                    variant="secondary" 
                    className="bg-laa-pink/10 text-laa-pink mt-2"
                  >
                    {character.animationType}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!showPurchaseButton && (
          <div className="text-center mt-12">
            <Button className="bg-laa-pink hover:bg-pink-600 text-lg px-8 py-4">
              View All Characters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
