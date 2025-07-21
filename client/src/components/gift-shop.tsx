import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Gift, 
  Star, 
  Crown, 
  Diamond, 
  Sparkles,
  Flower,
  Coffee,
  Cake,
  Music,
  Car,
  Plane,
  Home,
  Coins,
  Zap
} from "lucide-react";

interface GiftItem {
  id: string;
  name: string;
  arabicName: string;
  price: number;
  icon: any;
  color: string;
  gradient: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'emotions' | 'luxury' | 'experiences' | 'virtual';
  animation: string;
  description: string;
  arabicDescription: string;
}

const giftCategories = [
  { id: 'emotions', name: 'Emotions', arabicName: 'مشاعر', icon: Heart },
  { id: 'luxury', name: 'Luxury', arabicName: 'رفاهية', icon: Crown },
  { id: 'experiences', name: 'Experiences', arabicName: 'تجارب', icon: Star },
  { id: 'virtual', name: 'Virtual', arabicName: 'افتراضي', icon: Sparkles },
];

const giftItems: GiftItem[] = [
  // Emotions Category
  {
    id: 'heart',
    name: 'Heart',
    arabicName: '❤️ قلب',
    price: 10,
    icon: Heart,
    color: 'text-red-500',
    gradient: 'from-red-400 to-pink-500',
    rarity: 'common',
    category: 'emotions',
    animation: 'pulse',
    description: 'Send love and affection',
    arabicDescription: 'أرسل الحب والمودة'
  },
  {
    id: 'rose',
    name: 'Rose',
    arabicName: '🌹 وردة',
    price: 25,
    icon: Flower,
    color: 'text-pink-500',
    gradient: 'from-pink-400 to-rose-500',
    rarity: 'common',
    category: 'emotions',
    animation: 'bounce',
    description: 'A beautiful rose for someone special',
    arabicDescription: 'وردة جميلة لشخص مميز'
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    arabicName: '✨ بريق',
    price: 15,
    icon: Sparkles,
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-orange-500',
    rarity: 'common',
    category: 'emotions',
    animation: 'spin',
    description: 'Add some sparkle to the moment',
    arabicDescription: 'أضف بريقاً للحظة'
  },

  // Luxury Category
  {
    id: 'crown',
    name: 'Crown',
    arabicName: '👑 تاج',
    price: 100,
    icon: Crown,
    color: 'text-yellow-600',
    gradient: 'from-yellow-400 to-yellow-600',
    rarity: 'rare',
    category: 'luxury',
    animation: 'bounce',
    description: 'Crown them as royalty',
    arabicDescription: 'توجهم كملوك'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    arabicName: '💎 ماسة',
    price: 500,
    icon: Diamond,
    color: 'text-blue-400',
    gradient: 'from-blue-400 to-cyan-500',
    rarity: 'epic',
    category: 'luxury',
    animation: 'pulse',
    description: 'A precious diamond gift',
    arabicDescription: 'هدية ماسة ثمينة'
  },

  // Experiences Category
  {
    id: 'coffee',
    name: 'Coffee',
    arabicName: '☕ قهوة',
    price: 20,
    icon: Coffee,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600',
    rarity: 'common',
    category: 'experiences',
    animation: 'bounce',
    description: 'Buy them a virtual coffee',
    arabicDescription: 'اشتر لهم قهوة افتراضية'
  },
  {
    id: 'cake',
    name: 'Cake',
    arabicName: '🎂 كعكة',
    price: 50,
    icon: Cake,
    color: 'text-pink-600',
    gradient: 'from-pink-400 to-purple-500',
    rarity: 'rare',
    category: 'experiences',
    animation: 'bounce',
    description: 'Celebrate with a cake',
    arabicDescription: 'احتفل بكعكة'
  },
  {
    id: 'car',
    name: 'Sports Car',
    arabicName: '🏎️ سيارة رياضية',
    price: 1000,
    icon: Car,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-700',
    rarity: 'legendary',
    category: 'experiences',
    animation: 'pulse',
    description: 'A luxury sports car',
    arabicDescription: 'سيارة رياضية فاخرة'
  },
  {
    id: 'plane',
    name: 'Private Jet',
    arabicName: '✈️ طائرة خاصة',
    price: 5000,
    icon: Plane,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-indigo-600',
    rarity: 'legendary',
    category: 'experiences',
    animation: 'pulse',
    description: 'Ultimate luxury travel',
    arabicDescription: 'سفر بأقصى درجات الرفاهية'
  },

  // Virtual Category
  {
    id: 'zap',
    name: 'Energy Boost',
    arabicName: '⚡ دفعة طاقة',
    price: 30,
    icon: Zap,
    color: 'text-electric-blue',
    gradient: 'from-cyan-400 to-blue-500',
    rarity: 'common',
    category: 'virtual',
    animation: 'pulse',
    description: 'Boost their energy level',
    arabicDescription: 'ارفع مستوى طاقتهم'
  },
  {
    id: 'coins',
    name: 'Gold Coins',
    arabicName: '🪙 عملات ذهبية',
    price: 75,
    icon: Coins,
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    rarity: 'rare',
    category: 'virtual',
    animation: 'spin',
    description: 'Shower them with gold',
    arabicDescription: 'أمطرهم بالذهب'
  }
];

