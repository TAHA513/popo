import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User, 
  Plus,
  Users,
  MessageCircle,
  Gift,
  Wallet,
  UserPlus,
  UserMinus,
  Settings,
  Heart,
  Camera,
  Video,
  Star,
  Trophy,
  TrendingUp,
  Upload
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { OnlineStatus } from "@/components/online-status";
import { Link, useParams, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import MemoryCard from "@/components/memory-card";

export default function ProfileRedesign() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const params = useParams();
  const userId = params.userId;
  const profileUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const [activeTab, setActiveTab] = useState<"memories" | "stats">("memories");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Image upload refs
  const profileImageRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  // Fetch profile user data
  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Fetch user memories
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/user', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/memories/user/${profileUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Check if following
  const { data: isFollowing = false } = useQuery({
    queryKey: ['/api/users/following', profileUserId],
    enabled: !!currentUser && !!profileUserId && profileUserId !== currentUser?.id,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/follow-status`, {
        credentials: 'include'
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.isFollowing;
    }
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to follow/unfollow');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/following', profileUserId] });
      toast({
        title: data.message || (data.isFollowing ? "تم المتابعة بنجاح" : "تم إلغاء المتابعة"),
        description: data.isFollowing ? "أصبحت تتابع هذا المستخدم" : "لم تعد تتابع هذا المستخدم"
      });
    }
  });

  // Fetch followers and following
  const { data: followers = [] } = useQuery({
    queryKey: ['/api/users/followers', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/followers`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: following = [] } = useQuery({
    queryKey: ['/api/users/following', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/following`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const handleFollowToggle = () => {
    followMutation.mutate();
  };

  // Image upload mutations
  const profileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) throw new Error('فشل في رفع الصورة');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', profileUserId] });
      toast({
        title: "تم تحديث الصورة الشخصية",
        description: "تم رفع صورتك الشخصية بنجاح"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفع الصورة",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive"
      });
    }
  });

  const coverImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/cover-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) throw new Error('فشل في رفع صورة الغلاف');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', profileUserId] });
      toast({
        title: "تم تحديث صورة الغلاف",
        description: "تم رفع صورة الغلاف بنجاح"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفع صورة الغلاف",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive"
      });
    }
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      profileImageMutation.mutate(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Cover image change event triggered!', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('Cover file selected:', { name: file.name, size: file.size });
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      console.log('Starting cover image mutation...');
      coverImageMutation.mutate(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h2>
            <Button onClick={() => setLocation("/login")} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      {/* Profile Header Card */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
            {/* Cover Image */}
            <div className="h-32 rounded-t-lg relative overflow-hidden">
              {profileUser?.coverImageUrl ? (
                <img 
                  src={profileUser.coverImageUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
              )}
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-4 right-4">
                {isOwnProfile && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                    onClick={() => {
                      console.log('Cover button clicked!', { coverImageRef: coverImageRef.current });
                      coverImageRef.current?.click();
                    }}
                    disabled={coverImageMutation.isPending}
                  >
                    {coverImageMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
                    ) : (
                      <Camera className="w-4 h-4 ml-1" />
                    )}
                    {coverImageMutation.isPending ? "جاري الرفع..." : "تغيير الغلاف"}
                  </Button>
                )}
                {/* Debug info */}
                <div className="absolute -bottom-8 right-0 text-xs text-black bg-white px-2 py-1 rounded">
                  {isOwnProfile ? 'Own Profile' : 'Not Own'} | User: {currentUser?.id} | Profile: {profileUserId}
                </div>
              </div>
              {/* Hidden file input for cover image */}
              <input
                ref={coverImageRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />
            </div>
            
            <CardContent className="p-6 -mt-16 relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                      {profileUser?.profileImageUrl ? (
                        <img 
                          src={profileUser.profileImageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                          <User className="w-16 h-16 text-purple-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <OnlineStatus 
                    userId={profileUserId || ''} 
                    className="absolute -bottom-1 -right-1 border-4 border-white"
                  />
                  {isOwnProfile && (
                    <Button 
                      size="sm" 
                      className="absolute bottom-0 left-0 rounded-full w-8 h-8 p-0 bg-purple-500 hover:bg-purple-600"
                      onClick={() => profileImageRef.current?.click()}
                      disabled={profileImageMutation.isPending}
                    >
                      {profileImageMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {/* Hidden file input for profile image */}
                  <input
                    ref={profileImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-right">
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    {profileUser?.firstName || profileUser?.username || 'مستخدم'}
                  </h1>
                  <p className="text-purple-600 font-medium mb-2">@{profileUser?.username}</p>
                  <p className="text-gray-600 text-sm mb-4 max-w-md">
                    {profileUser?.bio || 'مرحباً بكم في ملفي الشخصي'}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-center md:justify-start gap-6 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="font-bold">{memories.length}</span>
                      <span className="text-gray-600">منشور</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-bold">{followers.length}</span>
                      <span className="text-gray-600">متابع</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserPlus className="w-4 h-4 text-green-500" />
                      <span className="font-bold">{following.length}</span>
                      <span className="text-gray-600">يتابع</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 min-w-[140px]">
                  {isOwnProfile ? (
                    <>
                      <Button 
                        onClick={() => setLocation('/create-memory')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إنشاء ذكرى
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => setLocation('/followers-management')}
                          size="sm"
                        >
                          <Users className="w-4 h-4 ml-1" />
                          المتابعين
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setLocation('/wallet')}
                          size="sm"
                        >
                          <Wallet className="w-4 h-4 ml-1" />
                          المحفظة
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleFollowToggle}
                        disabled={followMutation.isPending}
                        className={`transition-all duration-300 ${
                          isFollowing 
                            ? 'bg-green-500 hover:bg-red-500 text-white' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 ml-2" />
                            {followMutation.isPending ? "جاري الإلغاء..." : "متابع ✓"}
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 ml-2" />
                            {followMutation.isPending ? "جاري المتابعة..." : "متابعة"}
                          </>
                        )}
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => setShowMessageDialog(true)}
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4 ml-1" />
                          رسالة
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowGiftDialog(true)}
                          size="sm"
                        >
                          <Gift className="w-4 h-4 ml-1" />
                          هدية
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={activeTab === "memories" ? "default" : "ghost"}
              onClick={() => setActiveTab("memories")}
              className={activeTab === "memories" ? "bg-purple-500 text-white" : ""}
            >
              <Heart className="w-4 h-4 ml-2" />
              المنشورات
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "ghost"}
              onClick={() => setActiveTab("stats")}
              className={activeTab === "stats" ? "bg-purple-500 text-white" : ""}
            >
              <TrendingUp className="w-4 h-4 ml-2" />
              الإحصائيات
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "memories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memoriesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : memories.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {isOwnProfile ? "لا توجد منشورات" : "لا توجد منشورات لهذا المستخدم"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {isOwnProfile ? "ابدأ بإنشاء أول منشور لك" : "لم ينشر هذا المستخدم أي محتوى بعد"}
                </p>
                {isOwnProfile && (
                  <Button onClick={() => setLocation('/create-memory')}>
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء منشور جديد
                  </Button>
                )}
              </div>
            ) : (
              memories.map((memory: any) => (
                <MemoryCard 
                  key={memory.id} 
                  memory={memory} 
                />
              ))
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">النقاط</h3>
                <p className="text-2xl font-bold text-purple-600">{profileUser?.points || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">التقييم</h3>
                <p className="text-2xl font-bold text-orange-600">4.5/5</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">الأرباح</h3>
                <p className="text-2xl font-bold text-green-600">${profileUser?.totalEarnings || '0.00'}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال رسالة</DialogTitle>
            <DialogDescription>
              أرسل رسالة خاصة إلى {profileUser?.firstName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="اكتب رسالتك هنا..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={() => {
                  setLocation(`/messages/${profileUserId}`);
                  setShowMessageDialog(false);
                }}
              >
                إرسال
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}