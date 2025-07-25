import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserProfileModal from "./UserProfileModal";

interface Friend {
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    points: number | null;
  };
  pet: {
    id: string;
    name: string;
    type: string;
    health: number;
    happiness: number;
    level: number;
  } | null;
}

export default function FriendsGardens() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [visitingFriend, setVisitingFriend] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  // Fetch friends list
  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/garden/friends'],
    enabled: !!user,
  });

  // Visit friend's garden mutation
  const visitGardenMutation = useMutation({
    mutationFn: (friendId: string) => 
      apiRequest(`/api/garden/visit/${friendId}`, 'POST', {}),
    onSuccess: (data, friendId) => {
      // Show success message
      alert(`زرت حديقة الصديق بنجاح! 🌸`);
      queryClient.invalidateQueries({ queryKey: ['/api/garden/friends'] });
      setVisitingFriend(null);
    },
    onError: (error) => {
      console.error('Failed to visit garden:', error);
      alert('فشل في زيارة الحديقة. حاول مرة أخرى');
      setVisitingFriend(null);
    }
  });

  const handleVisitGarden = (friendId: string) => {
    setVisitingFriend(friendId);
    visitGardenMutation.mutate(friendId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-purple-600">حدائق الأصدقاء</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">جاري تحميل حدائق الأصدقاء...</p>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-purple-600">حدائق الأصدقاء</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h4 className="text-lg font-bold text-purple-600 mb-2">لا توجد حدائق أصدقاء بعد</h4>
          <p className="text-gray-600 dark:text-gray-400">
            ادع أصدقائك للانضمام إلى LaaBoBo وبناء حدائقهم الخاصة!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🏘️ حدائق الأصدقاء</h3>
      <div className="grid grid-cols-2 gap-4">
        {friends.map((friend) => {
          const displayName = friend.user.firstName || friend.user.username || 'مستخدم';
          const petEmoji = friend.pet?.type === 'cat' ? '🐱' : 
                          friend.pet?.type === 'dog' ? '🐶' : '🐰';
          
          return (
            <div key={friend.user.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-pink-200 dark:border-pink-800">
              <div className="flex items-center space-x-3 space-x-reverse mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center overflow-hidden">
                  {friend.user.profileImageUrl ? (
                    <img 
                      src={friend.user.profileImageUrl} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-purple-600 dark:text-purple-300 font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-purple-600 dark:text-purple-300">
                    {displayName}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {friend.pet ? `Level ${friend.pet.level}` : 'لا يوجد حيوان أليف'}
                  </p>
                </div>
              </div>
              
              {friend.pet ? (
                <>
                  {/* Friend's Pet */}
                  <div className="text-center mb-3">
                    <div className="text-6xl mb-2">{petEmoji}</div>
                    <div className="text-sm font-bold text-purple-600 mb-2">
                      {friend.pet.name || 'أرنوب الصغير'}
                    </div>
                    
                    {/* Health Bar */}
                    <div className="flex justify-center space-x-1 space-x-reverse mb-2">
                      <div className="w-8 h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 dark:bg-green-400"
                          style={{ width: `${friend.pet.health}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400">الصحة</span>
                    </div>
                    
                    {/* Happiness Bar */}
                    <div className="flex justify-center space-x-1 space-x-reverse">
                      <div className="w-8 h-2 bg-yellow-200 dark:bg-yellow-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 dark:bg-yellow-400"
                          style={{ width: `${friend.pet.happiness}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">السعادة</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleVisitGarden(friend.user.id)}
                    disabled={visitingFriend === friend.user.id}
                    className="w-full bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-700 text-white"
                  >
                    {visitingFriend === friend.user.id ? 'جاري الزيارة...' : 'زيارة الحديقة'}
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">🌱</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    لم ينشئ حيوان أليف بعد
                  </p>
                  <Button
                    disabled
                    className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  >
                    لا يمكن الزيارة
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}