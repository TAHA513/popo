import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Button } from '@/components/ui/button';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { Camera, CameraOff, Mic, MicOff, StopCircle } from 'lucide-react';

export default function NativeStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const startNativeStream = async () => {
    if (!user) return;
    
    try {
      setError('');
      
      // إنشاء البث في قاعدة البيانات
      const streamData = {
        title: 'بث مباشر أصلي',
        description: 'بث مباشر باستخدام WebRTC الأصلي'
      };

      const response = await apiRequest('/api/streams', 'POST', streamData);
      if (!response?.data?.id) {
        throw new Error('فشل في إنشاء البث');
      }

      setStreamId(response.data.id);
      console.log('✅ Stream created with ID:', response.data.id);

      // إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      if (!config.appId) {
        throw new Error('فشل في تحميل إعدادات البث');
      }

      const roomId = `room_${response.data.id}`;
      const hostUserId = `host_${user.id}_${Date.now()}`;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        hostUserId,
        user.username || 'مذيع'
      );

      // إنشاء ZegoUIKitPrebuilt instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // الانضمام للغرفة
      await zp.joinRoom({
        container: streamContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          }
        },
        // الإعدادات الأساسية
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        
        // إعدادات الواجهة
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: false,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserCount: false,
        showUserList: false,
        showRemoveUserButton: false,
        showPinButton: false,
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        
        // إعدادات البث
        layout: "Grid",
        maxUsers: 10,
        videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
        
        onJoinRoom: () => {
          console.log('✅ Host joined room successfully!');
          setIsStreaming(true);
        },
        
        onLeaveRoom: () => {
          console.log('❌ Host left room');
          endStream();
        }
      });

      console.log('✅ ZegoCloud Native Stream started successfully!');

    } catch (error: any) {
      console.error('❌ Native stream start failed:', error);
      setError(error.message || 'فشل في بدء البث الأصلي');
    }
  };

  const endStream = async () => {
    try {
      if (zegoInstanceRef.current) {
        await zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      }

      if (streamId) {
        await apiRequest('/api/streams/end-all', 'POST');
      }

      setIsStreaming(false);
      setStreamId(null);
      setLocation('/');
      
    } catch (error) {
      console.error('❌ Error ending native stream:', error);
      setLocation('/');
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const toggleMicrophone = () => {
    setIsMicOn(!isMicOn);
  };

  // تنظيف عند المغادرة
  useEffect(() => {
    return () => {
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up zego instance:', error);
        }
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h2>
          <Button onClick={() => setLocation("/login")}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  // واجهة البث النشط
  if (isStreaming) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* منطقة البث */}
        <div className="w-full h-full relative">
          <div 
            ref={streamContainerRef}
            className="w-full h-full"
          />

          {/* أزرار التحكم */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center space-x-6 rtl:space-x-reverse bg-black/60 backdrop-blur-sm rounded-full px-8 py-4">
              <Button
                onClick={toggleCamera}
                variant="ghost"
                className={`rounded-full w-16 h-16 p-0 ${
                  isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isCameraOn ? <Camera className="w-8 h-8 text-white" /> : <CameraOff className="w-8 h-8 text-white" />}
              </Button>

              <Button
                onClick={toggleMicrophone}
                variant="ghost"
                className={`rounded-full w-16 h-16 p-0 ${
                  isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isMicOn ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white" />}
              </Button>

              <Button
                onClick={endStream}
                variant="ghost"
                className="bg-red-600/90 hover:bg-red-700 rounded-full w-16 h-16 p-0"
              >
                <StopCircle className="w-8 h-8 text-white" />
              </Button>
            </div>
          </div>

          {/* معلومات البث */}
          <div className="absolute top-4 left-4 z-50 bg-red-600/90 px-4 py-2 rounded-full">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-white">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold">🔴 مباشر أصلي</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // صفحة بدء البث
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎥 البث الأصلي المحسن</h1>
          <p className="text-purple-200">بث مباشر بجودة عالية مع نقل الفيديو والصوت</p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">مميزات البث الأصلي:</h3>
          <div className="space-y-2 text-purple-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>نقل الفيديو والصوت بجودة 720P</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>تحكم في الكاميرا والميكروفون</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>واجهة بسيطة ومحسنة</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            onClick={startNativeStream}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-4"
          >
            🎥 بدء البث الأصلي
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full border-purple-400 text-purple-200 hover:bg-purple-800"
          >
            🏠 العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}