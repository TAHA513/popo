import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, User } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function SimpleMessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  // Fetch conversations - simplified
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string, content: string }) => {
      return apiRequest('/api/messages', 'POST', { receiverId, content });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation.otherUserId,
      content: newMessage.trim()
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h2>
              <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض الرسائل.</p>
              <Button onClick={() => window.location.href = '/login'}>
                تسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  الرسائل
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد محادثات بعد</p>
                      <p className="text-sm">ابدأ محادثة جديدة مع أصدقائك</p>
                    </div>
                  ) : (
                    conversations.map((conv: any) => (
                      <div
                        key={conv.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            {conv.otherUser?.profileImageUrl ? (
                              <img
                                src={conv.otherUser.profileImageUrl}
                                alt={conv.otherUser.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conv.otherUser?.username || 'مستخدم'}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage || 'لا توجد رسائل'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        {selectedConversation.otherUser?.profileImageUrl ? (
                          <img
                            src={selectedConversation.otherUser.profileImageUrl}
                            alt={selectedConversation.otherUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.otherUser?.username || 'مستخدم'}
                        </h3>
                        <p className="text-sm text-gray-500">متصل</p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="text-center text-gray-500 text-sm">
                        <p>بداية المحادثة مع {selectedConversation.otherUser?.username}</p>
                      </div>
                      
                      {/* Sample message */}
                      <div className="flex justify-end">
                        <div className="bg-purple-500 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-xs">
                          <p>مرحباً! كيف حالك؟</p>
                          <p className="text-xs opacity-80 mt-1">منذ 5 دقائق</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">اختر محادثة لبدء المراسلة</p>
                    <p className="text-sm">اختر محادثة من القائمة على اليسار</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}