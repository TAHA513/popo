import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Users, Gift, Crown, Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
}

const AVAILABLE_GIFTS: Gift[] = [
  { id: 'rose', name: 'وردة', icon: '🌹', price: 50, description: 'وردة للدخول للغرفة' },
  { id: 'heart', name: 'قلب', icon: '❤️', price: 100, description: 'قلب للمشاعر الصادقة' },
  { id: 'star', name: 'نجمة', icon: '⭐', price: 200, description: 'نجمة للدردشة الجماعية' },
  { id: 'crown', name: 'تاج', icon: '👑', price: 500, description: 'تاج ملكي للغرفة الجماعية' },
  { id: 'diamond', name: 'ماسة', icon: '💎', price: 1000, description: 'ماسة للمحادثة المميزة' },
  { id: 'premium', name: 'هدية فاخرة', icon: '🎁', price: 2000, description: 'هدية فاخرة للغرفة الجماعية' }
];

export default function CreateGroupRoomPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [roomDuration, setRoomDuration] = useState(60); // في الدقائق

  // جلب رصيد النقاط
  const { data: userPoints = 0 } = useQuery<number>({
    queryKey: ['/api/users/points'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/points', 'GET');
      return response.points || 0;
    },
    enabled: !!user
  });

  // إنشاء الغرفة الجماعية
  const createGroupRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      return apiRequest('/api/group-rooms/create', 'POST', roomData);
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الغرفة الجماعية!",
        description: "الغرفة متاحة الآن للانضمام مقابل الهدية المحددة"
      });
      
      // التوجه لصفحة الغرفة الجماعية
      setTimeout(() => {
        setLocation(`/group-room/${data.roomId}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الغرفة",
        description: error.message || "حدث خطأ أثناء إنشاء الغرفة الجماعية",
        variant: "destructive"
      });
    }
  });

  const handleGiftSelect = (gift: Gift) => {
    setSelectedGift(gift);
  };

  const handleCreateRoom = () => {
    if (!selectedGift) {
      toast({
        title: "اختر الهدية",
        description: "يرجى اختيار هدية الدخول للغرفة",
        variant: "destructive"
      });
      return;
    }

    if (!roomTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للغرفة الجماعية",
        variant: "destructive"
      });
      return;
    }

    createGroupRoomMutation.mutate({
      title: roomTitle.trim(),
      description: roomDescription.trim(),
      giftRequired: selectedGift,
      entryPrice: selectedGift.price,
      maxParticipants,
      duration: roomDuration
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
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
        <h1 className="text-xl font-bold">إنشاء غرفة جماعية مدفوعة</h1>
        <div className="flex items-center text-sm">
          <Crown className="w-4 h-4 ml-1" />
          {userPoints} نقطة
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* معلومات الغرفة */}
        <Card className="bg-black/30 border-blue-500/20">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-right flex items-center">
              <Users className="w-5 h-5 ml-2" />
              إعدادات الغرفة الجماعية
            </h2>
            
            <Input
              placeholder="عنوان الغرفة الجماعية"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              className="bg-black/50 border-blue-500/30 text-white text-right"
            />
            
            <Textarea
              placeholder="وصف الغرفة وموضوع المحادثة (اختياري)"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              className="bg-black/50 border-blue-500/30 text-white text-right"
              rows={3}
            />

            {/* إعدادات الغرفة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600/20 rounded-lg p-3">
                <label className="block text-sm font-medium mb-2 text-right">عدد المشاركين</label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaxParticipants(Math.max(2, maxParticipants - 1))}
                    className="border-blue-500/50 text-white hover:bg-blue-600/20"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold min-w-[3rem] text-center">{maxParticipants}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaxParticipants(Math.min(20, maxParticipants + 1))}
                    className="border-blue-500/50 text-white hover:bg-blue-600/20"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-600/20 rounded-lg p-3">
                <label className="block text-sm font-medium mb-2 text-right">مدة الغرفة (دقيقة)</label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoomDuration(Math.max(30, roomDuration - 15))}
                    className="border-blue-500/50 text-white hover:bg-blue-600/20"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold min-w-[3rem] text-center">{roomDuration}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoomDuration(Math.min(180, roomDuration + 15))}
                    className="border-blue-500/50 text-white hover:bg-blue-600/20"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اختيار هدية الدخول */}
        <Card className="bg-black/30 border-blue-500/20">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-4 text-right flex items-center">
              <Gift className="w-5 h-5 ml-2" />
              اختر هدية الدخول للغرفة
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_GIFTS.map((gift) => (
                <div
                  key={gift.id}
                  onClick={() => handleGiftSelect(gift)}
                  className={`p-4 bg-black/50 rounded-lg cursor-pointer transition-all text-center ${
                    selectedGift?.id === gift.id 
                      ? 'ring-2 ring-blue-500 bg-blue-600/30' 
                      : 'hover:bg-blue-600/20'
                  }`}
                >
                  <div className="text-3xl mb-2">{gift.icon}</div>
                  <h3 className="font-bold text-sm">{gift.name}</h3>
                  <p className="text-blue-300 font-bold">{gift.price} نقطة</p>
                  <p className="text-xs text-white/60 mt-1">{gift.description}</p>
                </div>
              ))}
            </div>

            {selectedGift && (
              <div className="mt-6 p-4 bg-green-600/20 rounded-lg">
                <h3 className="font-bold text-center mb-2">تفاصيل الغرفة الجماعية</h3>
                <div className="text-sm text-center text-white/80 space-y-1">
                  <p><strong>العنوان:</strong> {roomTitle || "لم يتم إدخاله بعد"}</p>
                  <p><strong>عدد المشاركين:</strong> {maxParticipants} شخص</p>
                  <p><strong>مدة الغرفة:</strong> {roomDuration} دقيقة</p>
                  <p><strong>هدية الدخول:</strong> {selectedGift.name} ({selectedGift.price} نقطة)</p>
                  <p className="mt-2 text-yellow-300">
                    <strong>الأرباح المتوقعة:</strong> {selectedGift.price * maxParticipants} نقطة
                  </p>
                </div>
                <Button 
                  onClick={handleCreateRoom}
                  disabled={createGroupRoomMutation.isPending || !roomTitle.trim()}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  {createGroupRoomMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الغرفة الجماعية'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}