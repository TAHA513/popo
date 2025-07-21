import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MemoryCard from "@/components/memory-card";
import PrivacySettings from "@/components/privacy-settings";
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
  Camera,
  Shield,
  Lock
} from "lucide-react";
import NavigationHeader from "@/components/navigation-header";

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'fleeting' | 'precious' | 'legendary';

interface MemoryFragment {
  id: string;
  type: string;
  title?: string;
  caption?: string;
  mediaUrls: string[];
  thumbnailUrl?: string;
  currentEnergy: number;
  initialEnergy: number;
  memoryType: 'fleeting' | 'precious' | 'legendary';
  viewCount: number;
  likeCount: number;
  shareCount: number;
  giftCount: number;
  visibilityLevel: 'public' | 'followers' | 'private';
  allowComments: boolean;
  allowSharing: boolean;
  allowGifts: boolean;
  expiresAt: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profileImageUrl?: string;
    firstName?: string;
  };
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // Mock privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    isPrivateAccount: false,
    visibilityLevel: 'public' as 'public' | 'followers' | 'private',
    allowComments: true,
    allowSharing: true,
    allowGifts: true,
    allowDirectMessages: true,
    allowGiftsFromStrangers: true,
  });

  // Mock memory data with enhanced privacy features
  const mockMemories: MemoryFragment[] = [
    {
      id: "1",
      type: "image",
      title: "رحلة إلى الشاطئ",
      caption: "يوم رائع على شاطئ البحر مع الأصدقاء 🌊",
      mediaUrls: ["/api/placeholder/400/300"],
      thumbnailUrl: "/api/placeholder/400/300",
      currentEnergy: 85,
      initialEnergy: 100,
      memoryType: "precious",
      viewCount: 124,
      likeCount: 23,
      shareCount: 5,
      giftCount: 3,
      visibilityLevel: "public",
      allowComments: true,
      allowSharing: true,
      allowGifts: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      author: {
        id: user?.id || "user1",
        username: user?.username || "user",
        firstName: user?.firstName || "مستخدم",
        profileImageUrl: user?.profileImageUrl || undefined
      }
    },
    {
      id: "2",
      type: "video",
      title: "لحظة إبداع",
      caption: "عمل فني جديد في المرسم ✨",
      mediaUrls: ["/api/placeholder/400/300"],
      thumbnailUrl: "/api/placeholder/400/300",
      currentEnergy: 92,
      initialEnergy: 100,
      memoryType: "legendary",
      viewCount: 342,
      likeCount: 67,
      shareCount: 12,
      giftCount: 8,
      visibilityLevel: "followers",
      allowComments: true,
      allowSharing: false,
      allowGifts: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      author: {
        id: user?.id || "user1",
        username: user?.username || "user",
        firstName: user?.firstName || "مستخدم",
        profileImageUrl: user?.profileImageUrl || undefined
      }
    }
  ];

  const memories = mockMemories;
  const memoriesLoading = false;

  const handlePrivacyUpdate = (newSettings: any) => {
    setPrivacySettings(newSettings);
    toast({
      title: "تم تحديث إعدادات الخصوصية",
      description: "تم حفظ تفضيلاتك بنجاح",
    });
  };

  // Mock user stats
  const userStats = {
    totalMemories: memories.length,
    totalViews: memories.reduce((sum, m) => sum + m.viewCount, 0),
    totalLikes: memories.reduce((sum, m) => sum + m.likeCount, 0),
    totalGifts: memories.reduce((sum, m) => sum + m.giftCount, 0),
    followersCount: 245,
    followingCount: 89
  };

  // Memory interaction functions
  const handleLike = (memory: MemoryFragment) => {
    toast({
      title: "أعجبك هذا!",
      description: "تم إضافة إعجابك للذكرى",
    });
  };

  const handleComment = (memory: MemoryFragment) => {
    if (!memory.allowComments) {
      toast({
        title: "التعليقات معطلة",
        description: "صاحب الذكرى لا يسمح بالتعليقات",
        variant: "destructive",
      });
      return;
    }
  };

  const handleShare = (memory: MemoryFragment) => {
    if (!memory.allowSharing) {
      toast({
        title: "المشاركة معطلة",
        description: "صاحب الذكرى لا يسمح بالمشاركة",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "تم مشاركة الذكرى",
      description: "تم نسخ رابط الذكرى للحافظة",
    });
  };

  const handleSendGift = (memory: MemoryFragment) => {
    if (!memory.allowGifts) {
      toast({
        title: "الهدايا معطلة",
        description: "صاحب الذكرى لا يسمح بالهدايا",
        variant: "destructive",
      });
      return;
    }
    window.location.href = '/gifts';
  };

  const handleEditMemory = (memory: MemoryFragment) => {
    setShowPrivacySettings(true);
  };

  const handleDeleteMemory = (memory: MemoryFragment) => {
    toast({
      title: "تم حذف الذكرى",
      description: "تم حذف الذكرى بنجاح",
    });
  };

  const filteredMemories = memories.filter(memory => {
    if (filter === 'all') return true;
    return memory.memoryType === filter;
  });

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
                  onClick={() => window.location.href = '/create-memory'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ذكرى جديدة
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowPrivacySettings(true)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  الخصوصية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <Sparkles className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <h3 className="font-semibold text-lg">{userStats.totalMemories}</h3>
            <p className="text-gray-600 text-sm">ذكريات</p>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <Eye className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-semibold text-lg">{userStats.totalViews}</h3>
            <p className="text-gray-600 text-sm">مشاهدة</p>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <Heart className="w-8 h-8 mx-auto text-red-600 mb-2" />
            <h3 className="font-semibold text-lg">{userStats.totalLikes}</h3>
            <p className="text-gray-600 text-sm">إعجاب</p>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-shadow">
            <Gift className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <h3 className="font-semibold text-lg">{userStats.totalGifts}</h3>
            <p className="text-gray-600 text-sm">هدية</p>
          </Card>
        </div>

        {/* Account Privacy Status */}
        {privacySettings.isPrivateAccount && (
          <Card className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Lock className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">حساب خاص</h3>
                  <p className="text-yellow-700 text-sm">حسابك خاص، يجب على الأشخاص طلب متابعتك لرؤية ذكرياتك</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Memories Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">شظايا الذكريات</h2>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'الكل', icon: Sparkles },
              { key: 'fleeting', label: 'عابر', icon: Clock },
              { key: 'precious', label: 'ثمين', icon: Heart },
              { key: 'legendary', label: 'أسطوري', icon: Star },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(key as FilterType)}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {key !== 'all' && (
                  <Badge variant="secondary" className="ml-1">
                    {memories.filter(m => m.memoryType === key).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Memories Grid/List */}
        {memoriesLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الذكريات...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <Card className="p-12 text-center">
            <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد ذكريات</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'لم تقم بإنشاء أي ذكريات بعد. ابدأ بمشاركة لحظاتك المميزة!'
                : `لا توجد ذكريات من نوع "${filter === 'fleeting' ? 'عابر' : filter === 'precious' ? 'ثمين' : 'أسطوري'}"`
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/create-memory'}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              إنشاء ذكرى جديدة
            </Button>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                isOwner={true}
                onLike={() => handleLike(memory)}
                onComment={() => handleComment(memory)}
                onShare={() => handleShare(memory)}
                onSendGift={() => handleSendGift(memory)}
                onEdit={() => handleEditMemory(memory)}
                onDelete={() => handleDeleteMemory(memory)}
              />
            ))}
          </div>
        )}

        {/* Privacy Settings Dialog */}
        <PrivacySettings
          isOpen={showPrivacySettings}
          onOpenChange={setShowPrivacySettings}
          settings={privacySettings}
          onSave={handlePrivacyUpdate}
        />
      </div>
    </div>
  );
}