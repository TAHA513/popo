import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { X, Heart, MessageCircle, Gift, Trophy, Star, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

interface UserProfile {
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    points: number;
  };
  pet: {
    id: string;
    name: string;
    type: string;
    level: number;
    health: number;
    happiness: number;
  } | null;
  profile: {
    bio?: string;
    gardenLevel: number;
    gardenExperience: number;
    totalSupportReceived: number;
    totalSupportGiven: number;
    favoriteGame?: string;
    gardenTheme: string;
    achievements?: string[];
  } | null;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupporting, setIsSupporting] = useState(false);
  const [supportAmount, setSupportAmount] = useState(100);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(`/api/profiles/${userId}`, "GET");
      const profileData = await response.json();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الملف الشخصي",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupport = async () => {
    if (!currentUser || !profile) return;
    
    try {
      setIsSupporting(true);
      
      await apiRequest("/api/garden/support", "POST", {
        gardenOwnerId: userId,
        supportType: "one-time",
        amount: supportAmount,
        currency: "points",
        message: `دعم من ${currentUser.username} 💎`
      });
      
      toast({
        title: "تم الدعم بنجاح! 💎",
        description: `تم إرسال ${supportAmount} نقطة لدعم حديقة ${profile.user.username}`,
      });
      
      // Refresh profile data
      await loadUserProfile();
      
    } catch (error) {
      console.error('Error supporting garden:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الدعم",
        variant: "destructive",
      });
    } finally {
      setIsSupporting(false);
    }
  };

  const getRankColor = (level: number) => {
    if (level >= 50) return 'text-blue-400'; // Diamond
    if (level >= 30) return 'text-gray-300'; // Platinum  
    if (level >= 20) return 'text-yellow-400'; // Gold
    if (level >= 10) return 'text-gray-400'; // Silver
    return 'text-amber-600'; // Bronze
  };

  const getRankName = (level: number) => {
    if (level >= 50) return 'ماسي';
    if (level >= 30) return 'بلاتيني';
    if (level >= 20) return 'ذهبي';
    if (level >= 10) return 'فضي';
    return 'برونزي';
  };

  const getRankIcon = (level: number) => {
    if (level >= 50) return <Crown className="w-5 h-5" />;
    if (level >= 30) return <Star className="w-5 h-5" />;
    return <Trophy className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-96">
          <div className="text-center">
            <p className="text-red-600">فشل في تحميل الملف الشخصي</p>
            <Button onClick={onClose} className="mt-4">إغلاق</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-purple-600">الملف الشخصي</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3">
            {profile.user.profileImageUrl ? (
              <img 
                src={profile.user.profileImageUrl} 
                alt={profile.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-2xl font-bold">
                {profile.user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-gray-800">{profile.user.username}</h3>
          {profile.user.firstName && (
            <p className="text-gray-600">{profile.user.firstName} {profile.user.lastName}</p>
          )}
          
          <div className={`flex items-center justify-center space-x-2 space-x-reverse mt-2 ${getRankColor(profile.profile?.gardenLevel || 1)}`}>
            {getRankIcon(profile.profile?.gardenLevel || 1)}
            <span className="font-medium">{getRankName(profile.profile?.gardenLevel || 1)}</span>
            <span className="text-sm">مستوى {profile.profile?.gardenLevel || 1}</span>
          </div>
        </div>

        {/* Pet Info */}
        {profile.pet && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-800 mb-2">🐰 الحيوان الأليف</h4>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{profile.pet.name}</p>
                <p className="text-sm text-gray-600">{profile.pet.type} - مستوى {profile.pet.level}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <div>❤️ {profile.pet.health}%</div>
                  <div>😊 {profile.pet.happiness}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.profile?.bio && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-800 mb-2">📝 النبذة الشخصية</h4>
            <p className="text-gray-600">{profile.profile.bio}</p>
          </div>
        )}

        {/* Garden Stats */}
        <div className="bg-purple-50 rounded-xl p-4 mb-4">
          <h4 className="font-bold text-gray-800 mb-3">🌸 إحصائيات الحديقة</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{profile.profile?.gardenExperience || 0}</div>
              <div className="text-xs text-gray-600">نقاط الخبرة</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{profile.profile?.totalSupportReceived || 0}</div>
              <div className="text-xs text-gray-600">الدعم المستلم</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{profile.profile?.totalSupportGiven || 0}</div>
              <div className="text-xs text-gray-600">الدعم المرسل</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{profile.user.points}</div>
              <div className="text-xs text-gray-600">النقاط الحالية</div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        {currentUser && currentUser.id !== userId && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-800 mb-3">💎 دعم الحديقة</h4>
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <input
                type="number"
                value={supportAmount}
                onChange={(e) => setSupportAmount(Number(e.target.value))}
                min="10"
                max="1000"
                step="10"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center"
              />
              <span className="text-gray-600">نقطة</span>
            </div>
            <Button 
              onClick={handleSupport}
              disabled={isSupporting || supportAmount < 10}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {isSupporting ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الإرسال...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Gift className="w-4 h-4" />
                  <span>إرسال الدعم</span>
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center py-3"
          >
            <Heart className="w-4 h-4 mb-1" />
            <span className="text-xs">إعجاب</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center py-3"
          >
            <MessageCircle className="w-4 h-4 mb-1" />
            <span className="text-xs">رسالة</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center py-3"
          >
            <Trophy className="w-4 h-4 mb-1" />
            <span className="text-xs">تحدي</span>
          </Button>
        </div>
      </div>
    </div>
  );
}