import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function TempPrivateChatPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [message, setMessage] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">دردشة خاصة</h3>
            
            <div className="h-64 bg-gray-100 rounded-lg mb-4 p-4 overflow-y-auto">
              <p className="text-gray-500 text-center">لا توجد رسائل بعد</p>
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك..."
                className="flex-1"
              />
              <Button onClick={() => setMessage("")}>
                إرسال
              </Button>
            </div>
            
            <Button 
              onClick={() => setLocation('/messages')}
              variant="outline"
              className="w-full mt-4"
            >
              العودة للرسائل
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}