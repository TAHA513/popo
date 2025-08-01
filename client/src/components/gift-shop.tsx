import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Gift, Crown, Diamond, Car, Plane, Castle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GiftAnimation } from "./gift-animation";

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

interface GiftShopProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName?: string;
  streamId?: number | null;
  onGiftSent?: (gift: any) => void;
}

const giftIcons: Record<string, React.ReactNode> = {
  'قلب': <Heart className="w-8 h-8 text-red-500" />,
  'وردة': <span className="text-3xl">🌹</span>,
  'تاج': <Crown className="w-8 h-8 text-yellow-500" />,
  'ألماسة': <Diamond className="w-8 h-8 text-blue-500" />,
  'سيارة': <Car className="w-8 h-8 text-gray-700" />,
  'طائرة': <Plane className="w-8 h-8 text-blue-600" />,
  'قلعة': <Castle className="w-8 h-8 text-purple-600" />
};

export function GiftShop({ isOpen, onClose, receiverId, receiverName, streamId, onGiftSent }: GiftShopProps) {
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const [message, setMessage] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available gifts
  const { data: giftCharacters = [], isLoading } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: () => apiRequest('GET', '/api/gifts/characters').then(res => res.json()),
  });

  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (giftData: { receiverId: string; characterId: number; message: string; streamId?: number | null }) => {
      const response = await apiRequest('POST', '/api/gifts/send', giftData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إرسال الهدية بنجاح!",
        description: data.message,
      });
      setShowAnimation(true);
      if (onGiftSent) {
        onGiftSent(data.gift);
      }
      // Update user points
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Clear form and close after animation
      setTimeout(() => {
        setSelectedGift(null);
        setMessage('');
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
    if (!selectedGift) {
      toast({
        title: "اختر هدية",
        description: "يرجى اختيار هدية لإرسالها",
        variant: "destructive"
      });
      return;
    }

    sendGiftMutation.mutate({
      receiverId,
      characterId: selectedGift.id,
      message: message.trim(),
      streamId
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-pink-600">
              🎁 متجر الهدايا
            </DialogTitle>
            {receiverName && (
              <p className="text-center text-gray-600 mt-2">
                إرسال هدية إلى {receiverName}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {/* Gift Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {giftCharacters.map((gift: GiftCharacter) => (
                <Card 
                  key={gift.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedGift?.id === gift.id 
                      ? 'ring-2 ring-pink-500 bg-pink-50' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedGift(gift)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {giftIcons[gift.name] || <Gift className="w-8 h-8 text-pink-500" />}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{gift.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      مجاني! 🎁
                    </div>
                    {gift.hasSpecialEffects && (
                      <div className="mt-2">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          ✨ تأثيرات خاصة
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Gift Details */}
            {selectedGift && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border-2 border-pink-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">
                    {giftIcons[selectedGift.name] || <Gift className="w-10 h-10 text-pink-500" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-pink-700">{selectedGift.name}</h3>
                    <p className="text-gray-600">{selectedGift.description}</p>
                    <p className="text-lg font-bold text-purple-600 mt-1">
                      {selectedGift.pointCost} نقطة
                    </p>
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    رسالة مع الهدية (اختيارية)
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالة جميلة مع هديتك..."
                    className="resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 text-left">
                    {message.length}/200
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSendGift}
                disabled={!selectedGift || sendGiftMutation.isPending}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 text-lg"
              >
                {sendGiftMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الإرسال...
                  </div>
                ) : (
                  <>
                    🎁 إرسال الهدية
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6"
                disabled={sendGiftMutation.isPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
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