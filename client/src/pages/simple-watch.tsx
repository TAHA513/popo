import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Button } from '@/components/ui/button';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function SimpleWatchPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const joinSimpleStream = async () => {
    if (!user || !streamContainerRef.current || !roomId.trim()) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔗 Joining simple stream with room ID:', roomId);

      // إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      if (!config.appId) {
        throw new Error('فشل في تحميل إعدادات البث');
      }

      // إنشاء معرف المشاهد
      const viewerUserId = `viewer_${user.id}_${Date.now()}`;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId.trim(),
        viewerUserId,
        user.username || 'مشاهد'
      );

      console.log('🎬 Simple viewer config:', {
        roomId: roomId.trim(),
        viewerUserId,
        username: user.username
      });

      // إنشاء ZegoUIKitPrebuilt instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // الانضمام للغرفة كمشاهد
      await zp.joinRoom({
        container: streamContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Audience,
          }
        },
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        showMyCameraToggleButton: false,
        showMyMicrophoneToggleButton: false,
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
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        onJoinRoom: () => {
          console.log('✅ Simple viewer joined successfully!');
          setIsConnected(true);
          setIsLoading(false);
        },
        onLeaveRoom: () => {
          console.log('❌ Simple viewer left room');
          leaveStream();
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 Users in simple stream:', users);
        },
        onUserLeave: (users: any[]) => {
          console.log('👥 User left simple stream:', users);
        }
      });

      console.log('✅ Simple viewer connected successfully!');

    } catch (error: any) {
      console.error('❌ Simple watch failed:', error);
      setError(error.message || 'فشل في الانضمام للبث البسيط');
      setIsLoading(false);
    }
  };

  const leaveStream = async () => {
    try {
      if (zegoInstanceRef.current) {
        await zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      }

      setIsConnected(false);
      setLocation('/');
      
    } catch (error) {
      console.error('❌ Error leaving simple stream:', error);
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
          console.error('Error cleaning up simple watch:', error);
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

  // واجهة المشاهدة النشطة
  if (isConnected) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* منطقة المشاهدة */}
        <div className="w-full h-full relative">
          <div 
            ref={streamContainerRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100vh' }}
          />

          {/* زر المغادرة */}
          <div className="absolute top-4 left-4 z-50">
            <Button
              onClick={leaveStream}
              className="bg-gray-600/90 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              مغادرة البث
            </Button>
          </div>

          {/* معلومات المشاهدة */}
          <div className="absolute top-4 right-4 z-50 bg-blue-600/90 px-4 py-2 rounded-full">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-white">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold">👁️ مشاهدة مباشرة</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // صفحة الانضمام للبث
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">👁️ مشاهدة البث البسيط</h1>
          <p className="text-blue-200">انضم لمشاهدة بث مباشر باستخدام معرف الغرفة</p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">كيفية المشاهدة:</h3>
          <div className="space-y-2 text-blue-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>احصل على معرف الغرفة من المذيع</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>أدخل المعرف في الحقل أدناه</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>اضغط "انضمام للبث" للمشاهدة</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              معرف الغرفة (Room ID)
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="مثال: simple_123"
              className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <Button
            onClick={joinSimpleStream}
            disabled={isLoading || !roomId.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4"
          >
            {isLoading ? '🔄 جاري الانضمام...' : '👁️ انضمام للبث'}
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full border-blue-400 text-blue-200 hover:bg-blue-800"
          >
            🏠 العودة للرئيسية
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>💡 نصيحة: اطلب من المذيع معرف الغرفة للانضمام</p>
          <p>🎥 ستشاهد البث مباشرة بعد الانضمام</p>
        </div>
      </div>
    </div>
  );
}