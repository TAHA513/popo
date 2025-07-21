import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import SimpleNavigation from "@/components/simple-navigation";
import GiftShop from "@/components/gift-shop";
import GiftAnimation from "@/components/gift-animation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, TrendingUp, History, User, Coins, Sparkles, Heart, Star, Crown } from "lucide-react";

interface GiftItem {
  id: string;
  name: string;
  arabicName: string;
  price: number;
  icon: any;
  gradient: string;
}

interface SentGift {
  id: string;
  gift: GiftItem;
  recipient: string;
  timestamp: Date;
}

interface ReceivedGift {
  id: string;
  gift: GiftItem;
  sender: string;
  timestamp: Date;
}

// Mock data for demonstration
const mockSentGifts: SentGift[] = [
  {
    id: "1",
    gift: { id: "rose", name: "Rose", arabicName: "وردة حمراء", price: 10, icon: Heart, gradient: "bg-gradient-to-br from-red-400 to-pink-500" },
    recipient: "سارة أحمد",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: "2", 
    gift: { id: "crown", name: "Crown", arabicName: "تاج ملكي", price: 100, icon: Crown, gradient: "bg-gradient-to-br from-yellow-400 to-orange-500" },
    recipient: "محمد علي",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

const mockReceivedGifts: ReceivedGift[] = [
  {
    id: "1",
    gift: { id: "star", name: "Star", arabicName: "نجمة ذهبية", price: 25, icon: Star, gradient: "bg-gradient-to-br from-yellow-300 to-yellow-500" },
    sender: "أحمد محمود",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
];

export default function GiftsPage() {
  const { user } = useAuth();
  const [currentAnimation, setCurrentAnimation] = useState<GiftItem | null>(null);
  const [activeTab, setActiveTab] = useState("shop");
  
  // Mock data - in real app this would come from API
  const userPoints = 1250;
  const sentGifts = mockSentGifts;
  const receivedGifts = mockReceivedGifts;

  const handleSendGift = (gift: GiftItem) => {
    if (userPoints >= gift.price) {
      setCurrentAnimation(gift);
      
      setTimeout(() => {
        setCurrentAnimation(null);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <SimpleNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-xl">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            عالم الهدايا المميز
          </h1>
          <p className="text-gray-600 mb-6">
            اكتشف وأرسل أجمل الهدايا، واطلع على تاريخ هداياك بالكامل
          </p>
          <Card className="inline-block">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-lg">{userPoints} نقطة</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unified Tabs System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="shop" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Gift className="w-4 h-4" />
              <span>متجر الهدايا</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2 rtl:space-x-reverse">
              <TrendingUp className="w-4 h-4" />
              <span>مُرسلة ({sentGifts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center space-x-2 rtl:space-x-reverse">
              <History className="w-4 h-4" />
              <span>مُستلمة ({receivedGifts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2 rtl:space-x-reverse">
              <User className="w-4 h-4" />
              <span>الإحصائيات</span>
            </TabsTrigger>
          </TabsList>

          {/* Gift Shop Tab */}
          <TabsContent value="shop">
            <GiftShop onSendGift={handleSendGift} userPoints={userPoints} />
          </TabsContent>

          {/* Sent Gifts Tab */}
          <TabsContent value="sent">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">الهدايا المُرسلة</h2>
                <Badge variant="outline">{sentGifts.length} هدية</Badge>
              </div>
              {sentGifts.length === 0 ? (
                <Card className="p-8 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لم ترسل أي هدايا بعد</h3>
                  <p className="text-gray-600 mb-4">ابدأ بإرسال هدايا للمبدعين ودعم محتواهم</p>
                  <Button onClick={() => setActiveTab("shop")}>
                    تصفح متجر الهدايا
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sentGifts.map((gift) => (
                    <Card key={gift.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className={`w-12 h-12 rounded-full ${gift.gift.gradient} flex items-center justify-center shadow-md`}>
                          <gift.gift.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{gift.gift.arabicName}</h3>
                          <p className="text-sm text-gray-600">إلى: {gift.recipient}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-600">{gift.gift.price} نقطة</p>
                          <p className="text-sm text-gray-500">
                            {new Date(gift.timestamp).toLocaleDateString('ar')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Received Gifts Tab */}
          <TabsContent value="received">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">الهدايا المُستلمة</h2>
                <Badge variant="outline">{receivedGifts.length} هدية</Badge>
              </div>
              {receivedGifts.length === 0 ? (
                <Card className="p-8 text-center">
                  <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لم تستلم أي هدايا بعد</h3>
                  <p className="text-gray-600 mb-4">أنشئ محتوى رائع ليرسل لك المعجبون هدايا مميزة</p>
                  <Button onClick={() => window.location.href = '/create-memory'}>
                    إنشاء ذكرى جديدة
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {receivedGifts.map((gift) => (
                    <Card key={gift.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className={`w-12 h-12 rounded-full ${gift.gift.gradient} flex items-center justify-center shadow-md`}>
                          <gift.gift.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{gift.gift.arabicName}</h3>
                          <p className="text-sm text-gray-600">من: {gift.sender}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">+{gift.gift.price} نقطة</p>
                          <p className="text-sm text-gray-500">
                            {new Date(gift.timestamp).toLocaleDateString('ar')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold text-lg">{sentGifts.length}</h3>
                <p className="text-gray-600">هدايا مُرسلة</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <History className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <h3 className="font-semibold text-lg">{receivedGifts.length}</h3>
                <p className="text-gray-600">هدايا مُستلمة</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Coins className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                <h3 className="font-semibold text-lg">{userPoints}</h3>
                <p className="text-gray-600">النقاط الحالية</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Gift className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold text-lg">
                  {sentGifts.reduce((total, gift) => total + gift.gift.price, 0)}
                </h3>
                <p className="text-gray-600">إجمالي المُنفق</p>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Sparkles className="w-5 h-5" />
                    <span>نشاطك في الهدايا</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>المعدل الأسبوعي للهدايا المُرسلة</span>
                      <Badge variant="secondary">{Math.round(sentGifts.length / 4)} هدية/أسبوع</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>أكثر هدية ترسلها</span>
                      <Badge>وردة حمراء</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>إجمالي النقاط المُكتسبة</span>
                      <Badge className="bg-green-100 text-green-800">
                        +{receivedGifts.reduce((total, gift) => total + gift.gift.price, 0)} نقطة
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Gift Animation */}
        {currentAnimation && (
          <GiftAnimation 
            giftId={currentAnimation.id}
            giftName={currentAnimation.name}
            arabicName={currentAnimation.arabicName}
            icon={currentAnimation.icon}
            gradient={currentAnimation.gradient}
            onComplete={() => setCurrentAnimation(null)}
          />
        )}
      </div>
    </div>
  );
}