import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import GiftShop from "@/components/gift-shop";
import GiftAnimation from "@/components/gift-animation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, TrendingUp, History, User, Coins } from "lucide-react";

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

export default function GiftsPage() {
  const { user } = useAuth();
  const [currentAnimation, setCurrentAnimation] = useState<GiftItem | null>(null);
  const [userPoints, setUserPoints] = useState(1000); // This would come from API

  // Mock data - in real app this would come from API
  const [sentGifts, setSentGifts] = useState<SentGift[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);

  const handleSendGift = (gift: GiftItem) => {
    // Deduct points
    setUserPoints(prev => prev - gift.price);
    
    // Add to sent gifts
    setSentGifts(prev => [{
      id: Date.now().toString(),
      gift,
      recipient: "مستخدم تجريبي",
      timestamp: new Date()
    }, ...prev]);

    // Show animation
    setCurrentAnimation(gift);
  };

  const handleAnimationComplete = () => {
    setCurrentAnimation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎁 عالم الهدايا
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            أرسل هدايا رائعة وعبر عن مشاعرك بطريقة مميزة
          </p>
        </div>

        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto">
            <TabsTrigger value="shop" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Gift className="w-4 h-4" />
              <span>المتجر</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center space-x-2 rtl:space-x-reverse">
              <TrendingUp className="w-4 h-4" />
              <span>مُرسلة</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center space-x-2 rtl:space-x-reverse">
              <History className="w-4 h-4" />
              <span>مستلمة</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            <GiftShop onSendGift={handleSendGift} userPoints={userPoints} />
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span>الهدايا المُرسلة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentGifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لم ترسل أي هدايا بعد</p>
                    <p className="text-sm">ابدأ بإرسال هدية لأصدقائك!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentGifts.map((sentGift) => (
                      <div key={sentGift.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${sentGift.gift.gradient} flex items-center justify-center`}>
                            <sentGift.gift.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{sentGift.gift.arabicName}</h4>
                            <p className="text-sm text-gray-600">إلى: {sentGift.recipient}</p>
                          </div>
                        </div>
                        <div className="text-left rtl:text-right">
                          <Badge variant="outline" className="mb-1">
                            <Coins className="w-3 h-3 mr-1" />
                            {sentGift.gift.price}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {sentGift.timestamp.toLocaleDateString('ar')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <History className="w-5 h-5 text-green-500" />
                  <span>الهدايا المستلمة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivedGifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لم تستلم أي هدايا بعد</p>
                    <p className="text-sm">شارك محتوى رائع لتحصل على هدايا!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedGifts.map((receivedGift) => (
                      <div key={receivedGift.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${receivedGift.gift.gradient} flex items-center justify-center`}>
                            <receivedGift.gift.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{receivedGift.gift.arabicName}</h4>
                            <p className="text-sm text-gray-600">من: {receivedGift.sender}</p>
                          </div>
                        </div>
                        <div className="text-left rtl:text-right">
                          <Badge variant="outline" className="mb-1 bg-green-100">
                            <Coins className="w-3 h-3 mr-1" />
                            +{receivedGift.gift.price}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {receivedGift.timestamp.toLocaleDateString('ar')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Points Display */}
        <Card className="fixed bottom-4 right-4 w-48 shadow-lg z-40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-lg">{userPoints}</span>
              </div>
              <Button size="sm" variant="outline">
                شراء نقاط
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Animation */}
      {currentAnimation && (
        <GiftAnimation
          giftId={currentAnimation.id}
          giftName={currentAnimation.name}
          arabicName={currentAnimation.arabicName}
          icon={currentAnimation.icon}
          gradient={currentAnimation.gradient}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  );
}