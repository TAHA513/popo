import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  'قلب': <span className="text-4xl">❤️</span>,
  'وردة': <span className="text-4xl">🌹</span>,
  'تاج': <span className="text-4xl">👑</span>,
  'ألماسة': <span className="text-4xl">💎</span>,
  'سيارة': <span className="text-4xl">🚗</span>,
  'طائرة': <span className="text-4xl">✈️</span>,
  'قلعة': <span className="text-4xl">🏰</span>,
  'BoBo Love': <span className="text-4xl">🐰💕</span>,
  'BoFire': <span className="text-4xl">🐲🔥</span>,
  'Nunu Magic': <span className="text-4xl">🦄🌟</span>,
  'Dodo Splash': <span className="text-4xl">🦆💦</span>,
  'Meemo Wink': <span className="text-4xl">🐱🌈</span>,
  'Love Heart': <span className="text-4xl">💝</span>
};

export function GiftShop({ isOpen, onClose, receiverId, receiverName, streamId, onGiftSent }: GiftShopProps) {
  const [selectedGift, setSelectedGift] = useState<GiftCharacter | null>(null);
  const [message, setMessage] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [actualReceiverId, setActualReceiverId] = useState(receiverId);
  const [actualReceiverName, setActualReceiverName] = useState(receiverName || '');
  const [showUserSelector, setShowUserSelector] = useState(receiverId === 'placeholder');
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

  // Fetch users for selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users/suggested'],
    queryFn: () => apiRequest('GET', '/api/users/suggested').then(res => res.json()),
    enabled: showUserSelector
  });

  const handleSendGift = () => {
    if (showUserSelector && (!actualReceiverId || actualReceiverId === 'placeholder')) {
      toast({
        title: "اختر المستقبل",
        description: "يرجى اختيار الشخص الذي تريد إرسال الهدية إليه",
        variant: "destructive"
      });
      return;
    }

    if (!selectedGift) {
      toast({
        title: "اختر هدية",
        description: "يرجى اختيار هدية لإرسالها",
        variant: "destructive"
      });
      return;
    }

    sendGiftMutation.mutate({
      receiverId: actualReceiverId,
      characterId: selectedGift.id,
      message: message.trim(),
      streamId
    });
  };

  const selectReceiver = (userId: string, userName: string) => {
    setActualReceiverId(userId);
    setActualReceiverName(userName);
    setShowUserSelector(false);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogTitle className="sr-only">جاري التحميل</DialogTitle>
          <DialogDescription className="sr-only">يتم تحميل الهدايا</DialogDescription>
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-pink-600">
              🎁 متجر الهدايا
            </DialogTitle>
            <DialogDescription className="sr-only">
              متجر الهدايا لإرسال هدايا للأصدقاء
            </DialogDescription>
            {showUserSelector ? (
              <p className="text-center text-gray-600 mt-2">
                اختر الشخص الذي تريد إرسال الهدية إليه
              </p>
            ) : actualReceiverName && (
              <p className="text-center text-gray-600 mt-2">
                إرسال هدية إلى {actualReceiverName}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {/* User Selection */}
            {showUserSelector && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">👥 اختر المستقبل</h3>
                  <p className="text-sm text-gray-600">اختر الشخص الذي تريد إرسال الهدية إليه</p>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-3 bg-gray-50 rounded-xl p-3">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-2 block">😔</span>
                      <p className="text-gray-500">لا توجد مستخدمين متاحين</p>
                    </div>
                  ) : (
                    users.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-pink-50 rounded-xl cursor-pointer transition-all duration-200 hover:scale-102 shadow-sm hover:shadow-md"
                        onClick={() => selectReceiver(user.id, user.username || user.firstName)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(user.username || user.firstName || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{user.username || user.firstName}</p>
                          {user.firstName && user.username && (
                            <p className="text-sm text-gray-500">{user.firstName}</p>
                          )}
                          {user.isOnline && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              متصل الآن
                            </span>
                          )}
                        </div>
                        <div className="text-pink-500">
                          🎁
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Change Receiver Button */}
            {!showUserSelector && actualReceiverName && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserSelector(true)}
                  className="text-pink-600 border-pink-300 hover:bg-pink-50"
                >
                  تغيير المستقبل
                </Button>
              </div>
            )}

            {/* Gift Selection - TikTok Style */}
            {!showUserSelector && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-center text-gray-800">اختر هديتك 🎁</h3>
                
                {/* Popular Gifts Row */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">الهدايا الشائعة</h4>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {giftCharacters
                      .filter((gift: GiftCharacter) => gift.pointCost <= 100)
                      .map((gift: GiftCharacter) => (
                      <div
                        key={gift.id}
                        className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 min-w-[60px] ${
                          selectedGift?.id === gift.id 
                            ? 'bg-pink-500 text-white shadow-lg transform scale-105' 
                            : 'bg-white hover:bg-pink-100 border border-pink-200'
                        }`}
                        onClick={() => setSelectedGift(gift)}
                      >
                        <div className="mb-1">
                          {giftIcons[gift.name] || <span className="text-3xl">🎁</span>}
                        </div>
                        <span className={`text-xs font-bold ${
                          selectedGift?.id === gift.id ? 'text-white' : 'text-pink-600'
                        }`}>
                          {gift.pointCost}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Gifts Row */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">الهدايا المميزة</h4>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {giftCharacters
                      .filter((gift: GiftCharacter) => gift.pointCost > 100 && gift.pointCost <= 500)
                      .map((gift: GiftCharacter) => (
                      <div
                        key={gift.id}
                        className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 min-w-[60px] ${
                          selectedGift?.id === gift.id 
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg transform scale-105' 
                            : 'bg-white hover:bg-yellow-100 border border-yellow-300'
                        }`}
                        onClick={() => setSelectedGift(gift)}
                      >
                        <div className="mb-1 relative">
                          {giftIcons[gift.name] || <span className="text-3xl">🎁</span>}
                          {gift.hasSpecialEffects && (
                            <span className="absolute -top-1 -right-1 text-xs">✨</span>
                          )}
                        </div>
                        <span className={`text-xs font-bold ${
                          selectedGift?.id === gift.id ? 'text-white' : 'text-yellow-600'
                        }`}>
                          {gift.pointCost}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VIP Gifts Row */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">هدايا VIP</h4>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {giftCharacters
                      .filter((gift: GiftCharacter) => gift.pointCost > 500)
                      .map((gift: GiftCharacter) => (
                      <div
                        key={gift.id}
                        className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 min-w-[70px] ${
                          selectedGift?.id === gift.id 
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl transform scale-105' 
                            : 'bg-white hover:bg-purple-100 border border-purple-300'
                        }`}
                        onClick={() => setSelectedGift(gift)}
                      >
                        <div className="mb-1 relative">
                          {giftIcons[gift.name] || <span className="text-3xl">🎁</span>}
                          <div className="flex gap-1 absolute -top-1 -right-1">
                            {gift.hasSpecialEffects && <span className="text-xs">✨</span>}
                            {gift.hasSound && <span className="text-xs">🔊</span>}
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${
                          selectedGift?.id === gift.id ? 'text-white' : 'text-purple-600'
                        }`}>
                          {gift.pointCost}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Gift & Quick Send */}
            {selectedGift && !showUserSelector && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-pink-200 p-4 shadow-lg z-50">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {giftIcons[selectedGift.name] || <span className="text-3xl">🎁</span>}
                      </div>
                      <div>
                        <h3 className="font-bold text-pink-700">{selectedGift.name}</h3>
                        <p className="text-sm font-bold text-purple-600">
                          {selectedGift.pointCost} نقطة
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedGift(null)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Quick Message Input */}
                  <div className="mb-3">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="رسالة سريعة... (اختيارية)"
                      className="text-center"
                      maxLength={50}
                    />
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendGift}
                    disabled={sendGiftMutation.isPending}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-full"
                  >
                    {sendGiftMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        جاري الإرسال...
                      </div>
                    ) : (
                      <>
                        🎁 إرسال الآن ({selectedGift.pointCost} نقطة)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Close Button */}
            {!selectedGift && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="px-8 py-2 border-gray-300 hover:bg-gray-50"
                >
                  إغلاق
                </Button>
              </div>
            )}
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