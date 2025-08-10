import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Gift, Coins, Heart, Crown, Star, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GiftAnimation } from "./gift-animation";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface GiftCharacter {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pointCost: number;
  animationType: string;
  isActive: boolean;
  hasSound: boolean;
  hasSpecialEffects: boolean;
  effectDuration: number;
}

interface EnhancedGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName?: string;
  streamId?: number | null;
  memoryId?: number | null;
  onGiftSent?: (gift: any) => void;
}

export function EnhancedGiftModal({ 
  isOpen, 
  onClose, 
  receiverId, 
  receiverName, 
  streamId, 
  memoryId,
  onGiftSent 
}: EnhancedGiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Effect to handle memoryId changes
  React.useEffect(() => {
    if (memoryId) {
      console.log('🎁 EnhancedGiftModal memoryId:', memoryId);
    }
  }, [memoryId]);

  // Fetch available gifts
  const { data: giftCharacters = [], isLoading } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: () => apiRequest('GET', '/api/gifts/characters').then(res => res.json()),
  });

  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (giftData: { receiverId: string; characterId: number; message: string; streamId?: number | null; memoryId?: number | null }) => {
      const response = await apiRequest('POST', '/api/gifts/send', giftData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إرسال الهدية بنجاح!",
        description: `تم إرسال ${selectedGift?.name} إلى ${receiverName}`,
      });
      setShowAnimation(true);
      if (onGiftSent) {
        onGiftSent(data.gift);
      }
      // Update user points
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // تحديث التعليقات إذا تم إرسال الهدية لمنشور معين
      if (memoryId) {
        queryClient.invalidateQueries({ queryKey: [`/api/memories/${memoryId}/comments`] });
      }
      
      // Clear form and close after animation
      setTimeout(() => {
        setSelectedGift(null);
        setShowAnimation(false);
        onClose();
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'فشل في إرسال الهدية';
      toast({
        title: "خطأ في الإرسال",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleSendGift = () => {
    if (!selectedGift) return;

    console.log('🎁 EnhancedGiftModal handleSendGift called:', {
      receiverId,
      characterId: selectedGift.id,
      message: "",
      streamId,
      memoryId
    });

    sendGiftMutation.mutate({
      receiverId,
      characterId: selectedGift.id,
      message: "",
      streamId,
      memoryId
    });
  };

  // Filter and organize gifts
  const availableGifts = giftCharacters.filter((gift: GiftCharacter) => gift.isActive);
  const hasGifts = availableGifts.length > 0;

  const getGiftIcon = (giftName: string) => {
    const iconMap: Record<string, string> = {
      // Characters
      'BoBo Love': '🐰💕',
      'BoFire': '🐲🔥',
      'Nunu Magic': '🦄🌟',
      'Dodo Splash': '🦆💦',
      'Meemo Wink': '🐱🌈',
      'Love Heart': '💝',
      
      // Love & Romance
      'قلب': '❤️',
      'وردة': '🌹',
      
      // Luxury & Status
      'تاج': '👑',
      'ألماسة': '💎',
      'سيارة': '🚗',
      'طائرة': '✈️',
      'قلعة': '🏰',
      'صاروخ': '🚀',
      'يخت': '🛥️',
      'جوهرة': '💍',
      'كأس': '🏆',
      'ساعة': '⌚',
      
      // Nature & Elements
      'نجمة': '⭐',
      'قمر': '🌙',
      'شمس': '☀️',
      'فراشة': '🦋',
      'نار': '🔥',
      'برق': '⚡',
      'قوس قزح': '🌈',
      
      // Celebration & Fun
      'كعكة': '🎂',
      'بالون': '🎈',
      'هدية': '🎁',
      
      // Cute & Sweet
      'دب': '🧸',
      
      // Technology & Modern
      'هاتف': '📱',
      'كاميرا': '📷',
      
      // Style & Cool
      'نظارة': '🕶️',
      
      // Special Items
      'مفتاح': '🗝️'
    };
    return iconMap[giftName] || '🎁';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto p-0 border-0 bg-transparent shadow-2xl" dir="rtl">
          <DialogHeader className="sr-only">
            <DialogTitle>إرسال هدية</DialogTitle>
            <DialogDescription>
              {receiverName ? `اختر هدية لإرسالها إلى ${receiverName}` : 'اختر هدية مميزة'}
            </DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-3xl p-6 text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-6xl">🎁</div>
              <div className="absolute bottom-4 left-4 text-4xl">✨</div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">💝</div>
            </div>

            {/* Close button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0 z-10"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-6 h-6" />
                <h2 className="text-2xl font-bold">إرسال هدية</h2>
              </div>
              <p className="text-purple-100 text-sm">
                {receiverName ? `${receiverName} اختر هدية لإرسالها إلى` : 'اختر هدية مميزة'}
              </p>
            </div>

            {/* User points display */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 text-center relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-yellow-300" />
                <span className="text-lg font-bold text-yellow-100">نقاطك المتاحة</span>
              </div>
              <div className="text-3xl font-bold text-yellow-300">
                {user?.points || 0} نقطة
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-8 relative z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-purple-100">جاري تحميل الهدايا...</p>
              </div>
            )}

            {/* No gifts available */}
            {!isLoading && !hasGifts && (
              <div className="text-center py-8 relative z-10">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-lg font-semibold mb-2">لا توجد هدايا متاحة</p>
                <p className="text-purple-200 text-sm">عذراً، لا توجد هدايا متاحة في الوقت الحالي</p>
              </div>
            )}

            {/* Gift selection */}
            {!isLoading && hasGifts && !selectedGift && (
              <div className="space-y-4 relative z-10">
                <h3 className="text-lg font-semibold text-center text-purple-100">اختر هديتك المفضلة</h3>
                
                {/* Gift categories info */}
                <div className="flex justify-center gap-2 text-xs">
                  <span className="bg-green-500/20 text-green-200 px-2 py-1 rounded-full">🎈 رخيصة (10-100)</span>
                  <span className="bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded-full">💎 متوسطة (100-500)</span>
                  <span className="bg-red-500/20 text-red-200 px-2 py-1 rounded-full">👑 فاخرة (500+)</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                  {availableGifts.map((gift: GiftCharacter) => {
                    // Define gift category colors based on price
                    const getCategoryColor = (cost: number) => {
                      if (cost <= 100) return 'border-green-400/50 bg-green-500/10';
                      if (cost <= 500) return 'border-yellow-400/50 bg-yellow-500/10';
                      return 'border-red-400/50 bg-red-500/10';
                    };
                    
                    return (
                    <motion.div
                      key={gift.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedGift(gift)}
                      className={`bg-white/20 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-white/30 text-center border ${getCategoryColor(gift.pointCost)}`}
                    >
                      <div className="text-3xl mb-2">
                        {getGiftIcon(gift.name)}
                      </div>
                      <div className="text-xs font-semibold text-purple-100 mb-1 truncate">
                        {gift.name}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-300" />
                        <span className="text-xs font-bold text-yellow-300">
                          {gift.pointCost}
                        </span>
                      </div>
                      
                      {/* Special gift indicator */}
                      {gift.hasSpecialEffects && (
                        <div className="absolute -top-1 -right-1 text-xs">✨</div>
                      )}
                      {gift.hasSound && (
                        <div className="absolute -top-1 -left-1 text-xs">🔊</div>
                      )}
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected gift confirmation */}
            {selectedGift && (
              <div className="space-y-4 relative z-10">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-5xl mb-3">
                    {getGiftIcon(selectedGift.name)}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{selectedGift.name}</h3>
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <Coins className="w-5 h-5" />
                    <span className="text-lg font-bold">{selectedGift.pointCost} نقطة</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedGift(null)}
                    variant="outline"
                    className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    تراجع
                  </Button>
                  <Button
                    onClick={handleSendGift}
                    disabled={sendGiftMutation.isPending || (user?.points || 0) < selectedGift.pointCost}
                    className="flex-1 bg-white text-purple-600 hover:bg-white/90 font-bold"
                  >
                    {sendGiftMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        جاري الإرسال...
                      </div>
                    ) : (user?.points || 0) < selectedGift.pointCost ? (
                      'نقاط غير كافية'
                    ) : (
                      'إرسال الآن'
                    )}
                  </Button>
                </div>

                {(user?.points || 0) < selectedGift.pointCost && (
                  <p className="text-center text-sm text-red-200">
                    تحتاج إلى {selectedGift.pointCost - (user?.points || 0)} نقطة إضافية
                  </p>
                )}
              </div>
            )}

            {/* Close button at bottom when no gift selected */}
            {!selectedGift && hasGifts && !isLoading && (
              <div className="mt-6 relative z-10">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  إغلاق
                </Button>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Gift Animation */}
      {showAnimation && selectedGift && (
        <GiftAnimation
          gift={selectedGift}
          isVisible={showAnimation}
          onComplete={() => setShowAnimation(false)}
        />
      )}
    </>
  );
}