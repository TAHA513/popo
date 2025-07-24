import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Users, Heart, MessageCircle, Gift } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Declare ZegoUIKitPrebuilt global
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

export default function ZegoCameraStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);

  // تحميل ZegoCloud SDK
  useEffect(() => {
    const loadZegoSDK = () => {
      console.log('🔄 تحميل ZegoCloud SDK...');
      
      if (window.ZegoUIKitPrebuilt) {
        console.log('✅ SDK موجود بالفعل');
        setIsInitialized(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ تم تحميل ZegoCloud SDK');
        setTimeout(() => {
          if (window.ZegoUIKitPrebuilt) {
            console.log('✅ SDK جاهز للاستخدام');
            setIsInitialized(true);
            toast({
              title: "نجح التحميل",
              description: "نظام البث المباشر جاهز",
            });
          } else {
            console.error('❌ SDK غير متاح بعد التحميل');
            toast({
              title: "خطأ في النظام",
              description: "فشل في تهيئة نظام البث",
              variant: "destructive"
            });
          }
        }, 1000);
      };
      
      script.onerror = (error) => {
        console.error('❌ فشل تحميل SDK:', error);
        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل نظام البث من الخادم",
          variant: "destructive"
        });
      };
      
      document.head.appendChild(script);
    };

    loadZegoSDK();
  }, [toast]);

  // بدء البث المباشر مع ZegoCloud
  const startLiveStream = async () => {
    console.log('🚀 بدء البث المباشر...');
    
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
        title: "النظام غير جاهز",
        description: "يرجى انتظار تحميل النظام",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔑 التحقق من المفاتيح...');
      
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '');
      const serverSecret = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN || '';
      
      console.log('App ID:', appID ? 'موجود' : 'مفقود');
      console.log('Server Secret:', serverSecret ? 'موجود' : 'مفقود');
      
      if (!appID || !serverSecret) {
        console.error('❌ مفاتيح مفقودة');
        toast({
          title: "إعدادات مفقودة",
          description: "مفاتيح البث غير موجودة في النظام",
          variant: "destructive"
        });
        return;
      }

      // إنشاء room ID فريد
      const roomID = `stream_${user?.id}_${Date.now()}`;
      console.log('🏠 Room ID:', roomID);

      // إنشاء kit token
      const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        user?.id || 'anonymous',
        user?.username || 'مستخدم'
      );

      console.log('🎟️ تم إنشاء Token');

      // إنشاء ZegoUIKit instance
      const zp = window.ZegoUIKitPrebuilt.create(kitToken);
      
      console.log('📱 بدء جلسة البث...');

      // بدء جلسة البث المباشر
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: window.ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: window.ZegoUIKitPrebuilt.Host, // المضيف
          },
        },
        sharedLinks: [],
        onJoinRoom: () => {
          console.log('✅ دخل المضيف إلى الغرفة');
          setIsStreaming(true);
          
          // محاكاة المشاهدين
          const interval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 3));
            setLikes(prev => prev + Math.floor(Math.random() * 2));
          }, 3000);

          toast({
            title: "🔴 بث مباشر",
            description: "بدأ البث المباشر بنجاح!",
          });
        },
        onLeaveRoom: () => {
          console.log('👋 غادر المضيف الغرفة');
          setIsStreaming(false);
          setLocation('/');
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 انضم مشاهدون جدد:', users.length);
          setViewerCount(prev => prev + users.length);
        },
        onUserLeave: (users: any[]) => {
          console.log('👋 غادر مشاهدون:', users.length);
          setViewerCount(prev => Math.max(0, prev - users.length));
        }
      });

    } catch (error: any) {
      console.error('❌ خطأ في بدء البث:', error);
      
      toast({
        title: "خطأ في البث",
        description: error.message || "فشل في بدء البث المباشر",
        variant: "destructive"
      });
    }
  };

  // إذا لم يبدأ البث بعد - صفحة إدخال العنوان
  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              🔴 بث مباشر
            </CardTitle>
            <p className="text-gray-300">
              بث مباشر بجودة عالية
            </p>
            <div className="text-yellow-300 text-xs text-center mt-2">
              مدعوم بتقنية ZegoCloud
            </div>
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
                جاري تحميل النظام...
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
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🎯 زر البث تم النقر عليه');
                  startLiveStream();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={!streamTitle.trim() || !isInitialized}
                type="button"
              >
                🔴 ابدأ البث
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // واجهة البث المباشر - ZegoCloud Container
  return (
    <div className="min-h-screen bg-black relative">
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
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-white text-sm">
              <Users className="w-4 h-4" />
              <span>{viewerCount}</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>{likes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التفاعل الجانبية */}
      <div className="absolute bottom-40 right-4 z-50">
        <div className="flex flex-col space-y-3">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">{viewerCount}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Heart className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <span className="text-xs">{likes}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">0</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Gift className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
            <span className="text-xs">🎁</span>
          </div>
        </div>
      </div>
    </div>
  );
}