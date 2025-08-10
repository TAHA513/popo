import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageCircle, Gift } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EnhancedGiftModal } from "@/components/enhanced-gift-modal";
import { useToast } from "@/hooks/use-toast";

export default function ConversationPage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-600">يجب تسجيل الدخول أولاً</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [newMessage, setNewMessage] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch messages for this conversation
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/messages/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!userId
  });

  // Fetch other user info
  const { data: otherUser } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('/api/messages/send', 'POST', { 
        recipientId: userId, 
        content 
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when opening conversation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/messages/${userId}/read`, 'PUT', {});
    },
    onSuccess: () => {
      // تحديث الإشعارات والمحادثات فوراً بعد القراءة
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${userId}`] });
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    }
  });

  useEffect(() => {
    if (userId && !markAsReadMutation.isPending) {
      markAsReadMutation.mutate();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-500">خطأ: لم يتم العثور على المستخدم</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse max-w-4xl mx-auto">
          <Link href="/messages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
            {otherUser?.profileImageUrl ? (
              <img 
                src={otherUser.profileImageUrl} 
                alt={otherUser.username} 
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">
              {otherUser?.firstName || otherUser?.username}
            </h1>
            <p className="text-sm text-gray-500">@{otherUser?.username}</p>
          </div>
          
          {/* Gift button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGiftModal(true)}
            className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-pink-600 hover:from-pink-100 hover:to-purple-100"
          >
            <Gift className="w-4 h-4 ml-1" />
            هدية
          </Button>
        </div>
      </div>

      {/* Messages */}
      <main className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="h-[calc(100vh-200px)] overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد رسائل بعد. ابدأ المحادثة!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user?.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.senderId === user?.id ? 'text-purple-100' : 'text-gray-400'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString('ar', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {/* Read receipt indicator for sent messages */}
                      {message.senderId === user?.id && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          message.isRead 
                            ? 'bg-green-500/30 text-green-100 border-2 border-green-400' 
                            : 'bg-blue-500/30 text-blue-100 border-2 border-blue-400'
                        }`}>
                          <span className="text-sm font-bold">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                          <span className="font-medium">
                            {message.isRead ? 'مقروءة' : 'مرسلة'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex space-x-2 rtl:space-x-reverse">
          <Input
            type="text"
            placeholder="اكتب رسالتك..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </main>

      <BottomNavigation />

      {/* Enhanced Gift Modal */}
      {otherUser && (
        <EnhancedGiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          receiverId={userId || ''}
          receiverName={otherUser.username || otherUser.firstName || 'مستخدم'}
          onGiftSent={(gift) => {
            toast({
              title: "تم إرسال الهدية!",
              description: `تم إرسال ${gift.name} إلى ${otherUser.username || otherUser.firstName}`,
            });
          }}
        />
      )}
    </div>
  );
}