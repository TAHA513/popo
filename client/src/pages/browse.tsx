import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NavigationHeader from "@/components/navigation-header";
import MemoryCard from "@/components/memory-card";
import { 
  Search, 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Eye
} from "lucide-react";

export default function Browse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("memories");
  const [filterType, setFilterType] = useState("all");
  
  // Fetch all public memories for browsing
  const { data: allMemories = [], isLoading: memoriesLoading, refetch: refetchMemories } = useQuery({
    queryKey: ['/api/memories/browse', filterType],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch suggested users to follow
  const { data: suggestedUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users/suggestions'],
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      return apiRequest('POST', `/api/users/${action}`, { targetUserId: userId });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'follow' ? "تمت المتابعة!" : "تم إلغاء المتابعة",
        description: action === 'follow' ? "ستشاهد منشوراتهم في تدفقك" : "لن تعد ترى منشوراتهم",
      });
      refetchUsers();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المتابعة",
        variant: "destructive",
      });
    }
  });

  // Memory interaction mutations
  const interactMutation = useMutation({
    mutationFn: async ({ memoryId, type }: { memoryId: number; type: string }) => {
      return apiRequest('POST', `/api/memories/${memoryId}/interact`, { type });
    },
    onSuccess: () => {
      refetchMemories();
    }
  });

  const filteredMemories = allMemories.filter((memory: any) => {
    const matchesSearch = !searchQuery || 
      memory.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'fleeting' && memory.memoryType === 'fleeting') ||
      (filterType === 'precious' && memory.memoryType === 'precious') ||
      (filterType === 'legendary' && memory.memoryType === 'legendary');
    
    return matchesSearch && matchesFilter;
  });

  const handleMemoryInteraction = (memoryId: number, type: string) => {
    interactMutation.mutate({ memoryId, type });
    
    const messages = {
      like: "أعجبك هذا! ❤️",
      share: "تم النسخ للمشاركة",
      view: "تمت المشاهدة"
    };
    
    toast({
      title: messages[type as keyof typeof messages] || "تم التفاعل",
      description: "طاقة الذكرى تزداد بتفاعلك معها",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Search className="w-10 h-10 mr-3 text-purple-600" />
            تصفح واستكشف
            <Users className="w-10 h-10 ml-3 text-pink-600" />
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            اكتشف ذكريات مذهلة من المبدعين حول العالم وتابع من يعجبك
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ابحث في الذكريات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-right"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                الكل
              </Button>
              <Button
                variant={filterType === 'fleeting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('fleeting')}
              >
                <Clock className="w-4 h-4 mr-1" />
                عابر
              </Button>
              <Button
                variant={filterType === 'precious' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('precious')}
              >
                <Heart className="w-4 h-4 mr-1" />
                ثمين
              </Button>
              <Button
                variant={filterType === 'legendary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('legendary')}
              >
                <Crown className="w-4 h-4 mr-1" />
                أسطوري
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="memories" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              الذكريات
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              المستخدمون
            </TabsTrigger>
          </TabsList>

          {/* Memories Tab */}
          <TabsContent value="memories">
            {memoriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMemories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMemories.map((memory: any) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    isOwner={memory.authorId === user?.id}
                    onLike={() => handleMemoryInteraction(memory.id, 'like')}
                    onComment={() => {
                      toast({
                        title: "التعليقات قريباً",
                        description: "ميزة التعليقات ستكون متاحة قريباً",
                      });
                    }}
                    onShare={() => handleMemoryInteraction(memory.id, 'share')}
                    onSendGift={() => {
                      toast({
                        title: "إرسال هدية",
                        description: "اختر هدية لهذه الذكرى الجميلة",
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent>
                  <Search className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    لا توجد ذكريات مطابقة
                  </h3>
                  <p className="text-gray-600">
                    جرب البحث عن شيء آخر أو غير الفلاتر
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {usersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse p-6">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : suggestedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedUsers.map((suggestedUser: any) => (
                  <Card key={suggestedUser.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="text-center">
                      {/* User Avatar */}
                      <div className="mb-4">
                        {suggestedUser.profileImageUrl ? (
                          <img
                            src={suggestedUser.profileImageUrl}
                            alt={suggestedUser.firstName || suggestedUser.username}
                            className="w-20 h-20 rounded-full mx-auto object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center">
                            <Users className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {suggestedUser.firstName || suggestedUser.username || 'مستخدم'}
                      </h3>
                      
                      <div className="flex justify-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {suggestedUser.totalViews || 0} مشاهدة
                        </div>
                        <div className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-1" />
                          {suggestedUser.memoriesCount || 0} ذكرى
                        </div>
                      </div>

                      {/* Follow Button */}
                      <Button
                        className={
                          suggestedUser.isFollowed
                            ? "bg-gray-500 hover:bg-gray-600"
                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        }
                        onClick={() => 
                          followMutation.mutate({
                            userId: suggestedUser.id,
                            action: suggestedUser.isFollowed ? 'unfollow' : 'follow'
                          })
                        }
                        disabled={followMutation.isPending}
                        size="sm"
                      >
                        {suggestedUser.isFollowed ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            إلغاء المتابعة
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            متابعة
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    لا يوجد مستخدمون للمتابعة حالياً
                  </h3>
                  <p className="text-gray-600">
                    عد لاحقاً لاكتشاف مبدعين جدد
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}