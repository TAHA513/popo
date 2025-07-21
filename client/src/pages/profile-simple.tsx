import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  User, 
  Sparkles,
  Plus,
  Calendar,
  Zap,
  TrendingUp,
  UserPlus,
  UserMinus
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import { Link, useParams } from "wouter";
import { queryClient } from "@/lib/queryClient";


export default function ProfileSimplePage() {
  const { user: currentUser } = useAuth();
  const { userId } = useParams();
  const profileUserId = userId || currentUser?.id;
  
  // Fetch profile user data
  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users', profileUserId],
    enabled: !!profileUserId && profileUserId !== currentUser?.id,
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUserId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Use current user if viewing own profile
  const user = profileUserId === currentUser?.id ? currentUser : profileUser;
  
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
    }
  });
  
  const isOwnProfile = currentUser?.id === profileUserId;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <SimpleNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            يرجى تسجيل الدخول لعرض الملف الشخصي
          </div>
        </div>
      </div>
    );
  }

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
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {isOwnProfile ? (
                  <Link href="/create-memory">
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      ذكرى جديدة
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                    className={isFollowing ? "" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"}
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
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memories Section */}
        <div>
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
      </div>
    </div>
  );
}