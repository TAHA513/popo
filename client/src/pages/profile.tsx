import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  MapPin, 
  Calendar, 
  Heart, 
  Eye, 
  Share2, 
  Gift,
  Sparkles,
  Clock,
  Star,
  Settings,
  Plus,
  Grid,
  List,
  Zap,
  TrendingUp,
  Camera
} from "lucide-react";
import NavigationHeader from "@/components/navigation-header";
import { MemoryFragment } from "@shared/schema";
import { useLocation } from "wouter";

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'fleeting' | 'precious' | 'legendary';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMemory, setSelectedMemory] = useState<MemoryFragment | null>(null);

  // Fetch user's memory fragments
  const { data: memories, isLoading: memoriesLoading } = useQuery<MemoryFragment[]>({
    queryKey: ['/api/memories/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats', user?.id],
    enabled: !!user?.id,
  });

  // Memory interaction mutation
  const interactMutation = useMutation({
    mutationFn: async ({ fragmentId, type }: { fragmentId: number; type: string }) => {
      return apiRequest('POST', `/api/memories/${fragmentId}/interact`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories/user'] });
    },
  });

  const filteredMemories = memories?.filter(memory => {
    if (filter === 'all') return true;
    return memory.memoryType === filter;
  }) || [];

  const handleLike = (fragmentId: number) => {
    interactMutation.mutate({ fragmentId, type: 'like' });
  };

  const handleShare = (fragmentId: number) => {
    interactMutation.mutate({ fragmentId, type: 'share' });
    toast({
      title: "تم مشاركة الذكرى",
      description: "تم نسخ رابط الذكرى للحافظة",
    });
  };

  const getEnergyColor = (energy: number) => {
    if (energy > 70) return 'text-green-500';
    if (energy > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryTypeIcon = (type: string) => {
    switch (type) {
      case 'fleeting': return <Clock className="w-4 h-4" />;
      case 'precious': return <Heart className="w-4 h-4" />;
      case 'legendary': return <Star className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const calculateTimeRemaining = (expiresAt: string | null, currentEnergy: number | null) => {
    if (!expiresAt) return 'غير محدد';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'منتهي الصلاحية';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} يوم`;
    if (diffHours > 0) return `${diffHours} ساعة`;
    return 'أقل من ساعة';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">جاري تحميل الملف الشخصي...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 rtl:md:space-x-reverse">
              
              {/* Profile Image */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                  ✨ {user?.role === 'super_admin' ? 'مدير' : user?.role === 'admin' ? 'مشرف' : 'عضو'}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {user?.firstName || user?.lastName ? 
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                      user?.email?.split('@')[0] || 'مستخدم مجهول'
                    }
                  </h1>
                  {user?.isStreamer && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                      <Sparkles className="w-3 h-3 mr-1" />
                      بثاث
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3">{user?.bio || 'لا يوجد وصف متاح'}</p>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>{user?.points || 0} نقطة</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>${user?.totalEarnings || '0.00'} أرباح</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>انضم {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar') : 'غير محدد'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => navigate('/create-memory')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ذكرى جديدة
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  إعدادات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي الذكريات</p>
                  <p className="text-2xl font-bold">{memories?.length || 0}</p>
                </div>
                <Camera className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">إجمالي المشاهدات</p>
                  <p className="text-2xl font-bold">{(userStats as any)?.totalViews || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">إجمالي الإعجابات</p>
                  <p className="text-2xl font-bold">{(userStats as any)?.totalLikes || 0}</p>
                </div>
                <Heart className="w-8 h-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">هدايا مستلمة</p>
                  <p className="text-2xl font-bold">{(userStats as any)?.totalGifts || 0}</p>
                </div>
                <Gift className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Memory Collection */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span>شظايا الذكريات</span>
              </CardTitle>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {/* Filter Buttons */}
                <div className="flex space-x-1 rtl:space-x-reverse">
                  {[
                    { key: 'all', label: 'الكل', icon: Grid },
                    { key: 'fleeting', label: 'عابر', icon: Clock },
                    { key: 'precious', label: 'ثمين', icon: Heart },
                    { key: 'legendary', label: 'أسطوري', icon: Star },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={filter === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(key as FilterType)}
                      className="text-xs"
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-2"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {memoriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  لا توجد ذكريات بعد
                </h3>
                <p className="text-gray-500 mb-4">
                  ابدأ بإنشاء شظايا ذكرياتك الأولى
                </p>
                <Button 
                  onClick={() => navigate('/create-memory')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إنشاء ذكرى جديدة
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredMemories.map((memory) => (
                  <Card 
                    key={memory.id} 
                    className={`group cursor-pointer transition-all hover:shadow-lg border-0 bg-white/90 ${
                      viewMode === 'grid' ? 'aspect-square' : ''
                    }`}
                    onClick={() => setSelectedMemory(memory)}
                  >
                    <CardContent className="p-0">
                      {viewMode === 'grid' ? (
                        // Grid View
                        <div className="relative h-full">
                          {/* Media Preview */}
                          <div className="aspect-square overflow-hidden rounded-t-lg">
                            {memory.thumbnailUrl ? (
                              <img 
                                src={memory.thumbnailUrl} 
                                alt={memory.title || 'Memory'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                                <Camera className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Overlay Info */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                            <div className="flex justify-between items-start">
                              <Badge className="bg-white/20 backdrop-blur-sm">
                                {getMemoryTypeIcon(memory.memoryType)}
                                <span className="ml-1">{memory.memoryType}</span>
                              </Badge>
                              <div className={`text-sm font-medium ${getEnergyColor(memory.currentEnergy)}`}>
                                ⚡ {memory.currentEnergy}%
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-medium truncate">{memory.title}</h3>
                              <div className="flex items-center justify-between text-sm mt-2">
                                <div className="flex space-x-3 rtl:space-x-reverse">
                                  <span className="flex items-center">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {memory.viewCount}
                                  </span>
                                  <span className="flex items-center">
                                    <Heart className="w-3 h-3 mr-1" />
                                    {memory.likeCount}
                                  </span>
                                </div>
                                <span className="text-xs">
                                  ⏰ {calculateTimeRemaining(memory.expiresAt || null, memory.currentEnergy || null)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // List View
                        <div className="flex items-center p-4 space-x-4 rtl:space-x-reverse">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            {memory.thumbnailUrl ? (
                              <img 
                                src={memory.thumbnailUrl} 
                                alt={memory.title || 'Memory'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium truncate">{memory.title}</h3>
                              <div className={`text-sm font-medium ${getEnergyColor(memory.currentEnergy)}`}>
                                ⚡ {memory.currentEnergy}%
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 truncate mb-2">
                              {memory.caption}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex space-x-4 rtl:space-x-reverse">
                                <span className="flex items-center">
                                  <Eye className="w-3 h-3 mr-1" />
                                  {memory.viewCount}
                                </span>
                                <span className="flex items-center">
                                  <Heart className="w-3 h-3 mr-1" />
                                  {memory.likeCount}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {getMemoryTypeIcon(memory.memoryType)}
                                  <span className="ml-1">{memory.memoryType}</span>
                                </Badge>
                              </div>
                              <span>
                                ⏰ {calculateTimeRemaining(memory.expiresAt || null, memory.currentEnergy || null)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}