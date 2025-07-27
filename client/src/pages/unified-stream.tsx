import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Radio, Camera, ArrowLeft } from 'lucide-react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { apiRequest } from '@/lib/queryClient';

export default function UnifiedStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [streamTitle, setStreamTitle] = useState('بث مباشر جديد');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);

  // إنهاء البث والتنظيف
  const endStream = async () => {
    try {
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      }

      if (currentStreamId) {
        await apiRequest('/api/streams/end-all', 'POST');
        setCurrentStreamId(null);
      }

      setIsStreaming(false);
      setLocation('/');
    } catch (error) {
      console.error('❌ Error ending stream:', error);
    }
  };

  // بدء البث المباشر
  const startUnifiedStream = async () => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // إنشاء البث في قاعدة البيانات
      const streamData = {
        title: streamTitle.trim() || 'بث مباشر جديد',
        description: 'بث مباشر من LaaBoBo',
        category: 'بث مباشر',
        zegoRoomId: `room_${user.id}`, // غرفة ثابتة للمستخدم
        zegoStreamId: `stream_${user.id}` // stream ID ثابت للمستخدم
      };

      console.log('🎥 Creating stream:', streamData);
      const response = await apiRequest('/api/streams', 'POST', streamData);

      if (!response?.data?.id) {
        throw new Error('فشل في إنشاء البث');
      }

      setCurrentStreamId(response.data.id);
      console.log('✅ Stream created with ID:', response.data.id);

      // الحصول على إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      if (!config.appId) {
        throw new Error('فشل في تحميل إعدادات البث');
      }

      // إنشاء token للمذيع - استخدم user ID ثابت
      const hostUserId = user.id; // استخدم user ID الحقيقي بدون timestamp
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        streamData.zegoRoomId,
        hostUserId,
        user.username || 'مذيع'
      );

      console.log('🔗 Host joining room:', {
        roomId: streamData.zegoRoomId,
        streamId: streamData.zegoStreamId,
        hostId: hostUserId
      });

      // إنشاء ZegoUIKitPrebuilt instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // الانضمام للغرفة كمذيع مع إعدادات محسنة
      await zp.joinRoom({
        container: streamContainerRef.current,
        sharedLinks: [{
          name: 'LaaBoBo Live Stream',
          url: `${window.location.origin}/stream/${response.data.id}`,
        }],
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
            streamID: streamData.zegoStreamId, // مهم جداً لنقل البث للمشاهدين
          }
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showTextChat: true,
        showUserCount: true,
        showUserList: true,
        showRemoveUserButton: false,
        showPinButton: true,
        showLayoutButton: true,
        showLeaveRoomConfirmDialog: false,
        layout: "Grid",
        maxUsers: 50,
        videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
        onJoinRoom: () => {
          console.log('✅ Host joined room successfully!');
          console.log('📡 Publishing stream with ID:', streamData.zegoStreamId);
          setIsStreaming(true);
        },
        onLeaveRoom: () => {
          console.log('❌ Host left room');
          endStream();
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 New users joined:', users);
        },
        onUserLeave: (users: any[]) => {
          console.log('👥 Users left:', users);
        }
      });

      console.log('✅ ZegoCloud Host connected successfully!');

    } catch (error: any) {
      console.error('❌ Stream start failed:', error);
      setError(error.message || 'فشل في بدء البث. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // تنظيف الموارد عند المغادرة
  useEffect(() => {
    return () => {
      if (zegoInstanceRef.current) {
        try {
          zegoInstanceRef.current.destroy();
        } catch (error) {
          console.error('Error destroying zego instance:', error);
        }
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-white">يجب تسجيل الدخول</h2>
            <p className="text-gray-300 mb-4">يجب عليك تسجيل الدخول لبدء البث المباشر</p>
            <Button onClick={() => setLocation("/login")} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إذا كان البث نشطاً، عرض واجهة البث
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
            <span className="text-red-400 font-bold">مباشر</span>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Radio className="w-8 h-8" />
            البث المباشر المحسن
          </h1>
          <p className="text-purple-200">بث مباشر بجودة عالية باستخدام ZegoCloud</p>
        </div>

        <Card className="bg-black/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-center">إعداد البث المباشر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* عنوان البث */}
            <div>
              <label className="block text-purple-200 mb-2">عنوان البث</label>
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="أدخل عنوان البث..."
                className="bg-white/20 border-purple-500/30 text-white placeholder:text-purple-300"
                disabled={isLoading}
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
                onClick={startUnifiedStream}
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
              <p className="mb-2">🎥 مميزات البث المحسن:</p>
              <ul className="text-xs space-y-1 opacity-80">
                <li>• جودة فيديو عالية HD</li>
                <li>• دردشة مباشرة مع المشاهدين</li>
                <li>• مشاركة الشاشة (اختياري)</li>
                <li>• رؤية عدد المشاهدين الحقيقي</li>
                <li>• تسجيل آمن عبر ZegoCloud</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}