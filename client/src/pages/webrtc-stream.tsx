import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, Video, Copy, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

// استخدام ZegoUIKitPrebuilt مع إعدادات بسيطة جداً
const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

export default function WebRTCStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [roomId] = useState(`test_room_${Date.now()}`);
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zegoRef = useRef<any>(null);

  const connectToRoom = async (asHost: boolean) => {
    if (!user || !containerRef.current) return;

    try {
      // الحصول على إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      
      const userId = asHost ? `host_${user.id}` : `viewer_${user.id}_${Date.now()}`;
      const userName = asHost ? `Host_${user.username}` : `Viewer_${user.username}`;
      
      // إنشاء token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        userId,
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zp;

      // إعدادات بسيطة جداً
      const zegoConfig = {
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference, // استخدام VideoConference بدلاً من LiveStreaming
        },
        turnOnMicrophoneWhenJoining: asHost,
        turnOnCameraWhenJoining: asHost,
        showMyCameraToggleButton: asHost,
        showMyMicrophoneToggleButton: asHost,
        showTextChat: false,
        showUserList: false,
        showRemoveUserButton: false,
        showLeaveRoomConfirmDialog: false,
        videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_360P,
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        preJoinViewConfig: {
          title: 'الانضمام للغرفة',
        },
        onJoinRoom: () => {
          console.log(`✅ ${asHost ? 'Host' : 'Viewer'} joined room: ${roomId}`);
          setIsConnected(true);
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 Users joined:', users);
        },
        onLeaveRoom: () => {
          console.log('Left room');
          disconnect();
        }
      };

      await zp.joinRoom(zegoConfig);

    } catch (error) {
      console.error('Error connecting:', error);
      alert(`خطأ: ${error.message}`);
    }
  };

  const disconnect = () => {
    if (zegoRef.current) {
      zegoRef.current.destroy();
      zegoRef.current = null;
    }
    setIsConnected(false);
    setIsHost(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl mb-4">يجب تسجيل الدخول</h2>
          <Button onClick={() => setLocation('/login')}>تسجيل الدخول</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          🌐 WebRTC Video Conference Test
        </h1>

        {/* معلومات الغرفة */}
        <Card className="p-4 mb-4 bg-black/20 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-white">معرف الغرفة:</span>
            <div className="flex items-center gap-2">
              <code className="text-green-400 bg-black/50 px-3 py-1 rounded">{roomId}</code>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  alert('تم نسخ معرف الغرفة!');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* اختيار الدور */}
        {!isConnected && (
          <Card className="p-6 bg-black/20 backdrop-blur mb-6">
            <h2 className="text-xl font-bold text-white mb-4">اختر دورك:</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  setIsHost(true);
                  connectToRoom(true);
                }}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Radio className="mr-2" />
                المذيع (Host)
              </Button>
              <Button
                onClick={() => {
                  setIsHost(false);
                  connectToRoom(false);
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="mr-2" />
                المشاهد (Viewer)
              </Button>
            </div>
          </Card>
        )}

        {/* حالة الاتصال */}
        {isConnected && (
          <Badge 
            variant="default" 
            className="mb-4 text-lg px-4 py-2 bg-green-600"
          >
            متصل كـ {isHost ? 'مذيع' : 'مشاهد'}
          </Badge>
        )}

        {/* حاوية الفيديو */}
        <div 
          ref={containerRef}
          className="w-full h-[600px] bg-black rounded-lg overflow-hidden"
        />

        {/* زر قطع الاتصال */}
        {isConnected && (
          <Button
            onClick={disconnect}
            variant="destructive"
            size="lg"
            className="w-full mt-4"
          >
            قطع الاتصال
          </Button>
        )}

        {/* تعليمات */}
        <Card className="mt-6 p-4 bg-yellow-900/20">
          <h3 className="text-yellow-200 font-bold mb-2">📝 تعليمات سريعة:</h3>
          <ol className="text-yellow-100 space-y-1 text-sm">
            <li>1. افتح نفس الصفحة في متصفحين مختلفين</li>
            <li>2. في الأول: اختر "المذيع"</li>
            <li>3. في الثاني: اختر "المشاهد"</li>
            <li>4. يجب أن ترى الفيديو والصوت ينتقلان</li>
            <li>5. نفس معرف الغرفة سيستخدم تلقائياً</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}