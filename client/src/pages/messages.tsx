import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, Send, ArrowRight, ArrowLeft, Gift, Crown, Users, Trash2, Clock, UserCheck } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { GiftShop } from "@/components/gift-shop";

export default function MessagesPage() {
  const { user } = useAuth();
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserForGift, setSelectedUserForGift] = useState<any>(null);
  const [showGiftShop, setShowGiftShop] = useState(false);

  // Fetch conversations with auto-refresh
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    refetchInterval: 3000, // تحديث كل 3 ثوان
    staleTime: 1000 // البيانات تعتبر قديمة بعد ثانية واحدة
  });

  // Fetch message requests count
  const { data: requests = [] } = useQuery({
    queryKey: ['/api/messages/requests'],
    queryFn: async () => {
      const response = await fetch('/api/messages/requests', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    }
  });

  // Fetch pending private room invitations count
  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ['/api/room-invitations/pending'],
    queryFn: async () => {
      const response = await fetch('/api/room-invitations/pending', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch active private rooms count
  const { data: activePrivateRooms = [] } = useQuery({
    queryKey: ['/api/private-rooms/active'],
    queryFn: async () => {
      const response = await fetch('/api/private-rooms/active', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch active rooms');
      return response.json();  
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  // Delete private room mutation
  const deletePrivateRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return apiRequest(`/api/private-rooms/${roomId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف الغرفة الخاصة بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/private-rooms/active'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف الغرفة",
        variant: "destructive"
      });
    }
  });

  // Fetch available group rooms count
  const { data: availableGroupRooms = [] } = useQuery({
    queryKey: ['/api/group-rooms/available'],
    queryFn: async () => {
      const response = await fetch('/api/group-rooms/available', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch group rooms');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  // Delete group room mutation
  const deleteGroupRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return apiRequest(`/api/group-rooms/${roomId}`, 'DELETE');
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحذف",
        description: `تم حذف الغرفة الجماعية واسترداد ${data.refundedAmount || 0} نقطة للمشاركين`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/group-rooms/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/points'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف الغرفة",
        variant: "destructive"
      });
    }
  });

  const requestCount = requests.length;
  const pendingInvitationsCount = pendingInvitations.length;
  const activePrivateRoomsCount = activePrivateRooms.length;
  const availableGroupRoomsCount = availableGroupRooms.length;

  const filteredConversations = conversations.filter((conv: any) => 
    conv.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* No navigation during loading */}
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 md:pb-0 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2"
            >
              {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-bold text-gray-900">{t('messages.title')}</h1>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="mb-6">
          
          {/* Organized button sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Regular Messages Section */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-700 mb-3 text-center">{t('messages.conversations')}</h3>
              <div className="space-y-2">
                <Link href="/messages/new-chat" className="block">
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                    <MessageCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('messages.new_message')}
                  </Button>
                </Link>
                <Link href="/messages/requests" className="block">
                  <Button variant="outline" className="w-full text-purple-600 border-purple-600 hover:bg-purple-50">
                    {t('messages.requests')}
                    <Badge className={`${isRTL ? 'ml-2' : 'mr-2'} bg-purple-600 text-white`}>
                      {requestCount}
                    </Badge>
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Premium Rooms Section */}
            <Card className="p-4 relative">
              <h3 className="font-bold text-gray-700 mb-3 text-center">الغرف المدفوعة</h3>
              {/* Active rooms indicator */}
              {(activePrivateRoomsCount > 0 || availableGroupRoomsCount > 0 || pendingInvitationsCount > 0) && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-ping">
                  <div className="absolute bg-yellow-500 rounded-full w-6 h-6"></div>
                  <div className="relative">🔥</div>
                </div>
              )}
              <div className="space-y-2">
                <Link href="/create-private-room" className="block">
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 relative">
                    <Crown className="w-4 h-4 ml-1" />
                    غرفة خاصة (1 على 1)
                    {activePrivateRoomsCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {activePrivateRoomsCount}
                      </div>
                    )}
                  </Button>
                </Link>
                <Link href="/browse-group-rooms" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 relative">
                    <Users className="w-4 h-4 ml-1" />
                    تصفح الغرف الجماعية
                    {availableGroupRoomsCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-blue-400 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                        {availableGroupRoomsCount}
                      </div>
                    )}
                  </Button>
                </Link>
                <Link href="/create-group-room" className="block">
                  <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-600/20">
                    إنشاء غرفة جماعية
                  </Button>
                </Link>
                <Link href="/room-invitations" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 relative">
                    <Gift className="w-4 h-4 ml-1" />
                    دعوات الغرف الخاصة
                    {pendingInvitationsCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {pendingInvitationsCount}
                      </div>
                    )}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="البحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Active Rooms Status Section */}
        {(activePrivateRoomsCount > 0 || availableGroupRoomsCount > 0 || pendingInvitationsCount > 0) && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mb-4">
            <CardContent className="p-4">
              <h3 className="font-bold text-yellow-800 mb-3 text-center flex items-center justify-center">
                🔥 نشاط الغرف المدفوعة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {activePrivateRoomsCount > 0 && (
                  <div className="bg-green-100 rounded-lg p-3 text-center">
                    <div className="font-bold text-green-800">غرف خاصة نشطة</div>
                    <div className="text-2xl font-bold text-green-600">{activePrivateRoomsCount}</div>
                    <div className="text-green-700">جلسات 1 على 1</div>
                  </div>
                )}
                {availableGroupRoomsCount > 0 && (
                  <div className="bg-blue-100 rounded-lg p-3 text-center">
                    <div className="font-bold text-blue-800">غرف جماعية متاحة</div>
                    <div className="text-2xl font-bold text-blue-600">{availableGroupRoomsCount}</div>
                    <div className="text-blue-700">يمكن الانضمام إليها</div>
                  </div>
                )}
                {pendingInvitationsCount > 0 && (
                  <div className="bg-red-100 rounded-lg p-3 text-center">
                    <div className="font-bold text-red-800">دعوات معلقة</div>
                    <div className="text-2xl font-bold text-red-600">{pendingInvitationsCount}</div>
                    <div className="text-red-700">في انتظار الرد</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Private Rooms Management */}
        {activePrivateRooms.length > 0 && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <CardContent className="p-4">
              <h3 className="font-bold text-red-800 mb-3 text-center flex items-center justify-center">
                🗑️ إدارة الغرف الخاصة النشطة
              </h3>
              <div className="space-y-2">
                {activePrivateRooms.map((room: any) => (
                  <div key={room.id} className="bg-white/80 rounded-lg p-3 flex items-center justify-between">
                    <div className="text-right flex-1">
                      <h4 className="font-bold text-gray-800">{room.title}</h4>
                      <p className="text-sm text-gray-600">{room.description || "غرفة خاصة"}</p>
                      <p className="text-xs text-gray-500">تم الإنشاء: {new Date(room.createdAt).toLocaleString('ar')}</p>
                    </div>
                    <Button
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذه الغرفة؟ سيتم حذف جميع البيانات المرتبطة بها.")) {
                          deletePrivateRoomMutation.mutate(room.id);
                        }
                      }}
                      disabled={deletePrivateRoomMutation.isPending}
                      variant="destructive"
                      size="sm"
                      className="mr-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletePrivateRoomMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User's Group Rooms Management */}
        {availableGroupRooms.filter((room: any) => room.hostId === user?.id).length > 0 && (
          <Card className="bg-blue-50 border-blue-200 mb-4">
            <CardContent className="p-4">
              <h3 className="font-bold text-blue-800 mb-3 text-center flex items-center justify-center">
                🗑️ إدارة الغرف الجماعية
              </h3>
              <div className="space-y-2">
                {availableGroupRooms.filter((room: any) => room.hostId === user?.id).map((room: any) => (
                  <div key={room.id} className="bg-white/80 rounded-lg p-3 flex items-center justify-between">
                    <div className="text-right flex-1">
                      <h4 className="font-bold text-gray-800">{room.title}</h4>
                      <p className="text-sm text-gray-600">{room.description || "غرفة جماعية"}</p>
                      <p className="text-xs text-blue-600">
                        المشاركين: {room.currentParticipants}/{room.maxParticipants} | 
                        السعر: {room.entryPrice} نقطة
                      </p>
                      <p className="text-xs text-gray-500">
                        تنتهي في: {new Date(room.roomEndsAt).toLocaleString('ar')}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف هذه الغرفة؟ سيتم استرداد ${room.entryPrice * (room.currentParticipants - 1)} نقطة للمشاركين.`)) {
                          deleteGroupRoomMutation.mutate(room.id);
                        }
                      }}
                      disabled={deleteGroupRoomMutation.isPending}
                      variant="destructive"
                      size="sm"
                      className="mr-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleteGroupRoomMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversations List */}
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-800 text-center">المحادثات النشطة</h2>
          </CardHeader>
          <CardContent>
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد محادثات حالياً</p>
                <p className="text-gray-400 text-sm mt-2">ابدأ محادثة جديدة لتظهر هنا</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conversation: any) => (
                  <Link key={conversation.id} href={`/messages/chat/${conversation.otherUser.id}`}>
                    <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${
                      conversation.unreadCount > 0 
                        ? 'border-l-red-500 bg-red-50 hover:bg-red-100' 
                        : 'border-l-gray-200 hover:bg-gray-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            {/* Profile Image */}
                            <div className="relative">
                              <img
                                src={conversation.otherUser.profileImageUrl || '/uploads/default-avatar.png'}
                                alt={conversation.otherUser.username}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                              {conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </div>
                              )}
                            </div>
                            
                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <h3 className={`font-semibold truncate ${
                                  conversation.unreadCount > 0 ? 'text-red-800' : 'text-gray-800'
                                }`}>
                                  {conversation.otherUser.firstName || conversation.otherUser.username}
                                </h3>
                                <span className="text-sm text-gray-500">@{conversation.otherUser.username}</span>
                                {conversation.unreadCount > 0 && (
                                  <UserCheck className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              
                              {/* Last Message */}
                              <p className={`text-sm truncate mt-1 ${
                                conversation.unreadCount > 0 ? 'text-red-700 font-medium' : 'text-gray-600'
                              }`}>
                                {conversation.lastMessage || 'لا توجد رسائل'}
                              </p>
                              
                              {/* Time */}
                              <div className="flex items-center space-x-1 space-x-reverse mt-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {conversation.lastMessageAt 
                                    ? new Date(conversation.lastMessageAt).toLocaleString('ar', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'غير معروف'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white animate-pulse">
                                جديد
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-pink-600 hover:from-pink-100 hover:to-purple-100"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedUserForGift(conversation.otherUser);
                                setShowGiftShop(true);
                              }}
                            >
                              <Gift className="w-4 h-4" />
                            </Button>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Gift Shop Modal */}
      {showGiftShop && selectedUserForGift && (
        <GiftShop
          isOpen={showGiftShop}
          onClose={() => {
            setShowGiftShop(false);
            setSelectedUserForGift(null);
          }}
          receiverId={selectedUserForGift.id}
          receiverName={selectedUserForGift.firstName || selectedUserForGift.username}
          onGiftSent={(gift) => {
            console.log('Gift sent:', gift);
          }}
        />
      )}
      
      <BottomNavigation />
    </div>
  );
}