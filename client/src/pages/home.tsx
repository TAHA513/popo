import { useAuth } from "@/hooks/useAuth";
import SimpleNavigation from "@/components/simple-navigation";
import LiveStreamsGrid from "@/components/live-streams-grid";
import GiftCharacters from "@/components/gift-characters";
import UserProfile from "@/components/user-profile";
import MobileNavigation from "@/components/mobile-navigation";
import MemoryCard from "@/components/memory-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Play, Users, TrendingUp, Gift, Clock, Zap, Timer, Sparkles, Eye, Crown, Heart } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('home');
  
  // Fetch all public memory fragments with error handling
  const { data: publicMemories = [], isLoading: memoriesLoading, error } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 30000, // Refresh every 30 seconds to show energy decay
    retry: 1,
    staleTime: 5000,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-white text-lg">جاري التحميل...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'live':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">البث المباشر</h2>
            <LiveStreamsGrid />
          </div>
        );
      case 'gifts':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">الهدايا</h2>
            <GiftCharacters />
          </div>
        );
      case 'profile':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">الملف الشخصي</h2>
            <UserProfile />
          </div>
        );
      default:
        return (
          <>
            {/* Simple Hero Section */}
            <section className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 py-12">
              <div className="container mx-auto px-4 text-center">
                <h1 className="font-bold text-3xl md:text-4xl text-white mb-4">
                  مرحباً، {user?.firstName || user?.username || 'مستخدم'}!
                </h1>
                <p className="text-white/90 text-lg mb-6">
                  منصة LaaBoBo Live للبث المباشر والتفاعل
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={() => window.location.href = '/start-stream'}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    ابدأ بث مباشر
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4"
                    onClick={() => window.location.href = '/gifts'}
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    متجر الهدايا
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    تصفح البث المباشر
                  </Button>
                </div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="py-8 bg-white">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-laa-pink">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Your Points</p>
                          <p className="text-2xl font-bold text-laa-dark">{user?.points || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-laa-pink/10 rounded-full flex items-center justify-center">
                          <span className="text-laa-pink">💎</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-laa-purple">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Total Earnings</p>
                          <p className="text-2xl font-bold text-laa-dark">${user?.totalEarnings || '0.00'}</p>
                        </div>
                        <div className="w-10 h-10 bg-laa-purple/10 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-laa-purple" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-laa-blue">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Followers</p>
                          <p className="text-2xl font-bold text-laa-dark">0</p>
                        </div>
                        <div className="w-10 h-10 bg-laa-blue/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-laa-blue" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Streamer Status</p>
                          <p className="text-lg font-bold text-laa-dark">
                            {user?.isStreamer ? 'Active' : 'Basic'}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Video className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Memory Fragments Section */}
            <section className="py-12 bg-white">
              <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 mr-3 text-purple-600" />
                    شظايا الذكريات
                    <Timer className="w-8 h-8 ml-3 text-pink-600" />
                  </h2>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    ذكريات حقيقية تتلاشى بمرور الوقت... شاهدها قبل أن تختفي للأبد
                  </p>
                  
                  {/* Energy Legend */}
                  <div className="flex justify-center mt-6 space-x-6 rtl:space-x-reverse">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                      <span className="text-sm text-gray-600">عابر (24 ساعة)</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                      <span className="text-sm text-gray-600">ثمين (أسبوع)</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                      <span className="text-sm text-gray-600">أسطوري (شهر)</span>
                    </div>
                  </div>
                </div>

                {/* Create Memory CTA */}
                <div className="text-center mb-8">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4"
                    onClick={() => window.location.href = '/create-memory'}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    أنشئ ذكرتك الآن
                  </Button>
                </div>

                {/* Memories Grid */}
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
                ) : publicMemories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(publicMemories as any[]).map((memory: any) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        isOwner={memory.authorId === user?.id}
                        onLike={() => {
                          toast({
                            title: "تم الإعجاب! ❤️",
                            description: "طاقة الذكرى تزداد بتفاعلك",
                          });
                        }}
                        onComment={() => {
                          toast({
                            title: "التعليقات قريباً",
                            description: "ميزة التعليقات ستكون متاحة قريباً",
                          });
                        }}
                        onShare={() => {
                          toast({
                            title: "تم النسخ للحافظة",
                            description: "رابط الذكرى محفوظ للمشاركة",
                          });
                        }}
                        onSendGift={() => {
                          toast({
                            title: "إرسال هدية",
                            description: "اختر هدية لهذه الذكرى الجميلة",
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent>
                      <Sparkles className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        لا توجد ذكريات بعد
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
            </section>

            {/* Live Streams */}
            <LiveStreamsGrid />

            {/* Gift Characters */}
            <GiftCharacters />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNavigation />
      
      <main className="pb-16 md:pb-0">
        {renderContent()}
      </main>

      <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
