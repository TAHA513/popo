import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, 
  Users, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

export default function EnhancedUnifiedStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [streamId, setStreamId] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('غير متصل');
  const [mediaStatus, setMediaStatus] = useState({
    camera: false,
    microphone: false,
    streaming: false
  });
  
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);

  // إنهاء البث
  const endStream = async () => {
    try {
      if (streamId) {
        await apiRequest(`/api/streams/${streamId}/end`, 'POST');
      }
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      }
      setIsStreaming(false);
      setStreamId(null);
      setConnectionStatus('غير متصل');
      setMediaStatus({ camera: false, microphone: false, streaming: false });
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  // بدء البث المحسن
  const startEnhancedStream = async () => {
    if (!user || !streamContainerRef.current) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setConnectionStatus('جاري الاتصال...');

      // 1. إنشاء البث في قاعدة البيانات
      const response = await apiRequest('/api/streams', 'POST', {
        title: 'بث تجريبي محسن',
        description: 'اختبار نقل الفيديو والصوت بشكل صحيح'
      });

      if (!response?.data?.id) {
        throw new Error('فشل في إنشاء البث');
      }

      setStreamId(response.data.id);
      setConnectionStatus('تم إنشاء البث');

      // 2. تحديد معرفات البث
      const zegoRoomId = `room_${response.data.id}`;
      const zegoStreamId = `stream_${response.data.id}_${user.id}`;
      
      // تحديث البث بالمعرفات الجديدة
      await apiRequest(`/api/streams/${response.data.id}`, 'PATCH', {
        zegoRoomId,
        zegoStreamId
      });

      // 3. الحصول على إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      if (!config.appId || !config.appSign) {
        throw new Error('إعدادات البث غير متوفرة');
      }

      setConnectionStatus('جاري تهيئة البث...');

      // 4. إنشاء token وتهيئة ZegoCloud
      const hostUserId = String(user.id);
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        zegoRoomId,
        hostUserId,
        user.username || 'Host'
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // 5. الانضمام للغرفة مع إعدادات محسنة
      await zp.joinRoom({
        container: streamContainerRef.current,
        sharedLinks: [{
          name: 'مشاهدة البث',
          url: `${window.location.origin}/stream/${response.data.id}`,
        }],
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
            // تفعيل البث الفوري
            liveStreamingMode: ZegoUIKitPrebuilt.LiveStreamingMode_RealTime,
          }
        },
        // إعدادات الكاميرا والصوت
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: true,
        showRemoveUserButton: false,
        showPinButton: false,
        showLayoutButton: false,
        showLeaveRoomConfirmDialog: false,
        // جودة الفيديو
        videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
        // إعدادات البث المباشر
        enableStereo: true,
        videoCodec: 'H264',
        // الأحداث
        onJoinRoom: () => {
          console.log('✅ انضم المذيع للغرفة');
          console.log('Room ID:', zegoRoomId);
          console.log('User ID:', hostUserId);
          console.log('Stream ID:', zegoStreamId);
          setConnectionStatus('متصل بالغرفة');
          setIsStreaming(true);
        },
        onLiveStart: () => {
          console.log('🔴 بدأ البث المباشر!');
          setConnectionStatus('البث جاري');
          setMediaStatus(prev => ({ ...prev, streaming: true }));
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 انضم مستخدمون:', users);
          users.forEach(u => {
            console.log(`- ${u.userName} (${u.userID})`);
          });
        },
        onCameraStateChanged: (available: boolean) => {
          console.log(`📷 حالة الكاميرا: ${available ? 'مفعلة' : 'معطلة'}`);
          setMediaStatus(prev => ({ ...prev, camera: available }));
        },
        onMicrophoneStateChanged: (available: boolean) => {
          console.log(`🎤 حالة الميكروفون: ${available ? 'مفعل' : 'معطل'}`);
          setMediaStatus(prev => ({ ...prev, microphone: available }));
        },
        onRoomStreamUpdate: (roomID: string, updateType: string, streamList: any[]) => {
          console.log('🔄 تحديث البث:', { roomID, updateType, count: streamList.length });
          if (updateType === 'ADD') {
            console.log('➕ بثوث جديدة:', streamList.map(s => ({
              userID: s.user.userID,
              streamID: s.streamID,
              streamType: s.streamType
            })));
          }
        },
        onLeaveRoom: () => {
          console.log('❌ غادر المذيع الغرفة');
          endStream();
        }
      });

      console.log('✅ تم تهيئة ZegoCloud بنجاح!');
      setConnectionStatus('البث جاري بنجاح');

    } catch (error: any) {
      console.error('❌ خطأ في البث:', error);
      setError(error.message || 'فشل في بدء البث');
      setConnectionStatus('فشل الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  // تنظيف عند الخروج
  useEffect(() => {
    return () => {
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎥 البث المباشر المحسن</h1>
          <p className="text-pink-200">نسخة محسنة لضمان نقل الفيديو والصوت بشكل صحيح</p>
        </div>

        {/* حالة الاتصال */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant={connectionStatus.includes('جاري') ? 'default' : connectionStatus.includes('متصل') ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {connectionStatus === 'البث جاري' ? <CheckCircle className="w-4 h-4 mr-2" /> : <Radio className="w-4 h-4 mr-2" />}
            {connectionStatus}
          </Badge>
          
          {streamId && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              معرف البث: {streamId}
            </Badge>
          )}
        </div>

        {/* حالة الوسائط */}
        {isStreaming && (
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant={mediaStatus.camera ? 'default' : 'destructive'}>
              {mediaStatus.camera ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
              الكاميرا {mediaStatus.camera ? 'مفعلة' : 'معطلة'}
            </Badge>
            <Badge variant={mediaStatus.microphone ? 'default' : 'destructive'}>
              {mediaStatus.microphone ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
              الميكروفون {mediaStatus.microphone ? 'مفعل' : 'معطل'}
            </Badge>
            <Badge variant={mediaStatus.streaming ? 'default' : 'secondary'}>
              <Radio className="w-4 h-4 mr-2" />
              البث {mediaStatus.streaming ? 'نشط' : 'في الانتظار'}
            </Badge>
          </div>
        )}

        {/* رسائل الخطأ */}
        {error && (
          <Card className="bg-red-500/20 border-red-500 p-4 mb-6">
            <div className="flex items-center text-red-200">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </Card>
        )}

        {/* أزرار التحكم */}
        {!isStreaming && (
          <div className="flex justify-center mb-8">
            <Button
              onClick={startEnhancedStream}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-lg px-8 py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  جاري الإعداد...
                </>
              ) : (
                <>
                  <Radio className="w-6 h-6 mr-2" />
                  بدء البث المحسن
                </>
              )}
            </Button>
          </div>
        )}

        {/* واجهة البث */}
        <div 
          ref={streamContainerRef}
          className="w-full h-[600px] bg-black rounded-lg overflow-hidden shadow-2xl relative"
        >
          {!isStreaming && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">اضغط "بدء البث المحسن" للبدء</p>
              </div>
            </div>
          )}
        </div>

        {/* معلومات المشاهدة */}
        {isStreaming && streamId && (
          <Card className="mt-6 p-6 bg-black/20 backdrop-blur-sm border-pink-500/50">
            <h3 className="text-xl font-bold text-white mb-4">🔗 روابط المشاهدة:</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-pink-200 mb-2">رابط المشاهدة المباشر:</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/stream/${streamId}`}
                    readOnly
                    className="flex-1 bg-black/50 text-white px-4 py-2 rounded border border-pink-500/50"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/stream/${streamId}`)}
                    variant="outline"
                    className="border-pink-500 text-pink-200"
                  >
                    نسخ
                  </Button>
                  <Button
                    onClick={() => window.open(`/stream/${streamId}`, '_blank')}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    فتح
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-pink-200 mb-2">معرف الغرفة (للاختبار):</p>
                <code className="bg-black/50 text-green-400 px-4 py-2 rounded block">room_{streamId}</code>
              </div>
            </div>

            <Button
              onClick={endStream}
              variant="destructive"
              size="lg"
              className="w-full mt-6"
            >
              إنهاء البث
            </Button>
          </Card>
        )}

        {/* تعليمات */}
        <Card className="mt-8 p-6 bg-yellow-900/20 backdrop-blur-sm border-yellow-500/50">
          <h3 className="text-xl font-bold text-yellow-200 mb-4">📝 تعليمات مهمة:</h3>
          <ul className="space-y-2 text-yellow-100">
            <li>• تأكد من السماح بالكاميرا والميكروفون عند الطلب</li>
            <li>• استخدم متصفح Chrome أو Edge للحصول على أفضل أداء</li>
            <li>• افتح رابط المشاهدة في متصفح آخر أو جهاز آخر للاختبار</li>
            <li>• انتظر 3-5 ثواني بعد بدء البث حتى يظهر للمشاهدين</li>
            <li>• تحقق من حالة الكاميرا والميكروفون في الشارات أعلاه</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}