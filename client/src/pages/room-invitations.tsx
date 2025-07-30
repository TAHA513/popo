import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Gift, Crown, Clock, Check, X } from "lucide-react";
import { useLocation } from "wouter";

interface RoomInvitation {
  id: number;
  roomId: number;
  fromUserId: string;
  message: string;
  giftRequired: {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
  };
  expiresAt: string;
  createdAt: string;
  roomTitle: string;
  roomDescription: string;
  senderUsername: string;
  senderFirstName: string;
  senderProfileImage?: string;
}

export default function RoomInvitationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // جلب الدعوات المعلقة
  const { data: invitations = [], isLoading, refetch } = useQuery<RoomInvitation[]>({
    queryKey: ['/api/room-invitations/pending'],
    queryFn: async () => {
      return apiRequest('/api/room-invitations/pending', 'GET');
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

  // قبول الدعوة
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest(`/api/room-invitations/${invitationId}/accept`, 'POST');
    },
    onSuccess: (data, invitationId) => {
      toast({
        title: "تم قبول الدعوة!",
        description: "تم دفع الهدية، يمكنك الآن الدخول للغرفة الخاصة"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/room-invitations/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/points'] });
      
      // التوجه لصفحة الغرفة الخاصة
      setTimeout(() => {
        setLocation(`/private-room/${data.roomId}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في قبول الدعوة",
        description: error.message || "حدث خطأ أثناء قبول الدعوة",
        variant: "destructive"
      });
    }
  });

  // رفض الدعوة
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return apiRequest(`/api/room-invitations/${invitationId}/decline`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "تم رفض الدعوة",
        description: "تم رفض الدعوة بنجاح"
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/room-invitations/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفض الدعوة",
        description: error.message || "حدث خطأ أثناء رفض الدعوة",
        variant: "destructive"
      });
    }
  });

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "منتهية الصلاحية";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-lg">جاري تحميل الدعوات...</div>
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
        <h1 className="text-xl font-bold">دعوات الغرف الخاصة</h1>
        <div className="flex items-center text-sm">
          <Crown className="w-4 h-4 ml-1" />
          {userPoints} نقطة
        </div>
      </div>

      <div className="p-4">
        {invitations.length === 0 ? (
          <Card className="bg-black/30 border-purple-500/20">
            <CardContent className="p-8 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">لا توجد دعوات</h2>
              <p className="text-white/60">
                لم تتلق أي دعوات للغرف الخاصة حتى الآن
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-center mb-4">
              لديك {invitations.length} دعوة للغرف الخاصة
            </h2>
            
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="bg-black/30 border-purple-500/20">
                <CardContent className="p-4">
                  {/* معلومات المرسل */}
                  <div className="flex items-center mb-4">
                    <img
                      src={invitation.senderProfileImage || '/icon-192x192.png'}
                      alt={invitation.senderUsername}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 mr-3 text-right">
                      <h3 className="font-bold">
                        {invitation.senderFirstName || invitation.senderUsername}
                      </h3>
                      <p className="text-sm text-white/60">@{invitation.senderUsername}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-white/70 mb-1">
                        <Clock className="w-4 h-4 ml-1" />
                        {formatTimeRemaining(invitation.expiresAt)}
                      </div>
                    </div>
                  </div>

                  {/* تفاصيل الغرفة */}
                  <div className="bg-purple-600/20 rounded-lg p-3 mb-4">
                    <h4 className="font-bold text-lg text-center mb-2">
                      {invitation.roomTitle}
                    </h4>
                    {invitation.roomDescription && (
                      <p className="text-sm text-white/80 text-center mb-2">
                        {invitation.roomDescription}
                      </p>
                    )}
                    <p className="text-sm text-center text-white/70">
                      {invitation.message}
                    </p>
                  </div>

                  {/* الهدية المطلوبة */}
                  <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{invitation.giftRequired.icon}</div>
                      <h4 className="font-bold text-lg">{invitation.giftRequired.name}</h4>
                      <p className="text-yellow-300 font-bold text-xl">
                        {invitation.giftRequired.price} نقطة
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        {invitation.giftRequired.description}
                      </p>
                      
                      {invitation.giftRequired.price > userPoints && (
                        <p className="text-red-400 text-sm mt-2 font-medium">
                          تحتاج {invitation.giftRequired.price - userPoints} نقطة إضافية
                        </p>
                      )}
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => declineInvitationMutation.mutate(invitation.id)}
                      disabled={declineInvitationMutation.isPending}
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4 ml-1" />
                      رفض
                    </Button>
                    
                    <Button
                      onClick={() => acceptInvitationMutation.mutate(invitation.id)}
                      disabled={
                        acceptInvitationMutation.isPending || 
                        invitation.giftRequired.price > userPoints
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 ml-1" />
                      {acceptInvitationMutation.isPending 
                        ? 'جاري القبول...' 
                        : 'قبول ودفع الهدية'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}