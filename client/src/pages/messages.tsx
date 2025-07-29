import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, Send, ArrowRight } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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
    refetchInterval: 5000 // تحديث كل 5 ثوان
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

  const requestCount = requests.length;

  const filteredConversations = conversations.filter((conv: any) => 
    conv.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">الرسائل</h1>
            <div className="flex gap-2">
              <Link href="/messages/new-chat">
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                  غرفة دردشة جديدة
                </Button>
              </Link>
              <Link href="/messages/requests">
                <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                  طلبات الرسائل
                  <Badge className="mr-2 bg-purple-600 text-white">
                    {requestCount}
                  </Badge>
                </Button>
              </Link>
            </div>
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

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد محادثات</h3>
            <p className="text-gray-500">ابدأ محادثة جديدة من خلال زيارة ملف شخصي وإرسال رسالة</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation: any) => (
              <Link key={conversation.id} href={`/messages/${conversation.otherUser.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
                          {conversation.otherUser.profileImageUrl ? (
                            <img 
                              src={conversation.otherUser.profileImageUrl} 
                              alt={conversation.otherUser.username} 
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <MessageCircle className="w-6 h-6" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">
                              {conversation.otherUser.username}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-purple-600 text-white">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {conversation.lastMessage || 'ابدأ محادثة جديدة'}
                          </p>
                          
                          <p className="text-xs text-gray-400 mt-1">
                            {conversation.lastMessageAt ? 
                              new Date(conversation.lastMessageAt).toLocaleDateString('ar') : 
                              'لا توجد رسائل'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
}