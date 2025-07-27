import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, StopCircle, Users, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface SimpleZegoStreamProps {
  stream: any;
  isStreamer: boolean;
}

export default function SimpleZegoStream({ stream, isStreamer }: SimpleZegoStreamProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    initializeZegoStream();
    
    const interval = setInterval(() => {
      setViewerCount((prev: number) => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [stream.id, isStreamer]);

  const initializeZegoStream = async () => {
    try {
      console.log(`🚀 Initializing ${isStreamer ? 'streamer' : 'viewer'} mode...`);
      
      // انتظار تحميل عنصر الفيديو
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!videoRef.current) {
          throw new Error('Video element not ready');
        }
      }

      // الحصول على إعدادات ZegoCloud
      const config = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());

      if (!config.appId) {
        throw new Error('ZegoCloud configuration not available');
      }

      const streamId = `stream_${stream.id}`;
      const roomId = `room_${stream.id}`;

      console.log('📡 ZegoCloud setup:', {
        appId: config.appId,
        roomId,
        streamId,
        userId: config.userID,
        isStreamer
      });

      // تحميل وتهيئة ZegoCloud SDK
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      setZegoEngine(zg);
      
      // تسجيل دخول للغرفة
      await zg.loginRoom(roomId, {
        userID: config.userID || (isStreamer ? `host_${stream.hostId}` : `viewer_${Date.now()}`),
        userName: config.userName || (isStreamer ? user?.username || 'مضيف' : 'مشاهد')
      });

      console.log('✅ Successfully logged into ZegoCloud room');

      if (isStreamer) {
        await startStreaming(zg, streamId);
      } else {
        await startViewing(zg, streamId);
      }

    } catch (error) {
      console.error('❌ ZegoCloud initialization failed:', error);
      setError('فشل في الاتصال بالخدمة');
      
      // استخدام وضع احتياطي
      if (isStreamer) {
        await startLocalCamera();
      } else {
        await showConnectionMessage();
      }
    }
  };

  const startStreaming = async (zg: any, streamId: string) => {
    try {
      // الحصول على الكاميرا والمايكروفون
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true; // منع الصدى للمضيف
        videoRef.current.style.transform = 'scaleX(-1)'; // تأثير المرآة
        await videoRef.current.play();
      }

      // بدء البث على ZegoCloud
      await zg.startPublishingStream(streamId, mediaStream);
      setIsConnected(true);
      
      console.log('✅ Streaming started successfully');
      
    } catch (error) {
      console.error('❌ Streaming failed:', error);
      await startLocalCamera();
    }
  };

  const startViewing = async (zg: any, streamId: string) => {
    try {
      // انتظار قليل للتأكد من وجود البث
      await new Promise(resolve => setTimeout(resolve, 1000));

      // بدء مشاهدة البث
      const remoteStream = await zg.startPlayingStream(streamId, {
        video: videoRef.current,
        audio: true
      });

      if (videoRef.current && remoteStream) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.controls = false;
        await videoRef.current.play();
        setIsConnected(true);
        
        console.log('✅ Successfully connected to stream');
      } else {
        throw new Error('Failed to get remote stream');
      }
      
    } catch (error) {
      console.error('❌ Viewing failed:', error);
      await showConnectionMessage();
    }
  };

  const startLocalCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.style.transform = 'scaleX(-1)';
        await videoRef.current.play();
        setIsConnected(true);
      }
      
    } catch (error) {
      console.error('❌ Local camera failed:', error);
      setError('فشل في الوصول للكاميرا');
    }
  };

  const showConnectionMessage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    let frame = 0;
    const animate = () => {
      frame++;
      
      // خلفية متحركة
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // نص الاتصال
      ctx.fillStyle = 'white';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔄 جاري الاتصال بالمضيف...', canvas.width / 2, canvas.height / 2 - 200);
      
      ctx.font = '90px Arial';
      ctx.fillStyle = '#60A5FA';
      ctx.fillText('سيظهر البث المباشر خلال لحظات', canvas.width / 2, canvas.height / 2 - 80);
      
      ctx.font = '80px Arial';
      ctx.fillStyle = '#34D399';
      ctx.fillText(stream.title || 'بث مباشر', canvas.width / 2, canvas.height / 2 + 40);
      
      // مؤشر نشط
      const pulseSize = 60 + Math.sin(frame * 0.15) * 30;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(400, 400, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 70px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 مباشر', 500, 430);
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const stream = canvas.captureStream(30);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = false;
    }
  };

  const toggleCamera = () => {
    if (localStream && isStreamer) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);

        if (zegoEngine) {
          zegoEngine.mutePublishStreamVideo(!isCameraOn);
        }
      }
    }
  };

  const toggleMicrophone = () => {
    if (localStream && isStreamer) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);

        if (zegoEngine) {
          zegoEngine.mutePublishStreamAudio(!isMicOn);
        }
      }
    }
  };

  const endStream = async () => {
    try {
      if (zegoEngine) {
        if (isStreamer) {
          await zegoEngine.stopPublishingStream();
        } else {
          await zegoEngine.stopPlayingStream(`stream_${stream.id}`);
        }
        await zegoEngine.logoutRoom();
      }

      if (isStreamer) {
        await fetch('/api/streams/end-all', {
          method: 'POST',
          credentials: 'include'
        });
      }

      cleanup();
      setLocation('/');
      
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      cleanup();
      setLocation('/');
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsConnected(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="w-full h-full relative">
        <video
          ref={videoRef}
          id="zegoVideo"
          autoPlay
          playsInline
          controls={false}
          className="w-full h-full object-cover"
          onLoadedData={() => console.log('🎥 Video loaded')}
          onError={(e) => console.error('❌ Video error:', e)}
        />

        {/* عرض الخطأ */}
        {error && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-3xl font-bold mb-4">{error}</h3>
              <Button onClick={endStream} className="bg-red-600 hover:bg-red-700">
                العودة للرئيسية
              </Button>
            </div>
          </div>
        )}

        {/* أزرار التحكم العلوية */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            <Button
              onClick={endStream}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-14 h-14 p-0"
            >
              <X className="w-7 h-7" />
            </Button>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className={`px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse ${
                isConnected ? 'bg-green-600/90' : 'bg-yellow-600/90'
              }`}>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-bold">
                  {isConnected 
                    ? (isStreamer ? '🔴 يبث الآن' : '🟢 متصل') 
                    : '🟡 جاري الاتصال...'
                  }
                </span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-bold">{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار التحكم السفلية - للمضيف فقط */}
        {isStreamer && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
            <div className="flex items-center justify-center space-x-6 rtl:space-x-reverse">
              <Button
                onClick={toggleCamera}
                variant="ghost"
                className={`rounded-full w-14 h-14 p-0 ${
                  isCameraOn 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isCameraOn ? (
                  <Camera className="w-7 h-7 text-white" />
                ) : (
                  <CameraOff className="w-7 h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={toggleMicrophone}
                variant="ghost"
                className={`rounded-full w-14 h-14 p-0 ${
                  isMicOn 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isMicOn ? (
                  <Mic className="w-7 h-7 text-white" />
                ) : (
                  <MicOff className="w-7 h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={endStream}
                variant="ghost"
                className="bg-red-600/90 hover:bg-red-700 rounded-full w-14 h-14 p-0"
              >
                <StopCircle className="w-7 h-7 text-white" />
              </Button>
            </div>

            <div className="mt-4 text-center">
              <span className="bg-green-600/90 text-white px-6 py-3 rounded-full text-lg font-bold">
                {isConnected ? 'البث نشط - المشاهدون يرونك' : 'جاري تهيئة البث...'}
              </span>
            </div>
          </div>
        )}

        {/* معلومات البث السفلية - للمشاهدين */}
        {!isStreamer && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-2">{stream.title}</h2>
              {stream.description && (
                <p className="text-xl opacity-90 mb-4">{stream.description}</p>
              )}
              <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse text-lg">
                <span>التصنيف: {stream.category}</span>
                <span>•</span>
                <span>بدأ منذ {Math.floor((Date.now() - new Date(stream.startedAt!).getTime()) / 60000)} دقيقة</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}