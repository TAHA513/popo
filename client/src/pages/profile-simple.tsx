import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User, 
  Sparkles,
  Plus,
  Calendar,
  Zap,
  TrendingUp,
  UserPlus,
  UserMinus,
  Users,
  MessageCircle,
  Gift
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { Link, useParams, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function ProfileSimplePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const userId = params.userId;
  const profileUserId = userId || currentUser?.id;
  const [activeTab, setActiveTab] = useState<"memories" | "followers" | "following">("memories");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Log para debug
  console.log("Profile params:", params);
  console.log("userId from params:", userId);
  console.log("profileUserId:", profileUserId);
  console.log("currentUser:", currentUser);
  
  // All hooks must be called before any conditional returns
  
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
  const { data: memories = [], isLoading: memoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/memories/user', profileUserId],
    enabled: !!profileUserId,
  });
  
  // Check if following
  const { data: isFollowing = false } = useQuery({
    queryKey: ['/api/users/following', profileUserId],
    enabled: !!currentUser && !!profileUserId && profileUserId !== currentUser?.id,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/is-following`, {
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
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to follow/unfollow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/following', profileUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/followers', profileUserId] });
    }
  });
  
  // Fetch available gifts
  const { data: gifts = [] } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: async () => {
      const response = await fetch('/api/gifts/characters', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });
  
  // Fetch followers
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
  
  // Fetch following
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: profileUserId,
          content: messageText
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال طلب المحادثة بنجاح",
      });
      setShowMessageDialog(false);
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل إرسال الرسالة",
        variant: "destructive"
      });
    }
  });

  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGift) throw new Error('Please select a gift');
      const response = await fetch('/api/gifts/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: profileUserId,
          giftCharacterId: selectedGift
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send gift');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الهدية",
        description: "تم إرسال الهدية بنجاح!",
      });
      setShowGiftDialog(false);
      setSelectedGift(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل إرسال الهدية",
        variant: "destructive"
      });
    }
  });

  // Calculate derived values
  const isOwnProfile = currentUser?.id === profileUserId;
  const user = profileUser;
  
  // More debug logs
  console.log("profileUser:", profileUser);
  console.log("isOwnProfile:", isOwnProfile);
  console.log("user data:", user);
  
  // Check if still loading user data - AFTER all hooks
  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <SimpleNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
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
                    {user?.firstName || user?.username || 'مستخدم'}
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
                    <span>انضم في {new Date().toLocaleDateString('ar')}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>{followers.length} متابع</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <UserPlus className="w-4 h-4 text-pink-500" />
                    <span>{following.length} يتابع</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 min-w-[120px]">
                {isOwnProfile ? (
                  <Link href="/create-memory">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إنشاء ذكرى
                    </Button>
                  </Link>
                ) : (
                  <>
                    {currentUser ? (
                      <>
                        <Button
                          onClick={() => followMutation.mutate()}
                          disabled={followMutation.isPending}
                          variant={isFollowing ? "outline" : "default"}
                          className={!isFollowing ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                        >
                          {isFollowing ? (
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
                        <Button
                          onClick={() => setShowMessageDialog(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          رسالة
                        </Button>
                        <Button
                          onClick={() => setShowGiftDialog(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          إرسال هدية
                        </Button>
                      </>
                    ) : (
                      <Link href="/login">
                        <Button className="w-full">
                          تسجيل الدخول للمتابعة
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-0">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("memories")}
                className={`flex-1 py-4 text-center transition-colors ${
                  activeTab === "memories" 
                    ? "border-b-2 border-purple-600 text-purple-600 font-semibold" 
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                المنشورات ({memories.length})
              </button>
              <button
                onClick={() => setActiveTab("followers")}
                className={`flex-1 py-4 text-center transition-colors ${
                  activeTab === "followers" 
                    ? "border-b-2 border-purple-600 text-purple-600 font-semibold" 
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                المتابعون ({followers.length})
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`flex-1 py-4 text-center transition-colors ${
                  activeTab === "following" 
                    ? "border-b-2 border-purple-600 text-purple-600 font-semibold" 
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                يتابع ({following.length})
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Sections */}
        <div className="min-h-[400px]">
          {/* Memories Section */}
          <div style={{display: activeTab === "memories" ? "block" : "none"}}>
            {memories.length === 0 && isOwnProfile ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">لم تقم بإنشاء أي ذكريات بعد</h3>
                <p className="text-gray-600 mb-6">
                  لم تقم بإنشاء أي ذكريات بعد. ابدأ بمشاركة لحظاتك المميزة!
                </p>
                <Link href="/create-memory">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    إنشاء ذكرى جديدة
                  </Button>
                </Link>
              </Card>
            ) : memories.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-600">لا توجد منشورات بعد</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memories.map((memory: any) => (
                  <Card key={memory.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3 relative">
                        {memory.thumbnailUrl && (
                          <img 
                            src={memory.thumbnailUrl} 
                            alt={memory.caption || memory.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                        {!memory.thumbnailUrl && memory.mediaUrls && memory.mediaUrls[0] && (
                          <img 
                            src={memory.mediaUrls[0]} 
                            alt={memory.caption || memory.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {memory.caption || memory.title || 'منشور بدون وصف'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(memory.createdAt).toLocaleDateString('ar')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Followers Section */}
          <div style={{display: activeTab === "followers" ? "block" : "none"}}>
            <h2 className="text-xl font-bold mb-4">المتابعون ({followers.length})</h2>
            {followers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">لا يوجد متابعون بعد</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followers.map((item: any) => (
                  <Card key={item.follower.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <Link href={`/profile/${item.follower.id}`}>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer hover:opacity-80">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
                            {item.follower.profileImageUrl ? (
                              <img 
                                src={item.follower.profileImageUrl} 
                                alt={item.follower.username} 
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <User className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold hover:underline">{item.follower.username || item.follower.firstName || 'مستخدم'}</p>
                            <p className="text-xs text-gray-500">
                              متابع منذ {new Date(item.followedAt).toLocaleDateString('ar')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Following Section */}
          <div style={{display: activeTab === "following" ? "block" : "none"}}>
            <h2 className="text-xl font-bold mb-4">يتابع ({following.length})</h2>
            {following.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">لا يتابع أحد بعد</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((item: any) => (
                  <Card key={item.following.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <Link href={`/profile/${item.following.id}`}>
                        <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer hover:opacity-80">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
                            {item.following.profileImageUrl ? (
                              <img 
                                src={item.following.profileImageUrl} 
                                alt={item.following.username} 
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <User className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold hover:underline">{item.following.username || item.following.firstName || 'مستخدم'}</p>
                            <p className="text-xs text-gray-500">
                              يتابع منذ {new Date(item.followedAt).toLocaleDateString('ar')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال رسالة إلى {user?.username || user?.firstName}</DialogTitle>
            <DialogDescription>
              يمكنك إرسال رسالة واحدة فقط. سيتمكن المستخدم من الرد عليك إذا وافق على المراسلة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">رسالتك</Label>
              <Textarea
                id="message"
                placeholder="اكتب رسالتك هنا..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                إلغاء
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={() => sendMessageMutation.mutate()}
                disabled={sendMessageMutation.isPending || !messageText.trim()}
              >
                {sendMessageMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Gift Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إرسال هدية إلى {user?.username || user?.firstName}</DialogTitle>
            <DialogDescription>
              اختر هدية لإرسالها. سيتم خصم النقاط من رصيدك.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {gifts.map((gift: any) => (
              <Card 
                key={gift.id}
                className={`cursor-pointer transition-all ${
                  selectedGift === gift.id 
                    ? 'ring-2 ring-purple-600 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedGift(gift.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">{gift.emoji}</div>
                  <h3 className="font-semibold text-sm">{gift.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{gift.pointCost} نقطة</p>
                  {gift.effect && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {gift.effect}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              رصيدك الحالي: <span className="font-semibold">{currentUser?.points || 0} نقطة</span>
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => {
                setShowGiftDialog(false);
                setSelectedGift(null);
              }}>
                إلغاء
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={() => sendGiftMutation.mutate()}
                disabled={sendGiftMutation.isPending || !selectedGift}
              >
                {sendGiftMutation.isPending ? 'جاري الإرسال...' : 'إرسال الهدية'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </div>
  );
}