interface GiftShopProps {
  onSendGift: (gift: GiftItem) => void;
  userPoints: number;
}

export default function GiftShop({ onSendGift, userPoints }: GiftShopProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('emotions');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const filteredGifts = giftItems.filter(gift => gift.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const handleSendGift = (gift: GiftItem) => {
    if (userPoints < gift.price) {
      toast({
        title: "نقاط غير كافية",
        description: `تحتاج إلى ${gift.price} نقطة لإرسال هذه الهدية`,
        variant: "destructive",
      });
      return;
    }

    setSelectedGift(gift);
    setShowConfirm(true);
  };

  const confirmSend = () => {
    if (selectedGift) {
      onSendGift(selectedGift);
      setShowConfirm(false);
      setSelectedGift(null);
      
      toast({
        title: "تم إرسال الهدية! 🎁",
        description: `أرسلت ${selectedGift.arabicName} بنجاح`,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎁 متجر الهدايا
        </h2>
        <p className="text-gray-600 mt-2">
          أرسل هدايا مميزة لأصدقائك ومبدعيك المفضلين
        </p>
        <div className="mt-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Coins className="w-4 h-4 mr-2" />
            {userPoints} نقطة متاحة
          </Badge>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {giftCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <IconComponent className="w-4 h-4" />
              <span>{category.arabicName}</span>
            </Button>
          );
        })}
      </div>

      {/* Gift Grid */}
      <div className="gift-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredGifts.map((gift, index) => {
            const IconComponent = gift.icon;
            const canAfford = userPoints >= gift.price;
            
            return (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`gift-card cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    getRarityColor(gift.rarity)
                  } ${!canAfford ? 'opacity-50' : ''}`}
                  onClick={() => canAfford && handleSendGift(gift)}
                >
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className={`gift-icon w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3 rounded-full bg-gradient-to-br ${gift.gradient} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    
                    <h3 className="font-semibold text-xs md:text-sm mb-1 leading-tight">{gift.arabicName}</h3>
                    
                    <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse mb-2">
                      <Coins className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                      <span className="font-bold text-sm md:text-lg">{gift.price}</span>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        gift.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                        gift.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                        gift.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {gift.rarity === 'legendary' ? 'أسطوري' :
                       gift.rarity === 'epic' ? 'ملحمي' :
                       gift.rarity === 'rare' ? 'نادر' : 'عادي'}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد إرسال الهدية</DialogTitle>
          </DialogHeader>
          
          {selectedGift && (
            <div className="text-center space-y-4">
              <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${selectedGift.gradient} flex items-center justify-center shadow-lg`}>
                <selectedGift.icon className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">{selectedGift.arabicName}</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedGift.arabicDescription}</p>
              </div>
              
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-gray-50 rounded-lg p-3">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-xl">{selectedGift.price}</span>
                <span className="text-gray-600">نقطة</span>
              </div>
              
              <div className="flex space-x-3 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmSend}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  إرسال الهدية
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}