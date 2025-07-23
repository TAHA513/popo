import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Gift, 
  Heart, 
  Crown, 
  Star,
  Sparkles,
  Coins,
  X,
  ChevronUp
} from "lucide-react";

interface MobileGiftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: any) => void;
  userPoints: number;
}

const quickGifts = [
  {
    id: 'heart',
    name: '❤️ قلب',
    price: 10,
    icon: Heart,
    gradient: 'from-red-400 to-pink-500',
  },
  {
    id: 'star',
    name: '⭐ نجمة',
    price: 20,
    icon: Star,
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'crown',
    name: '👑 تاج',
    price: 100,
    icon: Crown,
    gradient: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'sparkle',
    name: '✨ بريق',
    price: 15,
    icon: Sparkles,
    gradient: 'from-purple-400 to-pink-500',
  },
];

export default function MobileGiftPanel({ isOpen, onClose, onSendGift, userPoints }: MobileGiftPanelProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGiftSend = (gift: any) => {
    if (userPoints < gift.price) {
      toast({
        title: "نقاط غير كافية",
        description: `تحتاج إلى ${gift.price} نقطة`,
        variant: "destructive",
      });
      return;
    }
    
    onSendGift(gift);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-purple-600">🎁 إرسال هدية</h2>
                <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">{userPoints} نقطة</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Gifts Grid */}
            <div className="p-6 pb-safe">
              <h3 className="text-lg font-semibold mb-4 text-center">
                هدايا سريعة
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {quickGifts.map((gift, index) => {
                  const IconComponent = gift.icon;
                  const canAfford = userPoints >= gift.price;
                  
                  return (
                    <motion.div
                      key={gift.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-300 active:scale-95 ${
                          !canAfford ? 'opacity-50' : ''
                        }`}
                        onClick={() => canAfford && handleGiftSend(gift)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${gift.gradient} flex items-center justify-center shadow-lg`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          
                          <h4 className="font-semibold text-sm mb-2">{gift.name}</h4>
                          
                          <Badge 
                            variant="secondary" 
                            className="bg-yellow-100 text-yellow-800"
                          >
                            <Coins className="w-3 h-3 mr-1" />
                            {gift.price}
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* More Gifts Button */}
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl"
                onClick={() => {
                  onClose();
                  setLocation('/gifts');
                }}
              >
                <Gift className="w-5 h-5 mr-2" />
                المزيد من الهدايا
              </Button>

              {/* Safe area padding for iOS */}
              <div className="h-6" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}