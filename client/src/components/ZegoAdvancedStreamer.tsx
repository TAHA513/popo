import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Users, 
  MessageSquare,
  Settings,
  StopCircle,
  Share,
  Camera
} from 'lucide-react';

interface ZegoAdvancedStreamerProps {
  streamTitle: string;
  onStreamEnd?: () => void;
}

export default function ZegoAdvancedStreamer({ streamTitle, onStreamEnd }: ZegoAdvancedStreamerProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, user: string, message: string}>>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const zegoEngineRef = useRef<any>(null);

  // Professional ZegoCloud configuration using your provided settings
  const streamConfig = {
    turnOnCameraWhenJoining: true,
    showMyCameraToggleButton: true,
    showAudioVideoSettingsButton: true,
    showScreenSharingButton: true,
    showTextChat: true,
    showUserList: true,
    scenario: {
      mode: "LiveStreaming",
      config: {
        role: "Host",
      },
    },
  };

  useEffect(() => {
    initializeZegoCloud();
    return () => {
      cleanup();
    };
  }, []);

  const initializeZegoCloud = async () => {
    try {
      const appId = import.meta.env.VITE_ZEGOCLOUD_APP_ID;
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;

      if (!appId || !appSign) {
        console.error('❌ ZegoCloud credentials not found');
        return;
      }

      // تحميل ZegoCloud SDK
      if (!window.ZegoUIKitPrebuilt) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const roomId = `live_${user?.id}_${Date.now()}`;
      const userId = user?.id || 'anonymous';
      const userName = user?.username || 'مستخدم';

      // إنشاء ZegoCloud instance مع الإعدادات المتقدمة
      const zg = window.ZegoUIKitPrebuilt.create(
        parseInt(appId),
        appSign,
        roomId,
        userId,
        userName
      );

      zegoEngineRef.current = zg;

      // تطبيق الإعدادات الاحترافية
      if (videoRef.current) {
        zg.joinRoom({
          container: videoRef.current,
          ...streamConfig,
          // إعدادات إضافية
          preJoinViewConfig: {
            title: streamTitle,
          },
          // معالجة الأحداث
          onJoinRoom: () => {
            setIsStreaming(true);
            console.log('✅ بدأ البث المباشر');
          },
          onLeaveRoom: () => {
            setIsStreaming(false);
            onStreamEnd?.();
            console.log('🔴 انتهى البث المباشر');
          },
          onUserJoin: (users: any[]) => {
            setViewerCount(prev => prev + users.length);
          },
          onUserLeave: (users: any[]) => {
            setViewerCount(prev => Math.max(0, prev - users.length));
          },
        });
      }

    } catch (error) {
      console.error('❌ خطأ في تهيئة ZegoCloud:', error);
    }
  };

  const cleanup = () => {
    if (zegoEngineRef.current) {
      zegoEngineRef.current.destroy();
      zegoEngineRef.current = null;
    }
  };

  const handleEndStream = () => {
    cleanup();
    setIsStreaming(false);
    onStreamEnd?.();
    setLocation('/');
  };

  const toggleVideo = () => {
    if (zegoEngineRef.current) {
      const newState = !isVideoOn;
      zegoEngineRef.current.enableCamera(newState);
      setIsVideoOn(newState);
    }
  };

  const toggleAudio = () => {
    if (zegoEngineRef.current) {
      const newState = !isAudioOn;
      zegoEngineRef.current.enableMicrophone(newState);
      setIsAudioOn(newState);
    }
  };

  const toggleScreenShare = () => {
    if (zegoEngineRef.current) {
      const newState = !isScreenSharing;
      if (newState) {
        zegoEngineRef.current.startScreenCapture();
      } else {
        zegoEngineRef.current.stopScreenCapture();
      }
      setIsScreenSharing(newState);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h1 className="text-white font-bold text-lg">{streamTitle}</h1>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-white/70">
              <Users className="w-4 h-4" />
              <span>{viewerCount} مشاهد</span>
            </div>
          </div>
          
          <Button
            onClick={handleEndStream}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            إنهاء البث
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Video Area */}
        <div className="flex-1 relative">
          <div 
            ref={videoRef} 
            className="w-full h-full bg-black rounded-lg overflow-hidden"
            style={{ minHeight: '400px' }}
          />
          
          {/* Stream Status Overlay */}
          {isStreaming && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              ● مباشر
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="w-80 bg-black/50 backdrop-blur-lg border-l border-white/10 p-4">
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">تحكم في البث</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Controls */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={toggleVideo}
                  className={`${isVideoOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={toggleAudio}
                  className={`${isAudioOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </div>

              {/* Advanced Controls */}
              <div className="space-y-2">
                <Button
                  onClick={toggleScreenShare}
                  className={`w-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  {isScreenSharing ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة'}
                </Button>
                
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  الإعدادات المتقدمة
                </Button>
              </div>

              {/* Stream Info */}
              <div className="bg-black/30 rounded-lg p-3 text-white">
                <h3 className="font-bold mb-2">معلومات البث</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>الحالة:</span>
                    <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>
                      {isStreaming ? 'مباشر' : 'غير مفعل'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المشاهدين:</span>
                    <span>{viewerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الجودة:</span>
                    <span className="text-green-400">HD</span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-3">
                <h3 className="text-white font-bold mb-2">مميزات البث الاحترافي</h3>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>✓ جودة HD/4K تلقائية</li>
                  <li>✓ زمن استجابة أقل من ثانية</li>
                  <li>✓ دعم آلاف المشاهدين</li>
                  <li>✓ مشاركة الشاشة</li>
                  <li>✓ محادثة مباشرة</li>
                  <li>✓ تسجيل سحابي</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}