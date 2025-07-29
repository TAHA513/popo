import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Gift, Heart, Star, Crown, Diamond } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface GiftOption {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  color: string;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  profileImageUrl?: string;
  points: number;
}

const GIFT_OPTIONS: GiftOption[] = [
  {
    id: "rose",
    name: "وردة حمراء",
    price: 50,
    icon: "🌹",
    description: "وردة جميلة للتعبير عن الإعجاب",
    color: "from-red-400 to-pink-400"
  },
  {
    id: "heart",
    name: "قلب ذهبي",
    price: 100,
    icon: "💛",
    description: "قلب ذهبي للتعبير عن المحبة",
    color: "from-yellow-400 to-orange-400"
  },
  {
    id: "star",
    name: "نجمة لامعة",
    price: 150,
    icon: "⭐",
    description: "نجمة مضيئة للأشخاص المميزين",
    color: "from-blue-400 to-purple-400"
  },
  {
    id: "crown",
    name: "تاج ملكي",
    price: 200,
    icon: "👑",
    description: "تاج للملوك والملكات",
    color: "from-purple-400 to-pink-400"
  },
  {
    id: "diamond",
    name: "ماسة نادرة",
    price: 500,
    icon: "💎",
    description: "ماسة نادرة للأشخاص الاستثنائيين",
    color: "from-cyan-400 to-blue-400"
  },
  {
    id: "premium_gift",
    name: "هدية بريميوم",
    price: 1000,
    icon: "🎁",
    description: "هدية فاخرة تفتح جميع ميزات الدردشة",
    color: "from-gradient-to-r from-purple-500 to-pink-500"
  }
];

export default function ChatGiftSelectionPage({ params }: { params: { userId: string } }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedGift, setSelectedGift] = useState<GiftOption | null>(null);
  const queryClient = useQueryClient();

  // جلب بيانات المستخدم المستهدف
  const { data: targetUser } = useQuery({
    queryKey: [`/api/users/${params.userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${params.userId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في جلب بيانات المستخدم');
      return response.json();
    }
  });

  // فحص حالة المتابعة
  const { data: followStatus } = useQuery({
    queryKey: [`/api/follow/status/${params.userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/follow/status/${params.userId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في فحص حالة المتابعة');
      return response.json();
    }
  });

  // إرسال الهدية وبدء المحادثة
  const sendGiftAndStartChat = useMutation({
    mutationFn: async (gift: GiftOption) => {
      // أولاً إرسال الهدية
      const giftResponse = await apiRequest('/api/send-gift', 'POST', {
        recipientId: params.userId,
        giftType: gift.id,
        amount: gift.price,
        message: `هدية لبدء الدردشة: ${gift.name}`
      });

      // ثم إنشاء المحادثة
      const chatResponse = await apiRequest('/api/conversations/create', 'POST', {
        otherUserId: params.userId
      });

      return chatResponse.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }); // تحديث رصيد النقاط
      setLocation(`/chat/${conversation.id}`);
    },
    onError: (error: any) => {
      alert(error.message || 'فشل في إرسال الهدية');
    }
  });

  const handleGiftSelection = (gift: GiftOption) => {
    if (!user || (user.points || 0) < gift.price) {
      alert('رصيدك غير كافي لشراء هذه الهدية');
      return;
    }
    setSelectedGift(gift);
  };

  const handleConfirmGift = () => {
    if (!selectedGift) return;
    sendGiftAndStartChat.mutate(selectedGift);
  };

  if (!targetUser || !followStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // فحص إذا كان المستخدم يتابع الشخص المستهدف
  if (!followStatus.isFollowing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20 md:pb-0">
        <SimpleNavigation />
        
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-red-700 mb-2">يجب المتابعة أولاً</h3>
              <p className="text-red-600 mb-4">
                لبدء دردشة خاصة مع @{targetUser.username}، يجب أن تكون تتابعه أولاً
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => setLocation(`/user/${params.userId}`)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  زيارة الملف الشخصي
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/messages')}
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  العودة للرسائل
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* معلومات المستخدم المستهدف */}
        <Card className="border-2 border-purple-200 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/messages')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5 ml-2" />
                العودة
              </Button>
            </div>
            
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                {targetUser.profileImageUrl ? (
                  <img src={targetUser.profileImageUrl} alt={targetUser.username} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                    {targetUser.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Avatar>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">@{targetUser.username}</h2>
              <p className="text-gray-600 mb-4">
                لبدء دردشة خاصة مع {targetUser.firstName || targetUser.username}، اختر هدية لإرسالها
              </p>
              
              <div className="bg-purple-100 px-4 py-2 rounded-lg inline-block">
                <span className="text-purple-700 font-semibold">رصيدك الحالي: {(user?.points || 0)} نقطة</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اختيار الهدايا */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">اختر هدية لبدء الدردشة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GIFT_OPTIONS.map((gift) => (
              <Card 
                key={gift.id}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  selectedGift?.id === gift.id 
                    ? 'border-purple-500 bg-purple-50 shadow-lg' 
                    : user && (user.points || 0) >= gift.price 
                      ? 'border-gray-200 hover:border-purple-300 hover:shadow-md' 
                      : 'border-gray-200 opacity-60'
                }`}
                onClick={() => handleGiftSelection(gift)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">{gift.icon}</div>
                  <h4 className="font-semibold text-gray-800 mb-1">{gift.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-bold ${user && (user.points || 0) >= gift.price ? 'text-green-600' : 'text-red-600'}`}>
                      {gift.price} نقطة
                    </span>
                    {user && (user.points || 0) < gift.price && (
                      <span className="text-xs text-red-500">(غير كافي)</span>
                    )}
                  </div>
                  {selectedGift?.id === gift.id && (
                    <div className="mt-2">
                      <div className="w-full h-1 bg-purple-200 rounded-full">
                        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      </div>
                      <span className="text-xs text-purple-600 mt-1 block">مُحدد</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* زر التأكيد */}
        {selectedGift && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-green-700 mb-2">
                  هل أنت متأكد من إرسال {selectedGift.name}؟
                </h4>
                <p className="text-green-600">
                  سيتم خصم {selectedGift.price} نقطة من رصيدك وبدء الدردشة مع @{targetUser.username}
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleConfirmGift}
                  disabled={sendGiftAndStartChat.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                >
                  {sendGiftAndStartChat.isPending ? (
                    'جاري الإرسال...'
                  ) : (
                    <>
                      <Gift className="w-4 h-4 ml-2" />
                      إرسال الهدية وبدء الدردشة
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setSelectedGift(null)}
                  className="border-gray-400 text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}