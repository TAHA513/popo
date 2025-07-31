import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, UserMinus, UserCheck, Shield, ShieldOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Follower {
  id: string;
  username: string;
  firstName: string;
  profileImageUrl: string;
  isBlocked?: boolean;
  followedAt: string;
}

export default function FollowersManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const queryClient = useQueryClient();

  // Get followers
  const { data: followers = [], isLoading: followersLoading } = useQuery<Follower[]>({
    queryKey: ['/api/users', user?.id, 'followers'],
    enabled: !!user?.id && activeTab === 'followers'
  });

  // Get following
  const { data: following = [], isLoading: followingLoading } = useQuery<Follower[]>({
    queryKey: ['/api/users', user?.id, 'following'],
    enabled: !!user?.id && activeTab === 'following'
  });

  // Block/Unblock user mutation
  const blockMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'block' | 'unblock' }) => {
      const response = await fetch(`/api/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to block/unblock user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'following'] });
    }
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to unfollow user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'following'] });
    }
  });

  // Remove follower mutation
  const removeFollowerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/remove-follower`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to remove follower');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'followers'] });
    }
  });

  const handleBlock = (userId: string, isBlocked: boolean) => {
    blockMutation.mutate({ 
      userId, 
      action: isBlocked ? 'unblock' : 'block' 
    });
  };

  const handleUnfollow = (userId: string) => {
    unfollowMutation.mutate(userId);
  };

  const handleRemoveFollower = (userId: string) => {
    removeFollowerMutation.mutate(userId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">يجب تسجيل الدخول</h2>
          <Button onClick={() => setLocation('/auth')}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/profile')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              العودة
            </Button>
            
            <h1 className="text-xl font-bold text-gray-800">إدارة المتابعين</h1>
            
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'followers' 
                ? 'text-laa-pink border-b-2 border-laa-pink bg-pink-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            المتابعون
            <Badge variant="secondary" className="mr-2">
              {followers.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'following' 
                ? 'text-laa-pink border-b-2 border-laa-pink bg-pink-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            أتابع
            <Badge variant="secondary" className="mr-2">
              {following.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'followers' && (
          <div className="space-y-4">
            {followersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-laa-pink border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل المتابعين...</p>
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد متابعون</h3>
                <p className="text-gray-500">لا يتابعك أحد حتى الآن</p>
              </div>
            ) : (
              followers.map((follower) => (
                <div key={follower.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={follower.profileImageUrl} />
                        <AvatarFallback className="bg-laa-pink text-white">
                          {follower.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-800">{follower.firstName}</h3>
                        <p className="text-sm text-gray-600">@{follower.username}</p>
                        <p className="text-xs text-gray-400">
                          متابع منذ {new Date(follower.followedAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveFollower(follower.id)}
                        disabled={removeFollowerMutation.isPending}
                      >
                        <UserMinus className="w-4 h-4 ml-1" />
                        إزالة
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={follower.isBlocked ? "default" : "outline"}
                        onClick={() => handleBlock(follower.id, !!follower.isBlocked)}
                        disabled={blockMutation.isPending}
                      >
                        {follower.isBlocked ? (
                          <>
                            <ShieldOff className="w-4 h-4 ml-1" />
                            إلغاء الحظر
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 ml-1" />
                            حظر
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/user/${follower.id}`)}
                      >
                        عرض الملف
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-4">
            {followingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-laa-pink border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل القائمة...</p>
              </div>
            ) : following.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">➕</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">لا تتابع أحداً</h3>
                <p className="text-gray-500">ابحث عن أشخاص مثيرين للاهتمام لمتابعتهم</p>
              </div>
            ) : (
              following.map((user) => (
                <div key={user.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback className="bg-laa-pink text-white">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-800">{user.firstName}</h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        <p className="text-xs text-gray-400">
                          تتابعه منذ {new Date(user.followedAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUnfollow(user.id)}
                        disabled={unfollowMutation.isPending}
                      >
                        <UserMinus className="w-4 h-4 ml-1" />
                        إلغاء المتابعة
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/user/${user.id}`)}
                      >
                        عرض الملف
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}