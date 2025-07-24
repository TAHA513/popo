import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Users, Heart, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ZegoCloud SDK Integration
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

export default function ZegoLiveStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // تحميل ZegoCloud SDK
  useEffect(() => {
    const loadZegoSDK = () => {
      if (window.ZegoUIKitPrebuilt) {
        setIsInitialized(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js';
      script.onload = () => {
        console.log('✅ ZegoCloud SDK loaded');
        setIsInitialized(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load ZegoCloud SDK');
        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل ZegoCloud SDK",
          variant: "destructive"
        });
      };
      document.head.appendChild(script);
    };

    loadZegoSDK();
  }, [toast]);

  // بدء البث المباشر مع ZegoCloud
  const startLiveStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }

    if (!isInitialized || !window.ZegoUIKitPrebuilt) {
      toast({
        title: "SDK غير جاهز",
        description: "يرجى الانتظار حتى يتم تحميل ZegoCloud",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 Starting ZegoCloud live stream...');
      
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '');
      const serverSecret = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN || '';
      
      if (!appID || !serverSecret) {
        toast({
          title: "إعدادات مفقودة",
          description: "مفاتيح ZegoCloud غير موجودة في المتغيرات البيئية",
          variant: "destructive"
        });
        return;
      }

      const roomID = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userID = user?.id || `user_${Date.now()}`;
      const userName = user?.username || 'مستخدم';

      // إنشاء token للمصادقة
      const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      // إعداد البث المباشر
      const zp = window.ZegoUIKitPrebuilt.create(kitToken);
      
      if (containerRef.current) {
        // مسح المحتوى السابق
        containerRef.current.innerHTML = '';
        
        // بدء البث المباشر
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: window.ZegoUIKitPrebuilt.LiveStreaming,
            config: {
              role: window.ZegoUIKitPrebuilt.Host, // دور المضيف
            },
          },
          sharedLinks: [
            {
              name: 'شارك الرابط',
              url: `${window.location.origin}/join/${roomID}`,
            },
          ],
          showPreJoinView: false, // تخطي صفحة ما قبل الانضمام
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          onJoinRoom: () => {
            console.log('✅ انضم إلى الغرفة بنجاح');
            setIsStreaming(true);
            toast({
              title: "🔴 بث مباشر",
              description: "بدأ البث المباشر بنجاح!",
            });
          },
          onLeaveRoom: () => {
            console.log('👋 غادر الغرفة');
            setIsStreaming(false);
            setLocation('/');
          },
          onError: (error: any) => {
            console.error('❌ ZegoCloud error:', error);
            toast({
              title: "خطأ في البث",
              description: `خطأ ZegoCloud: ${error.message || 'خطأ غير معروف'}`,
              variant: "destructive"
            });
          }
        });
      }

    } catch (error) {
      console.error('❌ خطأ في بدء البث:', error);
      toast({
        title: "خطأ في البث",
        description: "فشل في بدء البث المباشر",
        variant: "destructive"
      });
    }
  };

  // إذا لم يبدأ البث بعد - عرض نموذج إدخال العنوان
  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              🔴 بث مباشر احترافي
            </CardTitle>
            <p className="text-gray-300">
              مدعوم بـ ZegoCloud
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">
                عنوان البث
              </label>
              <Input
                type="text"
                placeholder="أدخل عنوان البث المباشر..."
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && streamTitle.trim() && isInitialized) {
                    startLiveStream();
                  }
                }}
              />
            </div>
            
            {!isInitialized && (
              <div className="text-center text-yellow-300 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300 mx-auto mb-2"></div>
                جاري تحميل ZegoCloud SDK...
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation('/')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                رجوع
              </Button>
              <Button
                onClick={startLiveStream}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={!streamTitle.trim() || !isInitialized}
              >
                🔴 ابدأ البث
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // واجهة البث المباشر
  return (
    <div className="min-h-screen bg-black">
      {/* ZegoCloud Container */}
      <div ref={containerRef} className="w-full h-screen" />
      
      {/* شريط علوي مع معلومات البث */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold">مباشر</span>
              <span className="text-white">{streamTitle}</span>
            </div>
            
            <Button
              onClick={() => setLocation('/')}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
            >
              إنهاء البث
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}