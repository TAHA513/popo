import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function TempNewChatPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">دردشة جديدة</h3>
            <p className="text-gray-600 mb-4">ابحث عن مستخدم لبدء محادثة</p>
            <Input 
              placeholder="ابحث عن مستخدم..."
              className="mb-4"
            />
            <Button 
              onClick={() => setLocation('/messages')}
              className="w-full"
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