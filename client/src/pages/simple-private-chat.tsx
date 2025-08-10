import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: number;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  senderInfo: {
    id: string;
    username: string;
    firstName: string;
    profileImageUrl?: string;
  };
}

export default function SimplePrivateChatPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // استخراج معرف المستخدم من الرابط
  const otherUserId = location.split('/messages/')[1];
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState("");

  // التحقق من وجود معرف المستخدم
  if (!otherUserId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <Card className="border-2 border-red-200 bg-red-50 max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold text-red-700 mb-2">خطأ في الرابط</h3>
              <p className="text-red-600 mb-4">معرف المستخدم غير صحيح</p>
              <Button 
                onClick={() => setLocation('/messages')}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                العودة للرسائل
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // جلب معلومات المستخدم الآخر
  const { data: otherUser } = useQuery({
    queryKey: [`/api/users/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في جلب معلومات المستخدم');
      return response.json();
    }
  });

  // جلب الرسائل
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/messages/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل في جلب الرسائل');
      return response.json();
    },
    refetchInterval: 2000 // تحديث كل 2 ثوان
  });

  // إرسال رسالة نصية
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      console.log('📤 محاولة إرسال رسالة:', { otherUserId, content, user: user?.id });
      
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      try {
        // إرسال الطلب مباشرة باستخدام fetch
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            recipientId: otherUserId,
            content,
            messageType: 'text'
          })
        });
        
        console.log('📡 استجابة الخادم:', { status: response.status, statusText: response.statusText });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ خطأ في الاستجابة:', errorText);
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ تم إرسال الرسالة بنجاح:', result);
        return result;
      } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        if (error instanceof Error && error.message?.includes('401')) {
          throw new Error('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ نجح الإرسال، تحديث البيانات...');
      setNewMessage("");
      
      // تحديث الرسائل بالرسالة الصحيحة من الخادم
      queryClient.setQueryData([`/api/messages/${otherUserId}`], (oldData: any) => {
        if (oldData && Array.isArray(oldData)) {
          // إزالة الرسائل المؤقتة وإضافة الرسالة الحقيقية
          const realMessages = oldData.filter(msg => typeof msg.id === 'number' && msg.id < 1000000000000);
          return [...realMessages, data];
        }
        return [data];
      });
      
      // تحديث البيانات من الخادم
      setTimeout(() => refetchMessages(), 500);
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error) => {
      console.error('❌ فشل إرسال الرسالة:', error);
      alert(`خطأ في إرسال الرسالة: ${error.message}`);
    }
  });

  // تحديث الإشعارات عند فتح المحادثة
  useEffect(() => {
    if (otherUserId && messages.length > 0) {
      const markAsRead = async () => {
        try {
          console.log(`📖 تحديد رسائل المحادثة كمقروءة من المستخدم: ${otherUserId}`);
          const response = await fetch(`/api/messages/${otherUserId}/read`, {
            method: 'PUT',
            credentials: 'include',
          });
          
          if (response.ok) {
            console.log('✅ تم تحديد الرسائل كمقروءة بنجاح');
            // تحديث عداد الإشعارات فوراً
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
            // تحديث الرسائل لإظهار حالة القراءة
            setTimeout(() => refetchMessages(), 100);
          }
        } catch (error) {
          console.error('❌ خطأ في تحديد الرسائل كمقروءة:', error);
        }
      };
      markAsRead();
    }
  }, [otherUserId, messages.length, queryClient, refetchMessages]);

  // التمرير لأسفل عند تغيير الرسائل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageText = newMessage.trim();
      
      // إضافة الرسالة فوراً للواجهة (optimistic update)
      const tempMessage = {
        id: Date.now(), // temporary ID
        senderId: user?.id || '',
        recipientId: otherUserId || '',
        content: messageText,
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        senderInfo: {
          id: user?.id || '',
          username: user?.username || '',
          firstName: user?.firstName || '',
          profileImageUrl: user?.profileImageUrl || ''
        }
      };
      
      // تحديث فوري للواجهة
      queryClient.setQueryData([`/api/messages/${otherUserId}`], (oldData: any) => {
        if (oldData && Array.isArray(oldData)) {
          return [...oldData, tempMessage];
        }
        return [tempMessage];
      });
      
      sendMessage.mutate(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // التمرير للأسفل عند وصول رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Chat Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/messages')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
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
                
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {otherUser?.username || 'جاري التحميل...'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {otherUser?.firstName || ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Container */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>لا توجد رسائل بعد</p>
                  <p className="text-sm">ابدأ المحادثة بإرسال رسالة</p>
                </div>
              ) : (
                messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`text-xs mt-1 flex items-center justify-between ${
                        message.senderId === user?.id ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        <span>
                          {new Date(message.createdAt).toLocaleTimeString('ar', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.senderId === user?.id && (
                          <span className="mr-2">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Input
                type="text"
                placeholder="اكتب رسالتك هنا..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={sendMessage.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessage.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}