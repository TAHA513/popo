import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Users, Gift, Crown, Heart, Star, Diamond, Trash2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface Follower {
  id: string;
  username: string;
  firstName: string;
  profileImageUrl?: string;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
}

const AVAILABLE_GIFTS: Gift[] = [
  { id: 'rose', name: 'وردة', icon: '🌹', price: 50, description: 'وردة جميلة للمحادثة' },
  { id: 'heart', name: 'قلب', icon: '❤️', price: 100, description: 'قلب للمشاعر الصادقة' },
  { id: 'star', name: 'نجمة', icon: '⭐', price: 200, description: 'نجمة مضيئة للدردشة' },
  { id: 'crown', name: 'تاج', icon: '👑', price: 500, description: 'تاج ملكي للغرفة الخاصة' },
  { id: 'diamond', name: 'ماسة', icon: '💎', price: 1000, description: 'ماسة ثمينة للمحادثة المميزة' },
  { id: 'premium', name: 'هدية فاخرة', icon: '🎁', price: 2000, description: 'هدية فاخرة للمحادثات الخاصة' }
];

export default function CreatePrivateRoomPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedFollower, setSelectedFollower] = useState<Follower | null>(null);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [showGiftSelection, setShowGiftSelection] = useState(false);

  // جلب المتابعين
  const { data: followers = [], isLoading: loadingFollowers } = useQuery<Follower[]>({
    queryKey: ['/api/users/followers'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/followers', 'GET');
      return response;
    },
    enabled: !!user
  });

  // جلب رصيد النقاط
  const { data: userPoints = 0 } = useQuery<number>({
    queryKey: ['/api/users/points'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/points', 'GET');
      return response.points || 0;
    },
    enabled: !!user
  });

  // إنشاء الغرفة الخاصة
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      return apiRequest('/api/private-rooms/create', 'POST', roomData);
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الغرفة!",
        description: "تم إرسال الدعوة بنجاح"
      });
      
      // إرسال إشعار للمستخدم المدعو
      sendInvitationNotification.mutate({
        recipientId: selectedFollower!.id,
        roomId: data.roomId,
        giftRequired: selectedGift!,
        message: `${user?.firstName || user?.username} يدعوك لغرفة خاصة مقابل هدية ${selectedGift!.name}`
      });
      
      setLocation('/messages');
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الغرفة",
        description: error.message || "حدث خطأ أثناء إنشاء الغرفة",
        variant: "destructive"
      });
    }
  });

  // إرسال إشعار الدعوة
  const sendInvitationNotification = useMutation({
    mutationFn: async (notificationData: any) => {
      return apiRequest('/api/notifications/send', 'POST', notificationData);
    }
  });

  const handleFollowerSelect = (follower: Follower) => {
    setSelectedFollower(follower);
    setShowGiftSelection(true);
  };

  const handleGiftSelect = (gift: Gift) => {
    if (gift.price > userPoints) {
      toast({
        title: "رصيد غير كافي",
        description: `تحتاج ${gift.price} نقطة لهذه الهدية`,
        variant: "destructive"
      });
      return;
    }
    setSelectedGift(gift);
  };

  const handleCreateRoom = () => {
    if (!selectedFollower || !selectedGift) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى اختيار متابع وهدية",
        variant: "destructive"
      });
      return;
    }

    if (!roomTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للغرفة",
        variant: "destructive"
      });
      return;
    }

    createRoomMutation.mutate({
      invitedUserId: selectedFollower.id,
      giftRequired: selectedGift,
      title: roomTitle.trim(),
      description: roomDescription.trim(),
      entryPrice: selectedGift.price
    });
  };

  if (loadingFollowers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-lg">جاري تحميل المتابعين...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/messages')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 ml-2" />
          العودة
        </Button>
        <h1 className="text-xl font-bold">إنشاء غرفة خاصة</h1>
        <div className="flex items-center text-sm">
          <Crown className="w-4 h-4 ml-1" />
          {userPoints} نقطة
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* معلومات الغرفة */}
        {!showGiftSelection && (
          <Card className="bg-black/30 border-purple-500/20">
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-bold text-right flex items-center">
                <Users className="w-5 h-5 ml-2" />
                معلومات الغرفة
              </h2>
              
              <Input
                placeholder="عنوان الغرفة الخاصة"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white text-right"
              />
              
              <Textarea
                placeholder="وصف الغرفة (اختياري)"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                className="bg-black/50 border-purple-500/30 text-white text-right"
                rows={3}
              />
            </CardContent>
          </Card>
        )}

        {/* اختيار المتابع */}
        {!showGiftSelection && (
          <Card className="bg-black/30 border-purple-500/20">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-4 text-right flex items-center">
                <Users className="w-5 h-5 ml-2" />
                اختر متابع للدعوة ({followers.length})
              </h2>
              
              {followers.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا يوجد متابعين حالياً</p>
                  <p className="text-sm mt-2">ابحث عن أصدقاء وتابعهم لإنشاء غرف خاصة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {followers.map((follower) => (
                    <div
                      key={follower.id}
                      onClick={() => handleFollowerSelect(follower)}
                      className="flex items-center p-3 bg-black/50 rounded-lg cursor-pointer hover:bg-purple-600/20 transition-colors"
                    >
                      <img
                        src={follower.profileImageUrl || '/icon-192x192.png'}
                        alt={follower.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 mr-3 text-right">
                        <h3 className="font-semibold">{follower.firstName || follower.username}</h3>
                        <p className="text-sm text-white/60">@{follower.username}</p>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        دعوة
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* اختيار الهدية */}
        {showGiftSelection && selectedFollower && (
          <Card className="bg-black/30 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowGiftSelection(false);
                    setSelectedFollower(null);
                    setSelectedGift(null);
                  }}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 ml-1" />
                  تغيير المتابع
                </Button>
                <h2 className="text-lg font-bold text-right flex items-center">
                  <Gift className="w-5 h-5 ml-2" />
                  اختر الهدية المطلوبة
                </h2>
              </div>

              {/* معلومات المتابع المختار */}
              <div className="bg-purple-600/20 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <img
                    src={selectedFollower.profileImageUrl || '/icon-192x192.png'}
                    alt={selectedFollower.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 mr-3 text-right">
                    <h3 className="font-semibold">{selectedFollower.firstName || selectedFollower.username}</h3>
                    <p className="text-sm text-white/60">المدعو للغرفة الخاصة</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_GIFTS.map((gift) => (
                  <div
                    key={gift.id}
                    onClick={() => handleGiftSelect(gift)}
                    className={`p-4 bg-black/50 rounded-lg cursor-pointer transition-all text-center ${
                      selectedGift?.id === gift.id 
                        ? 'ring-2 ring-purple-500 bg-purple-600/30' 
                        : 'hover:bg-purple-600/20'
                    } ${
                      gift.price > userPoints 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    <div className="text-3xl mb-2">{gift.icon}</div>
                    <h3 className="font-bold text-sm">{gift.name}</h3>
                    <p className="text-purple-300 font-bold">{gift.price} نقطة</p>
                    <p className="text-xs text-white/60 mt-1">{gift.description}</p>
                    {gift.price > userPoints && (
                      <p className="text-red-400 text-xs mt-1">رصيد غير كافي</p>
                    )}
                  </div>
                ))}
              </div>

              {selectedGift && (
                <div className="mt-6 p-4 bg-green-600/20 rounded-lg">
                  <h3 className="font-bold text-center mb-2">تأكيد الدعوة</h3>
                  <p className="text-sm text-center text-white/80">
                    ستتم دعوة <strong>{selectedFollower.firstName || selectedFollower.username}</strong>
                    <br />
                    للغرفة الخاصة مقابل هدية <strong>{selectedGift.name} ({selectedGift.price} نقطة)</strong>
                  </p>
                  <Button 
                    onClick={handleCreateRoom}
                    disabled={createRoomMutation.isPending}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    {createRoomMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الغرفة وإرسال الدعوة'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}