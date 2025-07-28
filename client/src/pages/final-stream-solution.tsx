import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, Loader2, AlertCircle } from 'lucide-react';

const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

export default function FinalStreamSolutionPage() {
  const { user } = useAuth();
  const { mode } = useParams();
  const [, setLocation] = useLocation();
  const [streamId, setStreamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const zegoRef = useRef<any>(null);

  // بدء البث كمذيع
  const startHostStream = async () => {
    if (!user || !containerRef.current) return;

    try {
      setIsLoading(true);
      setError('');
      setStatus('جاري إنشاء البث...');

      // إنشاء البث
      const response = await apiRequest('/api/streams', 'POST', {
        title: 'بث مباشر نهائي',
        description: 'حل نهائي لمشكلة نقل الفيديو والصوت'
      });

      const streamId = response.data.id;
      setStreamId(streamId);
      
      // تحديد معرفات واضحة
      const roomId = `room_${streamId}`;
      const streamPublishId = `stream_${streamId}`;
      
      // تحديث البث
      await apiRequest(`/api/streams/${streamId}`, 'PATCH', {
        zegoRoomId: roomId,
        zegoStreamId: streamPublishId
      });

      setStatus('جاري الحصول على إعدادات البث...');
      const config = await apiRequest('/api/zego-config', 'GET');
      
      // إنشاء token للمذيع
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        user.id, // معرف المستخدم
        user.username || 'Host'
      );

      setStatus('جاري الاتصال بخادم البث...');
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zp;

      // الانضمام كمذيع مع إعدادات محسنة
      await zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
            liveStreamingMode: ZegoUIKitPrebuilt.LiveStreamingMode_RealTime,
          }
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: false,
        showRemoveUserButton: false,
        showPinButton: false,
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        videoCodec: 'H264',
        onJoinRoom: () => {
          console.log('✅ المذيع انضم للغرفة');
          console.log('Room ID:', roomId);
          console.log('User ID:', user.id);
          console.log('Stream Publish ID:', streamPublishId);
          setStatus('البث جاري بنجاح! رابط المشاهدة:');
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 مشاهدون جدد:', users);
          setStatus(`البث جاري - ${users.length} مشاهد`);
        },
        onLeaveRoom: () => {
          endStream();
        }
      });

    } catch (error: any) {
      console.error('❌ خطأ في البث:', error);
      setError(error.message || 'فشل في بدء البث');
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  // مشاهدة البث
  const watchStream = async (streamIdToWatch: number) => {
    if (!user || !containerRef.current) return;

    try {
      setIsLoading(true);
      setError('');
      setStatus('جاري الاتصال بالبث...');

      // الحصول على معلومات البث
      const streamData = await apiRequest(`/api/streams/${streamIdToWatch}`, 'GET');
      
      if (!streamData.data || !streamData.data.zegoRoomId) {
        throw new Error('البث غير متاح');
      }

      const roomId = streamData.data.zegoRoomId;
      
      setStatus('جاري تحميل البث...');
      const config = await apiRequest('/api/zego-config', 'GET');
      
      // إنشاء token للمشاهد
      const viewerId = `viewer_${user.id}_${Date.now()}`;
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        viewerId,
        `Viewer_${user.username}`
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zp;

      // الانضمام كمشاهد
      await zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Audience,
            liveStreamingMode: ZegoUIKitPrebuilt.LiveStreamingMode_RealTime,
          }
        },
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        showMyCameraToggleButton: false,
        showMyMicrophoneToggleButton: false,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: false,
        showRemoveUserButton: false,
        showPinButton: false,
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        videoCodec: 'H264',
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        autoStart: true,
        onJoinRoom: () => {
          console.log('✅ المشاهد انضم للغرفة');
          console.log('Room ID:', roomId);
          console.log('Viewer ID:', viewerId);
          setStatus('متصل بالبث - في انتظار المذيع...');
        },
        onRoomStreamUpdate: (roomID: string, updateType: string, streamList: any[]) => {
          console.log('🔄 تحديث البث:', { roomID, updateType, count: streamList.length });
          if (updateType === 'ADD' && streamList.length > 0) {
            setStatus('🎥 تم استقبال البث بنجاح!');
            console.log('📡 البثوث المستقبلة:', streamList);
          }
        },
        onLeaveRoom: () => {
          setStatus('تم قطع الاتصال');
        }
      });

    } catch (error: any) {
      console.error('❌ خطأ في المشاهدة:', error);
      setError(error.message || 'فشل في الاتصال بالبث');
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  const endStream = async () => {
    try {
      if (streamId) {
        await apiRequest(`/api/streams/${streamId}/end`, 'POST');
      }
      if (zegoRef.current) {
        zegoRef.current.destroy();
        zegoRef.current = null;
      }
      setStreamId(null);
      setStatus('');
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  // تحديد الوضع من الرابط
  useEffect(() => {
    if (mode === 'host' && user) {
      startHostStream();
    } else if (mode?.startsWith('watch-') && user) {
      const streamIdToWatch = parseInt(mode.replace('watch-', ''));
      if (!isNaN(streamIdToWatch)) {
        watchStream(streamIdToWatch);
      }
    }
  }, [mode, user]);

  // تنظيف عند الخروج
  useEffect(() => {
    return () => {
      if (zegoRef.current) {
        zegoRef.current.destroy();
      }
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          🎯 الحل النهائي للبث المباشر
        </h1>

        {/* الحالة والأخطاء */}
        {status && (
          <Card className="p-4 mb-4 bg-green-900/20 border-green-500">
            <p className="text-green-200 text-center font-bold">{status}</p>
            {streamId && mode === 'host' && (
              <div className="mt-2 p-3 bg-black/50 rounded">
                <p className="text-white text-sm mb-2">رابط المشاهدة:</p>
                <code className="text-green-400 block p-2 bg-black rounded">
                  {window.location.origin}/final-stream/watch-{streamId}
                </code>
                <Button
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/final-stream/watch-${streamId}`);
                    alert('تم نسخ الرابط!');
                  }}
                >
                  نسخ الرابط
                </Button>
              </div>
            )}
          </Card>
        )}

        {error && (
          <Card className="p-4 mb-4 bg-red-900/20 border-red-500">
            <div className="flex items-center text-red-200">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </Card>
        )}

        {/* اختيار الوضع */}
        {!mode && (
          <Card className="p-6 bg-gray-800/50 backdrop-blur">
            <h2 className="text-xl font-bold text-white mb-4">اختر دورك:</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setLocation('/final-stream/host')}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Radio className="mr-2" />
                بدء بث جديد
              </Button>
              <Button
                onClick={() => {
                  const streamId = prompt('أدخل رقم البث:');
                  if (streamId) {
                    setLocation(`/final-stream/watch-${streamId}`);
                  }
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="mr-2" />
                مشاهدة بث
              </Button>
            </div>
          </Card>
        )}

        {/* حاوية البث */}
        <div 
          ref={containerRef}
          className="w-full h-[600px] bg-black rounded-lg overflow-hidden mt-6"
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* زر الإنهاء */}
        {(mode === 'host' || mode?.startsWith('watch-')) && !isLoading && (
          <Button
            onClick={() => {
              endStream();
              setLocation('/final-stream');
            }}
            variant="destructive"
            size="lg"
            className="w-full mt-4"
          >
            إنهاء البث
          </Button>
        )}

        {/* تعليمات */}
        <Card className="mt-6 p-4 bg-yellow-900/20">
          <h3 className="text-yellow-200 font-bold mb-2">📝 تعليمات مهمة:</h3>
          <ol className="text-yellow-100 space-y-1 text-sm">
            <li>1. المذيع: اضغط "بدء بث جديد" وانسخ الرابط</li>
            <li>2. المشاهد: افتح الرابط في متصفح آخر أو جهاز آخر</li>
            <li>3. تأكد من السماح بالكاميرا والميكروفون للمذيع</li>
            <li>4. انتظر 3-5 ثواني حتى يستقر الاتصال</li>
            <li>5. إذا لم يعمل، جرب تحديث الصفحة لكلا الطرفين</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}