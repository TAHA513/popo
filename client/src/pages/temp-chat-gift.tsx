import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function TempChatGiftPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  const gifts = [
    { id: "rose", name: "وردة", price: 50, icon: "🌹" },
    { id: "heart", name: "قلب", price: 100, icon: "💛" },
    { id: "star", name: "نجمة", price: 200, icon: "⭐" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">اختر هدية</h3>
            <p className="text-gray-600 text-center mb-6">اختر هدية لبدء الدردشة الخاصة</p>
            
            <div className="grid gap-4 mb-6">
              {gifts.map((gift) => (
                <div 
                  key={gift.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedGift === gift.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedGift(gift.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{gift.icon}</span>
                      <span className="font-medium">{gift.name}</span>
                    </div>
                    <span className="text-purple-600 font-semibold">{gift.price} نقطة</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setLocation('/messages')}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button 
                disabled={!selectedGift}
                className="flex-1"
                onClick={() => {
                  if (selectedGift) {
                    setLocation('/chat/1'); // مؤقت
                  }
                }}
              >
                تأكيد وادفع
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}