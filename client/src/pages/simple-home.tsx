import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User,
  Radio
} from "lucide-react";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // البثوث المباشرة
  const { data: streams = [] } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 10000,
  });

  // إضافة البثوث من ZEGO Cloud
  const liveHostedStreams = React.useMemo(() => {
    const hostedStreams = [];
    
    // البث النشط من ZEGO
    if ((window as any).activeZegoStream) {
      hostedStreams.push({
        id: (window as any).activeZegoStream.roomID,
        title: (window as any).activeZegoStream.title,
        hostId: 'zego-user',
        isActive: true,
        viewerCount: Math.floor(Math.random() * 50) + 5,
        isHosted: true,
        isZego: true
      });
    }
    
    // البث البسيط من الاستضافة المحلية
    if ((window as any).activeLiveStream) {
      hostedStreams.push({
        id: (window as any).activeLiveStream.id,
        title: (window as any).activeLiveStream.title,
        hostId: 'live-user',
        isActive: true,
        viewerCount: Math.floor(Math.random() * 20) + 1,
        isHosted: true
      });
    }
    
    return hostedStreams;
  }, []);

  // دمج البثوث من قاعدة البيانات والاستضافة
  const allStreams = React.useMemo(() => {
    const dbStreams = streams || [];
    return [...liveHostedStreams, ...dbStreams];
  }, [streams, liveHostedStreams]);



  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            
            {/* Live Stream Button - Right Side */}
            <Button 
              onClick={() => {
                console.log('Starting ZEGO Cloud stream');
                setLocation('/zego-real-stream');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <Radio className="w-4 h-4" />
              <span className="text-sm font-bold">ابدأ بث مباشر</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-md mx-auto">
        {/* البثوث المباشرة فقط */}
        <div className="p-4">
          {allStreams.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {allStreams.map((stream: any) => (
                <Card 
                  key={`stream-${stream.id}`} 
                  className="border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow bg-white"
                  onClick={() => {
                    if (stream.isZego) {
                      setLocation(`/zego-viewer/${stream.id}`);
                    } else {
                      setLocation(`/stream/${stream.id}`);
                    }
                  }}
                >
                  <CardContent className="p-0">
                    {/* صورة البث */}
                    <div className="aspect-square bg-gradient-to-br from-red-500 to-pink-500 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                      {/* خلفية متحركة للبث */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-pink-600/30 animate-pulse"></div>
                      
                      {/* أيقونة البث */}
                      <div className="relative z-10 text-center">
                        <Radio className="w-12 h-12 text-white animate-pulse mb-2" />
                        <div className="text-white text-xs font-bold">LIVE</div>
                      </div>
                      
                      {/* شارة البث المباشر */}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold shadow-lg">
                        🔴 {stream.isZego ? 'ZEGO LIVE' : stream.isHosted ? 'مباشر - استضافة' : 'مباشر'}
                      </div>
                      
                      {/* عدد المشاهدين */}
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-lg flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {stream.viewerCount || Math.floor(Math.random() * 50) + 1}
                      </div>
                    </div>
                    
                    {/* معلومات البث والمستخدم */}
                    <div className="p-3">
                      {/* عنوان البث */}
                      <div className="font-medium text-sm text-gray-800 truncate mb-2">
                        {stream.title || `البث رقم ${stream.id}`}
                      </div>
                      
                      {/* معلومات المستخدم */}
                      <div className="flex items-center">
                        {/* صورة المستخدم */}
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold">
                          👤
                        </div>
                        
                        {/* اسم المستخدم */}
                        <div className="text-xs text-gray-600 truncate">
                          مستخدم {stream.id}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔴</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                لا توجد بثوث مباشرة
              </h3>
              <p className="text-gray-500 mb-4">
                كن أول من يبدأ البث المباشر
              </p>
              <Button 
                onClick={() => {
                  console.log('🔗 التنقل إلى صفحة البث...');
                  window.location.href = '/camera-test';
                }}
                className="bg-laa-pink hover:bg-laa-pink/90"
              >
                ابدأ البث الآن
              </Button>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}