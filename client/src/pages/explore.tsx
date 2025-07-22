import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MemoryCard from "@/components/memory-card";
import SimpleNavigation from "@/components/simple-navigation";
import {
  Search,
  Users,
  Heart,
  UserPlus,
  UserMinus,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  Eye,
  TrendingUp,
  Star,
  Compass,
  Grid3X3,
  Network,
  Zap,
  Globe,
  Timer,
  Crown,
  Flame
} from "lucide-react";

type ExploreMode = 'network' | 'trending' | 'nearby' | 'timeline' | 'energy';

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [exploreMode, setExploreMode] = useState<ExploreMode>('network');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnergy, setSelectedEnergy] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Fetch public memories
  const { data: publicMemories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/public', exploreMode, selectedEnergy],
    refetchInterval: 30000,
  });

  // Fetch suggested users to follow
  const { data: suggestedUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/suggested'],
  });

  // Type-safe arrays
  const typedMemories = (publicMemories as any[]);
  const typedUsers = (suggestedUsers as any[]);

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      return await apiRequest('POST', `/api/users/${userId}/${action}`);
    },
    onSuccess: (_, { action, userId }) => {
      toast({
        title: action === 'follow' ? "تمت المتابعة!" : "تم إلغاء المتابعة",
        description: action === 'follow' ? "أضيف المستخدم لقائمة الأصدقاء" : "تم إزالة المستخدم من الأصدقاء",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/suggested'] });
    },
  });

  const handleFollow = (userId: string, isFollowing: boolean) => {
    followMutation.mutate({
      userId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  const handleMemoryInteraction = async (memoryId: number, type: string) => {
    try {
      await apiRequest('POST', `/api/memories/${memoryId}/interact`, { type });
      
      const messages = {
        like: "تم الإعجاب! ❤️",
        view: "تم عرض الذكرى",
        share: "تم نسخ الرابط للمشاركة",
        gift: "تم إرسال هدية!"
      };
      
      toast({
        title: messages[type as keyof typeof messages] || "تم التفاعل",
        description: "طاقة الذكرى تزداد بتفاعلك",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    } catch (error) {
      toast({
        title: "خطأ في التفاعل",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const renderExploreContent = () => {
    switch (exploreMode) {
      case 'network':
        return (
          <div className="space-y-8">
            {/* Network Visualization Concept */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-purple-800">
                  <Network className="w-6 h-6 mr-2" />
                  شبكة الذكريات المترابطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-700 mb-4">
                  اكتشف الذكريات المترابطة من خلال شبكة الأصدقاء والاهتمامات المشتركة
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typedMemories.slice(0, 6).map((memory: any) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      isOwner={memory.authorId === user?.id}
                      onLike={() => handleMemoryInteraction(memory.id, 'like')}
                      onComment={() => handleMemoryInteraction(memory.id, 'view')}
                      onShare={() => handleMemoryInteraction(memory.id, 'share')}
                      onSendGift={() => handleMemoryInteraction(memory.id, 'gift')}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'trending':
        return (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-orange-800">
                  <TrendingUp className="w-6 h-6 mr-2" />
                  الذكريات الرائجة الآن
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700 mb-4">
                  أشهر الذكريات التي تحصل على أكثر تفاعل وطاقة
                </p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedMemories.map((memory: any) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isOwner={memory.authorId === user?.id}
                  onLike={() => handleMemoryInteraction(memory.id, 'like')}
                  onComment={() => handleMemoryInteraction(memory.id, 'view')}
                  onShare={() => handleMemoryInteraction(memory.id, 'share')}
                  onSendGift={() => handleMemoryInteraction(memory.id, 'gift')}
                />
              ))}
            </div>
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-blue-800">
                  <Zap className="w-6 h-6 mr-2" />
                  ذكريات بحسب مستوى الطاقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 mb-4">
                  اكتشف الذكريات حسب طاقتها - من العابرة إلى الأسطورية
                </p>
                
                {/* Energy Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { key: 'all', label: 'الكل', color: 'bg-gray-100 text-gray-800' },
                    { key: 'high', label: 'طاقة عالية', color: 'bg-green-100 text-green-800' },
                    { key: 'medium', label: 'طاقة متوسطة', color: 'bg-yellow-100 text-yellow-800' },
                    { key: 'low', label: 'طاقة منخفضة', color: 'bg-red-100 text-red-800' }
                  ].map((filter) => (
                    <Button
                      key={filter.key}
                      variant={selectedEnergy === filter.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEnergy(filter.key as any)}
                      className={selectedEnergy === filter.key ? '' : filter.color}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedMemories.map((memory: any) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isOwner={memory.authorId === user?.id}
                  onLike={() => handleMemoryInteraction(memory.id, 'like')}
                  onComment={() => handleMemoryInteraction(memory.id, 'view')}
                  onShare={() => handleMemoryInteraction(memory.id, 'share')}
                  onSendGift={() => handleMemoryInteraction(memory.id, 'gift')}
                />
              ))}
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-purple-800">
                  <Clock className="w-6 h-6 mr-2" />
                  الخط الزمني للذكريات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-700 mb-4">
                  تصفح الذكريات بترتيب زمني ومشاهدة تطور المحتوى
                </p>
              </CardContent>
            </Card>

            {/* Timeline View */}
            <div className="space-y-8">
              {typedMemories.map((memory: any, index: number) => (
                <div key={memory.id} className="flex items-start space-x-4 rtl:space-x-reverse">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                    {index < typedMemories.length - 1 && (
                      <div className="w-0.5 h-24 bg-purple-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <MemoryCard
                      memory={memory}
                      isOwner={memory.authorId === user?.id}
                      onLike={() => handleMemoryInteraction(memory.id, 'like')}
                      onComment={() => handleMemoryInteraction(memory.id, 'view')}
                      onShare={() => handleMemoryInteraction(memory.id, 'share')}
                      onSendGift={() => handleMemoryInteraction(memory.id, 'gift')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Compass className="w-10 h-10 mr-3 text-purple-600" />
            استكشف العالم
            <Globe className="w-10 h-10 ml-3 text-blue-600" />
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            اكتشف ذكريات رائعة من مبدعين حول العالم بطرق مبتكرة ومختلفة تماماً عن المنصات التقليدية
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن ذكريات، مستخدمين أو مواضيع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 text-lg rounded-full border-2 border-purple-200 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Explore Mode Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { key: 'network', label: 'الشبكة المترابطة', icon: Network, color: 'from-purple-600 to-pink-600' },
            { key: 'trending', label: 'الرائج الآن', icon: TrendingUp, color: 'from-orange-600 to-red-600' },
            { key: 'energy', label: 'حسب الطاقة', icon: Zap, color: 'from-blue-600 to-cyan-600' },
            { key: 'timeline', label: 'الخط الزمني', icon: Clock, color: 'from-purple-600 to-indigo-600' },
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <Button
                key={mode.key}
                variant={exploreMode === mode.key ? "default" : "outline"}
                size="lg"
                onClick={() => setExploreMode(mode.key as ExploreMode)}
                className={exploreMode === mode.key 
                  ? `bg-gradient-to-r ${mode.color} text-white border-0` 
                  : 'border-2 hover:bg-gray-50'
                }
              >
                <Icon className="w-5 h-5 mr-2" />
                {mode.label}
              </Button>
            );
          })}
        </div>

        {/* Suggested Users to Follow */}
        {exploreMode === 'network' && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-green-800">
                <Users className="w-6 h-6 mr-2" />
                مبدعون قد تعجبك متابعتهم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typedUsers.slice(0, 6).map((suggestedUser: any) => (
                  <Card key={suggestedUser.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Link href={`/user/${suggestedUser.id}`}>
                        {suggestedUser.profileImageUrl ? (
                          <img
                            src={suggestedUser.profileImageUrl}
                            alt={suggestedUser.firstName || suggestedUser.username}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <Link href={`/user/${suggestedUser.id}`} className="hover:text-purple-600 transition-colors">
                          <h3 className="font-semibold text-gray-800 cursor-pointer">
                            {suggestedUser.firstName || suggestedUser.username}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600">
                          {suggestedUser.totalMemories || 0} ذكرى
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={suggestedUser.isFollowing ? "outline" : "default"}
                        onClick={() => handleFollow(suggestedUser.id, suggestedUser.isFollowing)}
                        disabled={followMutation.isPending}
                        className={suggestedUser.isFollowing 
                          ? "text-red-600 border-red-300 hover:bg-red-50" 
                          : "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {suggestedUser.isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-1" />
                            إلغاء
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            متابعة
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
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
        ) : typedMemories.length > 0 ? (
          renderExploreContent()
        ) : (
          <Card className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent>
              <Compass className="w-16 h-16 mx-auto text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                لا توجد ذكريات للاستكشاف بعد
              </h3>
              <p className="text-gray-600 mb-6">
                كن أول من ينشئ ذكرى في LaaBoBo Live
              </p>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                onClick={() => window.location.href = '/create-memory'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                أنشئ أول ذكرى
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}