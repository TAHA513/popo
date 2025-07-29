import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { Radio, Users, Video, Mic, MicOff, VideoOff, Copy, Loader2 } from 'lucide-react';

// استيراد ZegoExpressEngine مباشرة
const ZegoExpressEngine = (window as any).ZegoExpressEngine;

export default function DirectZegoStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'host' | 'viewer' | null>(null);
  const [roomId, setRoomId] = useState('');
  const [streamId, setStreamId] = useState('');
  const [dbStreamId, setDbStreamId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const zegoEngineRef = useRef<any>(null);

  // بدء البث كمذيع
  const startAsHost = async () => {
    try {
      setIsLoading(true);
      setStatus('جاري إعداد البث...');

      // 1. إنشاء البث في قاعدة البيانات
      const response = await apiRequest('/api/streams', 'POST', {
        title: 'بث مباشر مع ZegoExpressEngine',
        description: 'بث مباشر بتقنية WebRTC'
      });

      const streamDbId = response.data.id;
      setDbStreamId(streamDbId);

      const zegoRoomId = `room_${streamDbId}`;
      const zegoStreamId = `stream_${streamDbId}`;
      
      setRoomId(zegoRoomId);
      setStreamId(zegoStreamId);

      // تحديث البث
      await apiRequest(`/api/streams/${streamDbId}`, 'PATCH', {
        zegoRoomId,
        zegoStreamId
      });

      // 2. الحصول على إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      
      // 3. إنشاء محرك Zego
      const appID = parseInt(config.appId);
      const appSign = config.appSign;
      
      if (!ZegoExpressEngine) {
        throw new Error('ZegoExpressEngine غير متاح');
      }

      const zego = new ZegoExpressEngine(appID, appSign);
      zegoEngineRef.current = zego;

      // 4. الحصول على الكاميرا والميكروفون
      setStatus('جاري الحصول على الكاميرا والميكروفون...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      
      // عرض الفيديو المحلي
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 5. تسجيل الدخول للغرفة
      setStatus('جاري الاتصال بالغرفة...');
      const userInfo = {
        userID: user?.id || 'host',
        userName: user?.username || 'Host'
      };

      const loginResult = await zego.loginRoom(zegoRoomId, userInfo, {
        userUpdate: true,
        maxMemberCount: 100
      });

      console.log('Login result:', loginResult);

      // 6. بدء البث
      setStatus('جاري بدء البث...');
      await zego.startPublishingStream(zegoStreamId, {
        camera: {
          video: true,
          audio: true
        }
      });
      
      // إرسال البث المحلي
      await zego.setLocalVideoSource(stream);
      await zego.setLocalAudioSource(stream);

      setIsConnected(true);
      setStatus('البث جاري بنجاح! شارك معرف الغرفة مع المشاهدين');

      // 7. الاستماع للأحداث
      zego.on('roomStreamUpdate', (roomID: string, updateType: string, streamList: any[]) => {
        console.log('Stream update:', { roomID, updateType, streamList });
      });

      zego.on('roomUserUpdate', (roomID: string, updateType: string, userList: any[]) => {
        console.log('User update:', { roomID, updateType, userList });
        if (updateType === 'ADD') {
          setStatus(`البث جاري - انضم ${userList.length} مشاهد`);
        }
      });

    } catch (error: any) {
      console.error('Error starting host:', error);
      setStatus(`خطأ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // مشاهدة البث
  const startAsViewer = async () => {
    try {
      setIsLoading(true);
      setStatus('جاري الاتصال بالبث...');

      if (!roomId) {
        setStatus('يرجى إدخال معرف الغرفة');
        return;
      }

      // 1. الحصول على إعدادات ZegoCloud
      const config = await apiRequest('/api/zego-config', 'GET');
      
      // 2. إنشاء محرك Zego
      const appID = parseInt(config.appId);
      const appSign = config.appSign;
      
      if (!ZegoExpressEngine) {
        throw new Error('ZegoExpressEngine غير متاح');
      }

      const zego = new ZegoExpressEngine(appID, appSign);
      zegoEngineRef.current = zego;

      // 3. تسجيل الدخول للغرفة
      setStatus('جاري الدخول للغرفة...');
      const userInfo = {
        userID: `viewer_${user?.id || Date.now()}`,
        userName: `Viewer_${user?.username || 'Guest'}`
      };

      const loginResult = await zego.loginRoom(roomId, userInfo, {
        userUpdate: true,
        maxMemberCount: 100
      });

      console.log('Viewer login result:', loginResult);

      // 4. الاستماع للبثوث
      zego.on('roomStreamUpdate', async (roomID: string, updateType: string, streamList: any[]) => {
        console.log('Viewer stream update:', { roomID, updateType, streamList });
        
        if (updateType === 'ADD' && streamList.length > 0) {
          setStatus('تم العثور على البث! جاري الاستقبال...');
          
          for (const streamInfo of streamList) {
            try {
              // استقبال البث
              const remoteStream = await zego.startPlayingStream(streamInfo.streamID, {
                video: true,
                audio: true
              });

              console.log('Playing stream:', streamInfo.streamID);
              setRemoteStream(remoteStream);
              
              // عرض الفيديو البعيد
              if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                setStatus('البث جاري الاستقبال بنجاح!');
              }
            } catch (playError) {
              console.error('Error playing stream:', playError);
            }
          }
        }
      });

      zego.on('roomUserUpdate', (roomID: string, updateType: string, userList: any[]) => {
        console.log('Viewer user update:', { roomID, updateType, userList });
      });

      setIsConnected(true);
      setStatus('متصل بالغرفة - في انتظار البث...');

    } catch (error: any) {
      console.error('Error starting viewer:', error);
      setStatus(`خطأ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // إنهاء البث
  const endStream = async () => {
    try {
      if (zegoEngineRef.current) {
        if (mode === 'host' && streamId) {
          await zegoEngineRef.current.stopPublishingStream();
        }
        await zegoEngineRef.current.logoutRoom();
        zegoEngineRef.current.destroy();
        zegoEngineRef.current = null;
      }

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      if (dbStreamId) {
        await apiRequest(`/api/streams/${dbStreamId}/end`, 'POST');
      }

      setIsConnected(false);
      setMode(null);
      setRoomId('');
      setStreamId('');
      setStatus('');
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  // تنظيف عند الخروج
  useEffect(() => {
    return () => {
      if (zegoEngineRef.current) {
        zegoEngineRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          🎯 البث المباشر مع ZegoExpressEngine
        </h1>

        {/* الحالة */}
        {status && (
          <Card className="p-4 mb-4 bg-black/20 backdrop-blur text-center">
            <p className="text-white font-bold">{status}</p>
          </Card>
        )}

        {/* اختيار الوضع */}
        {!mode && !isConnected && (
          <Card className="p-6 bg-black/20 backdrop-blur">
            <h2 className="text-xl font-bold text-white mb-4">اختر دورك:</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setMode('host')}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Radio className="mr-2" />
                بدء بث جديد
              </Button>
              <Button
                onClick={() => setMode('viewer')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="mr-2" />
                مشاهدة بث
              </Button>
            </div>
          </Card>
        )}

        {/* واجهة المذيع */}
        {mode === 'host' && !isConnected && (
          <Card className="p-6 bg-black/20 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4">إعدادات البث:</h3>
            <Button
              onClick={startAsHost}
              disabled={isLoading}
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  جاري الإعداد...
                </>
              ) : (
                <>
                  <Video className="mr-2" />
                  بدء البث الآن
                </>
              )}
            </Button>
          </Card>
        )}

        {/* واجهة المشاهد */}
        {mode === 'viewer' && !isConnected && (
          <Card className="p-6 bg-black/20 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4">أدخل معرف الغرفة:</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="مثال: room_123"
                className="w-full px-4 py-2 bg-black/50 text-white rounded border border-white/20"
              />
              <Button
                onClick={startAsViewer}
                disabled={isLoading || !roomId}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    جاري الاتصال...
                  </>
                ) : (
                  <>
                    <Video className="mr-2" />
                    مشاهدة البث
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* معلومات البث للمذيع */}
        {mode === 'host' && isConnected && roomId && (
          <Card className="p-4 mb-4 bg-green-900/20 border-green-500">
            <h3 className="text-green-200 font-bold mb-2">معلومات البث:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-300">معرف الغرفة:</span>
                <code className="text-green-400 bg-black/50 px-2 py-1 rounded flex-1">{roomId}</code>
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
        )}

        {/* عرض الفيديو */}
        {(mode === 'host' || mode === 'viewer') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* الفيديو المحلي (للمذيع فقط) */}
            {mode === 'host' && (
              <div>
                <h3 className="text-white font-bold mb-2">الكاميرا المحلية:</h3>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[400px] bg-black rounded object-cover"
                />
              </div>
            )}

            {/* الفيديو البعيد (للمشاهد أو عرض المشاهدين للمذيع) */}
            <div className={mode === 'viewer' ? 'md:col-span-2' : ''}>
              <h3 className="text-white font-bold mb-2">
                {mode === 'host' ? 'المشاهدون:' : 'البث المباشر:'}
              </h3>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-[400px] bg-black rounded object-cover"
              />
            </div>
          </div>
        )}

        {/* زر الإنهاء */}
        {isConnected && (
          <Button
            onClick={endStream}
            variant="destructive"
            size="lg"
            className="w-full mt-6"
          >
            إنهاء البث
          </Button>
        )}

        {/* تعليمات */}
        <Card className="mt-6 p-4 bg-yellow-900/20">
          <h3 className="text-yellow-200 font-bold mb-2">📝 تعليمات:</h3>
          <ol className="text-yellow-100 space-y-1 text-sm">
            <li>1. المذيع: اضغط "بدء بث جديد" ثم "بدء البث الآن"</li>
            <li>2. انسخ معرف الغرفة وشاركه مع المشاهدين</li>
            <li>3. المشاهد: اضغط "مشاهدة بث" وأدخل معرف الغرفة</li>
            <li>4. تأكد من السماح بالكاميرا والميكروفون للمذيع</li>
            <li>5. استخدم متصفح Chrome أو Edge للحصول على أفضل أداء</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}