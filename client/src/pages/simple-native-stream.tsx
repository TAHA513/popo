import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Button } from '@/components/ui/button';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { Camera, CameraOff, Mic, MicOff, StopCircle } from 'lucide-react';

export default function SimpleNativeStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const startSimpleStream = async () => {
    if (!user || !streamContainerRef.current) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // إنشاء البث في قاعدة البيانات
      const streamData = {
        title: 'بث مباشر بسيط',
        description: 'بث مباشر بإعدادات مبسطة'
      };

      const response = await apiRequest('/api/streams', 'POST', streamData);
      if (!response?.data?.id) {
        throw new Error('فشل في إنشاء البث');
      }

      setStreamId(response.data.id);
      console.log('✅ Simple stream created with ID:', response.data.id);

      // إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      if (!config.appId) {
        throw new Error('فشل في تحميل إعدادات البث');
      }

      // إنشاء معرفات بسيطة
      const roomId = `simple_${response.data.id}`;
      const hostUserId = `host_${user.id}`;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        hostUserId,
        user.username || 'مذيع'
      );

      console.log('🔗 Simple stream config:', {
        roomId,
        hostUserId,
        streamId: response.data.id
      });

      // إنشاء ZegoUIKitPrebuilt instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // الانضمام للغرفة بإعدادات مبسطة للغاية
      await zp.joinRoom({
        container: streamContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          }
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
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
        layout: "Auto",
        maxUsers: 10,
        onJoinRoom: () => {
          console.log('✅ Simple host joined successfully!');
          setIsStreaming(true);
          setIsLoading(false);
        },
        onLeaveRoom: () => {
          console.log('❌ Simple host left room');
          endStream();
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 Viewers joined simple stream:', users);
        },
        onUserLeave: (users: any[]) => {
          console.log('👥 Viewers left simple stream:', users);
        }
      });

      console.log('✅ Simple ZegoCloud Stream started successfully!');

    } catch (error: any) {
      console.error('❌ Simple stream start failed:', error);
      setError(error.message || 'فشل في بدء البث البسيط');
      setIsLoading(false);
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
      console.error('❌ Error ending simple stream:', error);
      setLocation('/');
    }
  };

  // تنظيف عند المغادرة
  useEffect(() => {
    return () => {
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up simple stream:', error);
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
            style={{ width: '100%', height: '100vh' }}
          />

          {/* زر إنهاء البث */}
          <div className="absolute top-4 left-4 z-50">
            <Button
              onClick={endStream}
              className="bg-red-600/90 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              إنهاء البث
            </Button>
          </div>

          {/* معلومات البث */}
          <div className="absolute top-4 right-4 z-50 bg-red-600/90 px-4 py-2 rounded-full">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-white">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold">🔴 بث بسيط مباشر</span>
            </div>
          </div>

          {/* تعليمات للمشاهدين */}
          <div className="absolute bottom-4 left-4 z-50 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm">
            <h3 className="font-bold mb-2">للمشاهدة:</h3>
            <p className="text-sm">Room ID: <span className="text-blue-300 font-mono">simple_{streamId}</span></p>
            <p className="text-xs mt-1 text-gray-300">شارك هذا الرقم مع الأصدقاء للمشاهدة</p>
          </div>
        </div>
      </div>
    );
  }

  // صفحة بدء البث
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📺 البث البسيط المباشر</h1>
          <p className="text-green-200">بث مباشر بإعدادات مبسطة ومضمونة النجاح</p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">مميزات البث البسيط:</h3>
          <div className="space-y-2 text-green-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>إعدادات مبسطة ومضمونة</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>نقل فوري للفيديو والصوت</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>واجهة نظيفة بدون تعقيدات</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>معرف بث بسيط للمشاركة</span>
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
            onClick={startSimpleStream}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4"
          >
            {isLoading ? '🔄 جاري البدء...' : '📺 بدء البث البسيط'}
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full border-green-400 text-green-200 hover:bg-green-800"
          >
            🏠 العودة للرئيسية
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>💡 نصيحة: هذا البث يستخدم إعدادات مبسطة لضمان عمل الفيديو والصوت</p>
          <p>🔗 ستحصل على معرف بث بسيط لمشاركته مع المشاهدين</p>
        </div>
      </div>
    </div>
  );
}