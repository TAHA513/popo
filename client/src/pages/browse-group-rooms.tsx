import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Users, Gift, Crown, Clock, User, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface GroupRoom {
  id: number;
  title: string;
  description: string;
  giftRequired: {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
  };
  entryPrice: number;
  maxParticipants: number;
  currentParticipants: number;
  duration: number;
  roomEndsAt: string;
  createdAt: string;
  hostId: string;
  hostUsername: string;
  hostFirstName: string;
  hostProfileImage?: string;
}

export default function BrowseGroupRoomsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // جلب الغرف المتاحة
  const { data: rooms = [], isLoading, refetch } = useQuery<GroupRoom[]>({
    queryKey: ['/api/group-rooms/available'],
    queryFn: async () => {
      return apiRequest('/api/group-rooms/available', 'GET');
    },
    enabled: !!user,
    refetchInterval: 10000 // Refresh every 10 seconds
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

  // الانضمام للغرفة الجماعية
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return apiRequest(`/api/group-rooms/${roomId}/join`, 'POST');
    },
    onSuccess: (data, roomId) => {
      toast({
        title: "تم الانضمام!",
        description: "تم دفع الهدية والانضمام للغرفة الجماعية"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/group-rooms/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/points'] });
      
      // التوجه لصفحة الغرفة الجماعية
      setTimeout(() => {
        setLocation(`/group-room/${roomId}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الانضمام",
        description: error.message || "حدث خطأ أثناء الانضمام للغرفة",
        variant: "destructive"
      });
    }
  });

  const formatTimeRemaining = (roomEndsAt: string) => {
    const now = new Date();
    const endTime = new Date(roomEndsAt);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return "انتهت";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    return `${minutes}د`;
  };

  const calculateProgress = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">جاري تحميل الغرف الجماعية...</div>
      </div>
    );
  }

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
        <h1 className="text-xl font-bold">الغرف الجماعية المتاحة</h1>
        <div className="flex items-center text-sm">
          <Crown className="w-4 h-4 ml-1" />
          {userPoints} نقطة
        </div>
      </div>

      <div className="p-4">
        {rooms.length === 0 ? (
          <Card className="bg-black/30 border-blue-500/20">
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">لا توجد غرف متاحة</h2>
              <p className="text-white/60">
                لا توجد غرف جماعية نشطة حالياً
              </p>
              <Button 
                onClick={() => setLocation('/create-group-room')}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                إنشاء غرفة جماعية
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {rooms.length} غرفة جماعية متاحة
              </h2>
              <Button 
                onClick={() => refetch()}
                variant="outline" 
                size="sm"
                className="border-blue-500/50 text-white hover:bg-blue-600/20"
              >
                تحديث
              </Button>
            </div>
            
            {rooms.map((room) => (
              <Card key={room.id} className="bg-black/30 border-blue-500/20">
                <CardContent className="p-4">
                  {/* معلومات المضيف */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <img
                        src={room.hostProfileImage || '/icon-192x192.png'}
                        alt={room.hostUsername}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="mr-3 text-right">
                        <h4 className="font-bold text-sm">
                          {room.hostFirstName || room.hostUsername}
                        </h4>
                        <p className="text-xs text-white/60">@{room.hostUsername}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="border-green-500/50 text-green-400">
                        <Clock className="w-3 h-3 ml-1" />
                        {formatTimeRemaining(room.roomEndsAt)}
                      </Badge>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                        <Users className="w-3 h-3 ml-1" />
                        {room.currentParticipants}/{room.maxParticipants}
                      </Badge>
                    </div>
                  </div>

                  {/* تفاصيل الغرفة */}
                  <div className="bg-blue-600/20 rounded-lg p-3 mb-4">
                    <h3 className="font-bold text-lg text-center mb-2">
                      {room.title}
                    </h3>
                    {room.description && (
                      <p className="text-sm text-white/80 text-center mb-3">
                        {room.description}
                      </p>
                    )}
                    
                    {/* شريط التقدم */}
                    <div className="w-full bg-black/30 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(room.currentParticipants, room.maxParticipants)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-white/70">
                      {calculateProgress(room.currentParticipants, room.maxParticipants)}% ممتلئة
                    </p>
                  </div>

                  {/* الهدية المطلوبة */}
                  <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">{room.giftRequired.icon}</div>
                      <h4 className="font-bold">{room.giftRequired.name}</h4>
                      <p className="text-yellow-300 font-bold text-lg">
                        {room.giftRequired.price} نقطة
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        {room.giftRequired.description}
                      </p>
                      
                      {room.giftRequired.price > userPoints && (
                        <p className="text-red-400 text-sm mt-2 font-medium">
                          تحتاج {room.giftRequired.price - userPoints} نقطة إضافية
                        </p>
                      )}
                    </div>
                  </div>

                  {/* زر الانضمام */}
                  <Button
                    onClick={() => joinRoomMutation.mutate(room.id)}
                    disabled={
                      joinRoomMutation.isPending || 
                      room.giftRequired.price > userPoints ||
                      room.currentParticipants >= room.maxParticipants
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {joinRoomMutation.isPending 
                      ? 'جاري الانضمام...' 
                      : room.currentParticipants >= room.maxParticipants
                      ? 'الغرفة ممتلئة'
                      : 'انضم ادفع الهدية'
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}