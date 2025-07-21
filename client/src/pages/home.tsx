import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "@/components/navigation-header";
import LiveStreamsGrid from "@/components/live-streams-grid";
import GiftCharacters from "@/components/gift-characters";
import UserProfile from "@/components/user-profile";
import MobileNavigation from "@/components/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Play, Users, TrendingUp, Gift } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'live':
        return <LiveStreamsGrid />;
      case 'gifts':
        return <GiftCharacters />;
      case 'profile':
        return <UserProfile />;
      default:
        return (
          <>
            {/* Hero Section */}
            <section className="gradient-bg py-16">
              <div className="container mx-auto px-4 text-center">
                <h1 className="font-bold text-4xl md:text-6xl text-white mb-6">
                  أهلاً بك، {user?.firstName || user?.username || 'مبدع'}!
                </h1>
                <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  جاهز للبث المباشر أو اكتشاف محتوى رائع من المبدعين حول العالم؟
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4"
                    onClick={() => window.location.href = '/start-stream'}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    ابدأ بثاً مباشراً
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
      <NavigationHeader />
      
      <main className="pb-16 md:pb-0">
        {renderContent()}
      </main>

      <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
