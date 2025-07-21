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
import { Link, useParams } from "wouter";
import { queryClient } from "@/lib/queryClient";


export default function ProfileSimplePage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const { userId } = useParams();
  
  // If viewing someone else's profile, use their ID, otherwise use current user's ID
  const profileUserId = userId ? userId : currentUser?.id;
  
  console.log('Profile Debug:', {
    userId,
    currentUserId: currentUser?.id,
    profileUserId,
    isAuthenticated
  });
  const [activeTab, setActiveTab] = useState<"memories" | "followers" | "following">("memories");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedGift, setSelectedGift] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Define isOwnProfile first
  const isOwnProfile = currentUser?.id === profileUserId;
  
  // Fetch profile user data
  const { data: profileUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['/api/users', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    retry: false
  });

  // Always use fetched profile data
  const user = profileUser;
  
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
      queryClient.invalidateQueries({ queryKey: ['/api/users', profileUserId, 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', profileUserId, 'following'] });
    }
  });
  
  // Check if still loading user data
  if (userLoading) {
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
  
  // Check authentication first
  if (!isAuthenticated && !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <SimpleNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center max-w-md mx-auto">
            <p className="text-gray-600 mb-4">يجب تسجيل الدخول لعرض الملف الشخصي</p>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                تسجيل الدخول
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user not found or error
  if (!user && !userLoading && userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <SimpleNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center max-w-md mx-auto">
            <p className="text-gray-600 mb-4">
              {userError?.message === 'Unauthorized' 
                ? 'يجب تسجيل الدخول لعرض الملف الشخصي' 
                : 'المستخدم غير موجود'}
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                العودة للرئيسية
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }
  

  
  // Fetch available gifts
  const { data: gifts = [] } = useQuery({
    queryKey: ['/api/gifts/characters'],
    enabled: !!currentUser,
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
    queryKey: ['/api/users', profileUserId, 'followers'],
    enabled: !!profileUserId && !!user,
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
    queryKey: ['/api/users', profileUserId, 'following'],
    enabled: !!profileUserId && !!user,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}/following`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      ذكرى جديدة
                    </Button>
                  </Link>
                ) : currentUser ? (
                  <div className="flex flex-col space-y-2">
                    <Button 
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      className={isFollowing ? "w-full" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"}
                      variant={isFollowing ? "outline" : "default"}
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
                      variant="secondary"
                      onClick={() => setShowMessageDialog(true)}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      رسالة
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => setShowGiftDialog(true)}
                      className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      هدية
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-2 rtl:space-x-reverse mb-6">
          <Button
            variant={activeTab === "memories" ? "default" : "outline"}
            onClick={() => setActiveTab("memories")}
            className={activeTab === "memories" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
          >
            المنشورات ({memories.length})
          </Button>
          <Button
            variant={activeTab === "followers" ? "default" : "outline"}
            onClick={() => setActiveTab("followers")}
            className={activeTab === "followers" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
          >
            المتابعون ({followers.length})
          </Button>
          <Button
            variant={activeTab === "following" ? "default" : "outline"}
            onClick={() => setActiveTab("following")}
            className={activeTab === "following" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
          >
            يتابع ({following.length})
          </Button>
        </div>

        {/* Memories Section */}
        <div style={{display: activeTab === "memories" ? "block" : "none"}}>
          <h2 className="text-xl font-bold mb-4">منشوراتي ({memories.length})</h2>
          
          {memoriesLoading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">جاري تحميل المنشورات...</p>
            </div>
          )}
          
          {memories.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">لا توجد ذكريات</h3>
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
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/messages/request`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        receiverId: profileUserId,
                        message: messageText
                      })
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "تم الإرسال",
                        description: "تم إرسال رسالتك بنجاح"
                      });
                      setShowMessageDialog(false);
                      setMessageText("");
                    } else {
                      const error = await response.json();
                      toast({
                        title: "خطأ",
                        description: error.message || "فشل إرسال الرسالة",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "خطأ",
                      description: "حدث خطأ في إرسال الرسالة",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={!messageText.trim()}
              >
                إرسال
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Gift Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إرسال هدية إلى {user?.username || user?.firstName}</DialogTitle>
            <DialogDescription>
              اختر هدية لإرسالها. ستُخصم النقاط من رصيدك.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {gifts.map((gift: any) => (
                <Card 
                  key={gift.id} 
                  className={`cursor-pointer transition-all ${selectedGift === gift.id ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => setSelectedGift(gift.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{gift.emoji}</div>
                    <p className="font-semibold">{gift.name}</p>
                    <p className="text-sm text-gray-600">{gift.pointCost} نقطة</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="outline" onClick={() => setShowGiftDialog(false)}>
                إلغاء
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={!selectedGift}
                onClick={async () => {
                  if (!selectedGift) return;
                  
                  try {
                    const response = await fetch('/api/gifts/send', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        receiverId: profileUserId,
                        characterId: selectedGift,
                        message: ''
                      })
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "تم الإرسال",
                        description: "تم إرسال الهدية بنجاح"
                      });
                      setShowGiftDialog(false);
                      setSelectedGift(null);
                    } else {
                      const error = await response.json();
                      toast({
                        title: "خطأ",
                        description: error.message || "فشل إرسال الهدية",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "خطأ",
                      description: "حدث خطأ في إرسال الهدية",
                      variant: "destructive"
                    });
                  }
                }}
              >
                إرسال الهدية
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}