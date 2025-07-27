import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CameraOff, Mic, MicOff, StopCircle, Users, Radio } from "lucide-react";
import { useLocation } from "wouter";
import InstantFullScreenStream from "@/components/InstantFullScreenStream";

export default function SimpleStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("بث سريع جديد");
  const [currentStreamData, setCurrentStreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zegoEngineRef = useRef<any>(null);

  // تنظيف الموارد عند إغلاق الصفحة
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (zegoEngineRef.current) {
        zegoEngineRef.current.destroy?.();
      }
    };
  }, []);

  const startSimpleStream = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }

      console.log('🚀 Starting simple stream...');
      
      // الحصول على الكاميرا أولاً
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true;
          videoRef.current.style.transform = 'scaleX(-1)';
          await videoRef.current.play();
        }
        
      } catch (mediaError) {
        console.error('❌ Camera access failed:', mediaError);
        setError('فشل في الوصول للكاميرا. يرجى السماح بالوصول للكاميرا والميكروفون.');
        return;
      }

      // إنشاء البث في قاعدة البيانات
      try {
        const streamData = {
          title: streamTitle.trim() || 'بث سريع',
          description: 'بث مباشر من البث السريع',
          category: 'بث سريع',
          zegoRoomId: `room_${user.id}_${Date.now()}`,
          zegoStreamId: `stream_${user.id}_${Date.now()}`
        };

        const response = await apiRequest('/api/streams', 'POST', streamData);

        if (response?.id) {
          setCurrentStreamData(response);
          setIsStreaming(true);
          console.log('✅ Stream created successfully!');
        }
      } catch (dbError) {
        console.error('❌ Database creation failed:', dbError);
        setError('فشل في إنشاء البث. يرجى المحاولة مرة أخرى.');
        return;
      }

      // الاتصال بـ ZegoCloud باستخدام UIKit
      try {
        const config = await apiRequest('/api/zego-config', 'GET');

        if (config.appId && currentStreamData?.zegoRoomId) {
          // استخدام نفس النظام للمذيع والمشاهد
          const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
          
          const hostUserId = `host_${user.id}_${Date.now()}`;
          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            parseInt(config.appId),
            config.appSign,
            currentStreamData.zegoRoomId,
            hostUserId,
            user.username || 'مضيف'
          );

          const zp = ZegoUIKitPrebuilt.create(kitToken);
          zegoEngineRef.current = zp;

          // إنشاء حاوية مخفية للمذيع
          const hiddenContainer = document.createElement('div');
          hiddenContainer.style.position = 'fixed';
          hiddenContainer.style.top = '-9999px';
          hiddenContainer.style.left = '-9999px';
          hiddenContainer.style.width = '1px';
          hiddenContainer.style.height = '1px';
          document.body.appendChild(hiddenContainer);

          await zp.joinRoom({
            container: hiddenContainer,
            scenario: {
              mode: ZegoUIKitPrebuilt.LiveStreaming,
              config: {
                role: ZegoUIKitPrebuilt.Host,
              }
            },
            turnOnMicrophoneWhenJoining: true,
            turnOnCameraWhenJoining: true,
            showLeaveRoomConfirmDialog: false,
            onJoinRoom: () => {
              console.log('✅ Host joined room successfully!');
            }
          });

          console.log('✅ ZegoCloud Host connected successfully!');
        }
      } catch (zegoError) {
        console.warn('⚠️ ZegoCloud connection failed, continuing with local stream:', zegoError);
      }

    } catch (error) {
      console.error('❌ Stream start failed:', error);
      setError('فشل في بدء البث. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-4">يجب عليك تسجيل الدخول لبدء البث المباشر</p>
            <Button onClick={() => setLocation("/login")} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إذا كان البث نشطاً، عرض الواجهة الاحترافية الجديدة
  if (isStreaming && currentStreamData) {
    return (
      <InstantFullScreenStream 
        streamData={currentStreamData} 
        onStreamEnd={() => {
          setIsStreaming(false);
          setCurrentStreamData(null);
          setStreamTitle("بث سريع جديد");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Radio className="w-8 h-8" />
            البث السريع
          </h1>
          <p className="text-purple-200">ابدأ البث المباشر بنقرة واحدة</p>
        </div>

        <Card className="bg-black/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-center">إعداد البث السريع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* معاينة الفيديو */}
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!isStreaming && (
                <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>ستظهر معاينة الكاميرا هنا</p>
                  </div>
                </div>
              )}
            </div>

            {/* عنوان البث */}
            <div>
              <label className="block text-purple-200 mb-2">عنوان البث</label>
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="أدخل عنوان البث..."
                className="bg-white/20 border-purple-500/30 text-white placeholder:text-purple-300"
                disabled={isStreaming}
              />
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={startSimpleStream}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري بدء البث...
                  </>
                ) : (
                  <>
                    <Radio className="w-6 h-6 mr-2" />
                    بدء البث المباشر
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
              >
                العودة للرئيسية
              </Button>
            </div>

            {/* معلومات إضافية */}
            <div className="text-center text-purple-300 text-sm">
              <p className="mb-2">💡 نصائح للبث الناجح:</p>
              <ul className="text-xs space-y-1 opacity-80">
                <li>• تأكد من الإضاءة الجيدة</li>
                <li>• اختبر الصوت قبل البدء</li>
                <li>• تأكد من استقرار الإنترنت</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}