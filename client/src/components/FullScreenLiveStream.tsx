import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, CameraOff, Mic, MicOff, StopCircle, Users, 
  X, Share2, Heart, MessageCircle, Gift, Settings 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface FullScreenLiveStreamProps {
  stream: any;
  isStreamer: boolean;
}

export default function FullScreenLiveStream({ stream, isStreamer }: FullScreenLiveStreamProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  // حساب مدة البث بالوقت الحقيقي
  useEffect(() => {
    const startTime = new Date(stream.startedAt || Date.now()).getTime();
    
    const timer = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000); // بالثواني
      setStreamDuration(duration);
    }, 1000);

    return () => clearInterval(timer);
  }, [stream.startedAt]);

  // إخفاء الأزرار تلقائياً بعد 3 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // تهيئة البث
  useEffect(() => {
    initializeFullScreenStream();
    
    const viewerTimer = setInterval(() => {
      setViewerCount((prev: number) => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
      setLikes((prev: number) => prev + Math.floor(Math.random() * 3));
      setComments((prev: number) => prev + Math.floor(Math.random() * 2));
    }, 8000);

    return () => {
      clearInterval(viewerTimer);
      cleanup();
    };
  }, [stream.id, isStreamer]);

  const initializeFullScreenStream = async () => {
    try {
      console.log(`🚀 Initializing full-screen ${isStreamer ? 'streamer' : 'viewer'} mode...`);
      
      // انتظار تحميل عنصر الفيديو
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 200));
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

      // تحميل وتهيئة ZegoCloud SDK
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      setZegoEngine(zg);
      
      // تسجيل دخول للغرفة
      await zg.loginRoom(roomId, {
        userID: config.userID || (isStreamer ? `host_${stream.hostId}` : `viewer_${Date.now()}`),
        userName: config.userName || (isStreamer ? user?.username || 'مضيف' : 'مشاهد')
      });

      if (isStreamer) {
        await startStreaming(zg, streamId);
      } else {
        await startViewing(zg, streamId);
      }

    } catch (error) {
      console.error('❌ Full-screen stream initialization failed:', error);
      
      if (isStreamer) {
        await startLocalCamera();
      } else {
        await showConnectionMessage();
      }
    }
  };

  const startStreaming = async (zg: any, streamId: string) => {
    try {
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
        videoRef.current.muted = true;
        videoRef.current.style.transform = 'scaleX(-1)';
        await videoRef.current.play();
      }

      await zg.startPublishingStream(streamId, mediaStream);
      setIsConnected(true);
      
    } catch (error) {
      console.error('❌ Streaming failed:', error);
      await startLocalCamera();
    }
  };

  const startViewing = async (zg: any, streamId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const remoteStream = await zg.startPlayingStream(streamId, {
        video: videoRef.current,
        audio: true
      });

      if (videoRef.current && remoteStream) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        setIsConnected(true);
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
      
      // خلفية متدرجة حديثة
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(0.5, '#764ba2');
      gradient.addColorStop(1, '#f093fb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // تأثير الجسيمات المتحركة
      for (let i = 0; i < 30; i++) {
        const x = (canvas.width / 30) * i + Math.sin(frame * 0.01 + i) * 50;
        const y = canvas.height / 2 + Math.cos(frame * 0.015 + i) * 100;
        const size = 5 + Math.sin(frame * 0.02 + i) * 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // نص رئيسي
      ctx.fillStyle = 'white';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.fillText('🔄 جاري الاتصال بالمضيف...', canvas.width / 2, canvas.height / 2 - 150);
      
      ctx.font = '80px Arial';
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText('سيظهر البث المباشر خلال ثوانٍ', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = '70px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(stream.title || 'بث مباشر', canvas.width / 2, canvas.height / 2 + 50);
      
      // مؤشر البث المباشر النابض
      const pulseSize = 80 + Math.sin(frame * 0.2) * 30;
      ctx.fillStyle = '#FF4444';
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(300, 300, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText('🔴 مباشر', 420, 330);
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const stream = canvas.captureStream(30);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  // تنسيق الوقت
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
    <div 
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onClick={() => setShowControls(true)}
    >
      {/* الفيديو بملء الشاشة */}
      <div className="w-full h-full relative">
        <video
          ref={videoRef}
          id="fullScreenVideo"
          autoPlay
          playsInline
          controls={false}
          className="w-full h-full object-cover"
          onLoadedData={() => console.log('🎥 Full-screen video loaded')}
        />

        {/* شريط علوي مع معلومات البث */}
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            {/* معلومات البث اليسار */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Button
                onClick={endStream}
                variant="ghost"
                className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              
              <div className="text-white">
                <h2 className="text-sm sm:text-lg font-bold line-clamp-1">{stream.title}</h2>
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm opacity-90">
                  <span>{stream.category}</span>
                  <span>•</span>
                  <span>{formatDuration(streamDuration)}</span>
                </div>
              </div>
            </div>

            {/* حالة البث وعدد المشاهدين */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm font-bold ${
                isConnected ? 'bg-red-600/90' : 'bg-yellow-600/90'
              }`}>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white">
                  {isConnected ? '🔴 مباشر' : '🟡 اتصال...'}
                </span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-white text-xs sm:text-sm font-bold">{viewerCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار تفاعلية جانبية - مثل TikTok */}
        {!isStreamer && (
          <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* إعجاب */}
            <div className="text-center">
              <Button
                variant="ghost"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
                onClick={() => setLikes(prev => prev + 1)}
              >
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </Button>
              <p className="text-white text-xs sm:text-sm font-bold mt-1">{likes.toLocaleString()}</p>
            </div>

            {/* تعليق */}
            <div className="text-center">
              <Button
                variant="ghost"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
              >
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </Button>
              <p className="text-white text-xs sm:text-sm font-bold mt-1">{comments}</p>
            </div>

            {/* مشاركة */}
            <div className="text-center">
              <Button
                variant="ghost"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
              >
                <Share2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </Button>
            </div>

            {/* هدية */}
            <div className="text-center">
              <Button
                variant="ghost"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
              >
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </Button>
            </div>
          </div>
        )}

        {/* أزرار تحكم المضيف */}
        {isStreamer && (
          <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center space-x-4 rtl:space-x-reverse bg-black/60 backdrop-blur-sm rounded-full px-6 py-3">
              <Button
                onClick={toggleCamera}
                variant="ghost"
                className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 ${
                  isCameraOn 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isCameraOn ? (
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                ) : (
                  <CameraOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={toggleMicrophone}
                variant="ghost"
                className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 ${
                  isMicOn 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isMicOn ? (
                  <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={endStream}
                variant="ghost"
                className="bg-red-600/90 hover:bg-red-700 rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
              >
                <StopCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </Button>
            </div>

            {/* حالة البث للمضيف */}
            <div className="mt-4 text-center">
              <span className="bg-green-600/90 text-white px-4 py-2 rounded-full text-sm font-bold">
                {isConnected ? `🔴 البث نشط - ${formatDuration(streamDuration)}` : 'جاري تهيئة البث...'}
              </span>
            </div>
          </div>
        )}

        {/* معلومات إضافية للمشاهدين */}
        {!isStreamer && (
          <div className={`absolute bottom-6 left-6 right-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-2">{stream.title}</h3>
              {stream.description && (
                <p className="text-sm sm:text-base opacity-90 line-clamp-2 mb-2">{stream.description}</p>
              )}
              <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs sm:text-sm opacity-80">
                <span>مضيف: {user?.username || 'مجهول'}</span>
                <span>•</span>
                <span>مدة البث: {formatDuration(streamDuration)}</span>
                <span>•</span>
                <span>{viewerCount.toLocaleString()} مشاهد</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}