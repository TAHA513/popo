import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { Radio, Users, Video, Copy, ExternalLink } from 'lucide-react';

// ZegoUIKitPrebuilt
const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

export default function SimpleLiveStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zegoRef = useRef<any>(null);

  // بدء البث كمذيع
  const startHostStream = async () => {
    if (!user || !containerRef.current) return;

    try {
      // إنشاء البث في قاعدة البيانات
      const response = await apiRequest('/api/streams', 'POST', {
        title: 'بث مباشر',
        description: 'بث تجريبي'
      });

      const streamId = response.data.id;
      const zegoRoomId = `live_${streamId}`;
      
      // تحديث البث
      await apiRequest(`/api/streams/${streamId}`, 'PATCH', {
        zegoRoomId,
        zegoStreamId: `host_${user.id}`
      });

      // الحصول على إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        zegoRoomId,
        user.id,
        user.username
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zp;

      // إعدادات المذيع
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
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        onJoinRoom: () => {
          console.log('✅ Host joined room');
          setIsStreaming(true);
          setRoomId(zegoRoomId);
          setStreamUrl(`${window.location.origin}/stream/${streamId}`);
        },
        onLeaveRoom: () => {
          endStream();
        }
      });

    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  // مشاهدة بث موجود
  const watchStream = async () => {
    if (!user || !containerRef.current || !roomId) return;

    try {
      const config = await apiRequest('/api/zego-config', 'GET');
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        `viewer_${user.id}`,
        `Viewer_${user.username}`
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zp;

      // إعدادات المشاهد
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
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        onJoinRoom: () => {
          console.log('✅ Viewer joined room');
          setIsStreaming(true);
        },
        onLeaveRoom: () => {
          endStream();
        }
      });

    } catch (error) {
      console.error('Error watching stream:', error);
    }
  };

  const endStream = () => {
    if (zegoRef.current) {
      zegoRef.current.destroy();
      zegoRef.current = null;
    }
    setIsStreaming(false);
    setIsHost(false);
    setRoomId('');
    setStreamUrl('');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">🎥 البث المباشر البسيط</h1>

        {!isStreaming && (
          <div className="space-y-6">
            {/* خيارات البدء */}
            <Card className="p-6 bg-black/20 backdrop-blur">
              <h2 className="text-xl font-bold text-white mb-4">اختر دورك:</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setIsHost(true);
                    startHostStream();
                  }}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Radio className="mr-2" />
                  بدء بث جديد
                </Button>
                <Button
                  onClick={() => setIsHost(false)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="mr-2" />
                  مشاهدة بث
                </Button>
              </div>
            </Card>

            {/* إدخال معرف الغرفة للمشاهدة */}
            {isHost === false && (
              <Card className="p-6 bg-black/20 backdrop-blur">
                <h3 className="text-lg font-bold text-white mb-4">أدخل معرف الغرفة:</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="مثال: live_123"
                    className="flex-1 px-4 py-2 bg-black/50 text-white rounded border border-white/20"
                  />
                  <Button onClick={watchStream} className="bg-green-600 hover:bg-green-700">
                    <Video className="mr-2" />
                    مشاهدة
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* واجهة البث */}
        {isStreaming && (
          <div className="space-y-6">
            {/* معلومات البث */}
            {isHost && streamUrl && (
              <Card className="p-4 bg-black/20 backdrop-blur">
                <h3 className="text-white font-bold mb-2">معلومات البث:</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-300">معرف الغرفة: </span>
                    <code className="text-green-400">{roomId}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">رابط المشاهدة: </span>
                    <input
                      type="text"
                      value={streamUrl}
                      readOnly
                      className="flex-1 px-2 py-1 bg-black/50 text-white rounded text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(streamUrl)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => window.open(streamUrl, '_blank')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* حاوية البث */}
            <div 
              ref={containerRef}
              className="w-full h-[600px] bg-black rounded-lg overflow-hidden"
            />

            {/* زر الإنهاء */}
            <Button
              onClick={endStream}
              size="lg"
              variant="destructive"
              className="w-full"
            >
              إنهاء البث
            </Button>
          </div>
        )}

        {/* تعليمات */}
        <Card className="mt-8 p-6 bg-yellow-900/20 backdrop-blur">
          <h3 className="text-yellow-200 font-bold mb-2">📝 تعليمات:</h3>
          <ol className="text-yellow-100 space-y-1 text-sm">
            <li>1. المذيع: اضغط "بدء بث جديد" وانسخ معرف الغرفة</li>
            <li>2. المشاهد: اضغط "مشاهدة بث" وأدخل معرف الغرفة</li>
            <li>3. تأكد من السماح بالكاميرا والميكروفون للمذيع</li>
            <li>4. استخدم متصفحين مختلفين أو جهازين للاختبار</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}