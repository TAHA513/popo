import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Button } from '@/components/ui/button';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function SimpleLiveStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [streamTitle, setStreamTitle] = useState('بث مباشر سريع');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const startSimpleStream = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // إنشاء البث في قاعدة البيانات
      const streamData = {
        title: streamTitle,
        description: 'بث مباشر بسيط مع نقل الفيديو والصوت'
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

      const roomId = `simple_room_${response.data.id}`;
      const hostUserId = `host_${user.id}`;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        hostUserId,
        user.username || 'مذيع'
      );

      console.log('🎥 Starting simple stream with:', {
        roomId,
        hostUserId,
        streamId: response.data.id
      });

      // إنشاء ZegoUIKitPrebuilt instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // الانضمام للغرفة بأبسط إعدادات
      await zp.joinRoom({
        container: streamContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          }
        },
        // إعدادات أساسية للمذيع
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        
        // واجهة مبسطة
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showTextChat: true,
        showUserCount: true,
        showUserList: false,
        showRemoveUserButton: false,
        showPinButton: false,
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        
        // إعدادات البث المحسنة
        layout: "Auto",
        maxUsers: 50,
        videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
        
        onJoinRoom: () => {
          console.log('✅ Host joined simple stream successfully!');
          setIsStreaming(true);
        },
        
        onLeaveRoom: () => {
          console.log('❌ Host left simple stream');
          endStream();
        },

        onUserJoin: (users: any[]) => {
          console.log('👥 Users joined simple stream:', users);
        },

        onUserLeave: (users: any[]) => {
          console.log('👥 Users left simple stream:', users);
        }
      });

      console.log('✅ Simple stream started successfully!');

    } catch (error: any) {
      console.error('❌ Simple stream start failed:', error);
      setError(error.message || 'فشل في بدء البث البسيط');
    } finally {
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
      <div className="min-h-screen bg-black relative">
        {/* زر إنهاء البث */}
        <Button
          onClick={endStream}
          className="absolute top-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          إنهاء البث
        </Button>

        {/* معلومات البث */}
        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-white">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-bold">مباشر بسيط</span>
            <span>•</span>
            <span>{streamTitle}</span>
          </div>
        </div>

        {/* حاوية ZegoCloud */}
        <div 
          ref={streamContainerRef}
          className="w-full h-screen"
          style={{ width: '100%', height: '100vh' }}
        />
      </div>
    );
  }

  // صفحة إعداد البث
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎥 البث البسيط المضمون</h1>
          <p className="text-green-200">بث مباشر مع ضمان نقل الفيديو والصوت للمشاهدين</p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">مميزات البث البسيط:</h3>
          <div className="space-y-2 text-green-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>ضمان نقل الفيديو والصوت للمشاهدين</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>إعدادات مبسطة وموثوقة</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>دعم أقصى 50 مشاهد</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>جودة فيديو 720P عالية</span>
            </div>
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-6">
          <label className="block text-white font-bold mb-2">عنوان البث:</label>
          <input
            type="text"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400 focus:border-green-300 focus:outline-none"
            placeholder="أدخل عنوان البث..."
          />
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
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 disabled:opacity-50"
          >
            {isLoading ? '🔄 جاري البدء...' : '🎥 بدء البث البسيط'}
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full border-green-400 text-green-200 hover:bg-green-800"
          >
            🏠 العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}