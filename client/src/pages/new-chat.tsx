import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Search, UserPlus, MessageCircle } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  profileImageUrl?: string;
  isOnline?: boolean;
}

export default function NewChatPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // البحث عن المستخدمين
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('فشل البحث عن المستخدمين');
      return response.json();
    },
    enabled: searchQuery.length > 0
  });

  // إنشاء محادثة جديدة
  const createConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await apiRequest('/api/conversations/create', 'POST', {
        otherUserId
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      setLocation(`/chat/${data.id}`);
    }
  });

  const handleStartChat = async (otherUser: User) => {
    try {
      await createConversation.mutateAsync(otherUser.id);
    } catch (error) {
      alert('فشل في إنشاء المحادثة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">إنشاء غرفة دردشة جديدة</h1>
          <p className="text-gray-600 mb-6">ابحث عن صديق لبدء محادثة خاصة معه</p>
          
          {/* شريط البحث */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن اسم المستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-12 py-3 text-lg border-2 border-purple-200 focus:border-purple-500 rounded-xl"
            />
          </div>
        </div>

        {/* نتائج البحث */}
        {searchQuery && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">جاري البحث...</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">نتائج البحث</h3>
                {searchResults.map((searchUser: User) => (
                  <Card key={searchUser.id} className="border-2 border-purple-100 hover:border-purple-300 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <Avatar className="w-12 h-12">
                            {searchUser.profileImageUrl ? (
                              <img src={searchUser.profileImageUrl} alt={searchUser.username} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                                {searchUser.username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-800">@{searchUser.username}</h4>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${searchUser.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm text-gray-500">
                                {searchUser.isOnline ? 'متصل الآن' : 'غير متصل'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleStartChat(searchUser)}
                          disabled={createConversation.isPending || searchUser.id === user?.id}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                        >
                          {createConversation.isPending ? (
                            'جاري الإنشاء...'
                          ) : searchUser.id === user?.id ? (
                            'أنت'
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4 ml-2" />
                              بدء المحادثة
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
                  <p className="text-gray-500">لم نجد أي مستخدم بهذا الاسم. جرب البحث بكلمات أخرى.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* رسالة ترحيبية عند عدم وجود بحث */}
        {!searchQuery && (
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">ابدأ بالبحث</h3>
              <p className="text-gray-600 mb-4">اكتب اسم المستخدم في الحقل أعلاه للعثور على الأصدقاء وبدء محادثات جديدة</p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span className="bg-purple-100 px-3 py-1 rounded-full">نصائح البحث:</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">استخدم اسم المستخدم كاملاً</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">البحث حساس للأحرف</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}