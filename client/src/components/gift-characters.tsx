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

  // Fallback characters if API doesn't return any - comprehensive collection
  const fallbackCharacters: GiftCharacter[] = [
    // Basic Romance & Love Gifts (10-100 points)
    { id: 7, name: 'قلب', emoji: '❤️', description: 'قلب أحمر جميل', pointCost: 10, animationType: 'bounce', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 8, name: 'وردة', emoji: '🌹', description: 'وردة حمراء رومانسية', pointCost: 25, animationType: 'float', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 4, isMultiLanguage: false, createdAt: new Date() },
    { id: 16, name: 'بالون', emoji: '🎈', description: 'بالون ملون للاحتفال', pointCost: 30, animationType: 'balloon_float', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 2, isMultiLanguage: false, createdAt: new Date() },
    { id: 14, name: 'نجمة', emoji: '⭐', description: 'نجمة ذهبية لامعة', pointCost: 50, animationType: 'twinkle', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 18, name: 'كعكة', emoji: '🎂', description: 'كعكة عيد ميلاد لذيذة', pointCost: 75, animationType: 'cake_celebration', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 4, isMultiLanguage: false, createdAt: new Date() },
    { id: 19, name: 'فراشة', emoji: '🦋', description: 'فراشة ملونة جميلة', pointCost: 80, animationType: 'butterfly_flutter', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 4, isMultiLanguage: false, createdAt: new Date() },
    
    // Character & Standard Gifts (100-500 points)
    { id: 1, name: 'BoBo Love', emoji: '🐰💕', description: 'Rabbit with flying hearts', pointCost: 100, animationType: 'hearts', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 9, name: 'تاج', emoji: '👑', description: 'تاج ذهبي فاخر', pointCost: 100, animationType: 'shine', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 5, isMultiLanguage: false, createdAt: new Date() },
    { id: 20, name: 'دب', emoji: '🧸', description: 'دب محشو لطيف', pointCost: 120, animationType: 'cuddle_bounce', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 15, name: 'قمر', emoji: '🌙', description: 'قمر فضي جميل', pointCost: 150, animationType: 'moon_glow', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 5, isMultiLanguage: false, createdAt: new Date() },
    { id: 24, name: 'هدية', emoji: '🎁', description: 'صندوق هدية ملفوف', pointCost: 180, animationType: 'gift_unwrap', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 5, isMultiLanguage: false, createdAt: new Date() },
    { id: 10, name: 'ألماسة', emoji: '💎', description: 'ألماسة براقة', pointCost: 200, animationType: 'sparkle', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 6, isMultiLanguage: false, createdAt: new Date() },
    { id: 25, name: 'نظارة', emoji: '🕶️', description: 'نظارة شمسية أنيقة', pointCost: 220, animationType: 'cool_slide', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 4, name: 'Dodo Splash', emoji: '🦆💦', description: 'Duck with bubbles', pointCost: 250, animationType: 'bubbles', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 23, name: 'مفتاح', emoji: '🗝️', description: 'مفتاح ذهبي سحري', pointCost: 250, animationType: 'key_unlock', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 4, isMultiLanguage: false, createdAt: new Date() },
    { id: 17, name: 'شمس', emoji: '☀️', description: 'شمس ذهبية مشرقة', pointCost: 300, animationType: 'sun_rays', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 6, isMultiLanguage: false, createdAt: new Date() },
    { id: 22, name: 'قوس قزح', emoji: '🌈', description: 'قوس قزح ملون', pointCost: 350, animationType: 'rainbow_arc', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 5, isMultiLanguage: false, createdAt: new Date() },
    { id: 21, name: 'نار', emoji: '🔥', description: 'نار حمراء مشتعلة', pointCost: 400, animationType: 'fire_blast', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 6, isMultiLanguage: false, createdAt: new Date() },
    { id: 26, name: 'هاتف', emoji: '📱', description: 'هاتف ذكي حديث', pointCost: 450, animationType: 'phone_ring', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    
    // Premium & Luxury Gifts (500-1000+ points)
    { id: 2, name: 'BoFire', emoji: '🐲🔥', description: 'Dragon with neon fire', pointCost: 500, animationType: 'fire', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 6, name: 'Love Heart', emoji: '💝', description: 'Premium love gift with voice and special effects', pointCost: 500, animationType: 'love_explosion', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 5, isMultiLanguage: true, createdAt: new Date() },
    { id: 11, name: 'سيارة', emoji: '🚗', description: 'سيارة فاخرة', pointCost: 500, animationType: 'drive', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 7, isMultiLanguage: false, createdAt: new Date() },
    { id: 27, name: 'ساعة', emoji: '⌚', description: 'ساعة ذكية فاخرة', pointCost: 550, animationType: 'time_tick', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 4, isMultiLanguage: false, createdAt: new Date() },
    { id: 28, name: 'برق', emoji: '⚡', description: 'برق أزرق قوي', pointCost: 600, animationType: 'lightning_strike', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 7, isMultiLanguage: false, createdAt: new Date() },
    { id: 29, name: 'كاميرا', emoji: '📷', description: 'كاميرا تصوير احترافية', pointCost: 650, animationType: 'camera_flash', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 6, isMultiLanguage: false, createdAt: new Date() },
    { id: 5, name: 'Meemo Wink', emoji: '🐱🌈', description: 'Cat with rainbow', pointCost: 750, animationType: 'rainbow_wave', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 30, name: 'جوهرة', emoji: '💍', description: 'خاتم بجوهرة كبيرة', pointCost: 800, animationType: 'ring_sparkle', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 8, isMultiLanguage: false, createdAt: new Date() },
    { id: 31, name: 'كأس', emoji: '🏆', description: 'كأس ذهبي للفائزين', pointCost: 900, animationType: 'trophy_shine', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 9, isMultiLanguage: false, createdAt: new Date() },
    
    // Elite & Royal Gifts (1000+ points)
    { id: 3, name: 'Nunu Magic', emoji: '🦄🌟', description: 'Flying horse with stars', pointCost: 1000, animationType: 'rainbow', isActive: true, hasSound: false, soundFileUrl: null, hasSpecialEffects: false, effectDuration: 3, isMultiLanguage: false, createdAt: new Date() },
    { id: 12, name: 'طائرة', emoji: '✈️', description: 'طائرة خاصة', pointCost: 1000, animationType: 'fly', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 8, isMultiLanguage: false, createdAt: new Date() },
    { id: 32, name: 'صاروخ', emoji: '🚀', description: 'صاروخ فضائي سريع', pointCost: 1500, animationType: 'rocket_launch', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 9, isMultiLanguage: false, createdAt: new Date() },
    { id: 13, name: 'قلعة', emoji: '🏰', description: 'قلعة سحرية', pointCost: 2000, animationType: 'magic', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 10, isMultiLanguage: false, createdAt: new Date() },
    { id: 33, name: 'يخت', emoji: '🛥️', description: 'يخت فاخر للأثرياء', pointCost: 3000, animationType: 'ocean_cruise', isActive: true, hasSound: true, soundFileUrl: null, hasSpecialEffects: true, effectDuration: 12, isMultiLanguage: false, createdAt: new Date() },
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
              className={`hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer group ${
                character.name === 'Love Heart' 
                  ? 'relative overflow-hidden border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-red-50 hover:shadow-pink-500/50' 
                  : ''
              }`}
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
                  
                  {/* Special badges for Love Heart gift */}
                  {character.name === 'Love Heart' && (
                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                      <Badge className="bg-pink-500 text-white text-xs px-2 py-1">
                        🔊 صوت
                      </Badge>
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                        ✨ تأثيرات
                      </Badge>
                      <Badge className="bg-purple-500 text-white text-xs px-2 py-1">
                        🌍 متعدد اللغات
                      </Badge>
                    </div>
                  )}

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
