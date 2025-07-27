import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DirectStreamViewerProps {
  stream: any;
}

export default function DirectStreamViewer({ stream }: DirectStreamViewerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [isConnected, setIsConnected] = useState(false);
  const isStreamer = user?.id === stream.hostId;

  useEffect(() => {
    // انتظار تحميل المكون بالكامل قبل تهيئة البث
    const timer = setTimeout(() => {
      if (videoRef.current) {
        initializeStream();
      }
    }, 100);
    
    const interval = setInterval(() => {
      setViewerCount((prev: number) => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      cleanup();
    };
  }, [stream.id]); // إعادة التهيئة عند تغيير البث

  const initializeStream = async () => {
    setIsLoading(true);

    try {
      if (isStreamer) {
        await startStreamerCamera();
      } else {
        await connectToRealStream();
      }
    } catch (error) {
      console.error('Stream initialization error:', error);
      await showConnectionMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const startStreamerCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // منع الصدى
        videoRef.current.style.transform = 'scaleX(-1)'; // تأثير المرآة
        await videoRef.current.play();
        setIsConnected(true);
        console.log('✅ Camera stream started for streamer');
      }
    } catch (error) {
      console.error('Camera access error:', error);
      throw error;
    }
  };

  const connectToRealStream = async () => {
    try {
      // انتظار تحميل DOM بالكامل
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!videoRef.current) {
          throw new Error('Video element not ready');
        }
      }

      console.log('🔗 Attempting to connect to ZegoCloud stream...');
      
      // الحصول على إعدادات ZegoCloud
      const config = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());

      if (!config.appId) {
        throw new Error('ZegoCloud config not available');
      }

      const streamId = (stream as any).zegoStreamId || `stream_${stream.id}`;
      const roomId = (stream as any).zegoRoomId || `room_${stream.id}`;

      console.log('📡 ZegoCloud connection details:', {
        appId: config.appId,
        roomId,
        streamId,
        userId: config.userID || 'viewer_' + Date.now()
      });
        
      // تحميل وتهيئة ZegoCloud SDK
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      
      // تسجيل دخول للغرفة أولاً
      await zg.loginRoom(roomId, {
        userID: config.userID || 'viewer_' + Date.now(),
        userName: config.userName || 'مشاهد'
      }, config.token);

      console.log('✅ Successfully logged into ZegoCloud room');

      // انتظار ثانية للتأكد من اكتمال تسجيل الدخول
      await new Promise(resolve => setTimeout(resolve, 1000));

      // بدء تشغيل البث مع تحديد عنصر الفيديو
      const remoteStream = await zg.startPlayingStream(streamId, {
        video: videoRef.current,
        audio: true
      });
        
      if (videoRef.current && remoteStream) {
        // تطبيق خصائص الفيديو
        videoRef.current.srcObject = remoteStream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.controls = false;
        videoRef.current.muted = isMuted;
        
        // تشغيل الفيديو
        await videoRef.current.play();
        setIsConnected(true);
        
        console.log('✅ Successfully connected to real ZegoCloud stream!');
        console.log('🎥 Remote stream details:', remoteStream);
        return;
      }
      
      throw new Error('Failed to attach remote stream to video element');
    } catch (error) {
      console.error('❌ ZegoCloud connection failed:', error);
      throw error;
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
      
      // خلفية
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(0.5, '#2d2d2d');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // رسالة الاتصال
      ctx.fillStyle = 'white';
      ctx.font = 'bold 100px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔄 جاري الاتصال بالمضيف...', canvas.width / 2, canvas.height / 2 - 150);
      
      ctx.font = '80px Arial';
      ctx.fillStyle = '#60A5FA';
      ctx.fillText('سيظهر البث الحقيقي خلال لحظات', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = '70px Arial';
      ctx.fillStyle = '#34D399';
      ctx.fillText((stream as any).title || 'بث مباشر', canvas.width / 2, canvas.height / 2 + 50);
      
      // مؤشر الحالة المباشرة
      const liveSize = 50 + Math.sin(frame * 0.1) * 20;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(300, 300, liveSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 مباشر', 400, 330);
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const stream = canvas.captureStream(30);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = isMuted;
    }
    
    // إعادة المحاولة كل 5 ثوانٍ
    setTimeout(() => {
      if (!isConnected) {
        connectToRealStream().catch(() => {
          console.log('🔄 Retrying connection...');
        });
      }
    }, 5000);
  };

  const cleanup = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleAudio = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleClose = () => {
    cleanup();
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* فيديو البث الرئيسي */}
      <div className="w-full h-full relative">
        <video
          ref={videoRef}
          id="liveVideo"
          autoPlay
          playsInline
          controls={false}
          muted={isMuted}
          className="w-full h-full object-cover"
          onLoadedData={() => console.log('🎥 Video loaded successfully')}
          onError={(e) => console.error('❌ Video error:', e)}
        />

        {/* طبقة التحميل */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
            <div className="text-center text-white">
              <div className="w-24 h-24 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
              <h3 className="text-4xl font-bold mb-4">
                {isStreamer ? 'جاري تشغيل الكاميرا...' : 'جاري الاتصال بالبث الحقيقي...'}
              </h3>
              <p className="text-2xl opacity-80">{stream.title}</p>
              <p className="text-xl opacity-60 mt-2">
                {isStreamer ? 'يرجى السماح للوصول للكاميرا والمايكروفون' : 'سيظهر المضيف الحقيقي خلال ثوانٍ'}
              </p>
            </div>
          </div>
        )}

        {/* أزرار التحكم العلوية */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-16 h-16 p-0"
            >
              <X className="w-8 h-8" />
            </Button>

            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              {/* زر التحكم في الصوت */}
              <Button
                onClick={toggleAudio}
                variant="ghost"
                className={`rounded-full w-14 h-14 p-0 ${
                  isMuted 
                    ? 'bg-red-600/90 hover:bg-red-700' 
                    : 'bg-green-600/90 hover:bg-green-700'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-7 h-7 text-white" />
                ) : (
                  <Volume2 className="w-7 h-7 text-white" />
                )}
              </Button>

              {/* حالة الاتصال */}
              <div className={`px-6 py-4 rounded-full flex items-center space-x-3 rtl:space-x-reverse ${
                isConnected ? 'bg-green-600/90' : 'bg-yellow-600/90'
              }`}>
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-xl font-bold">
                  {isConnected ? (isStreamer ? 'يبث الآن' : 'متصل بالبث') : 'جاري الاتصال...'}
                </span>
              </div>
              
              {/* عدد المشاهدين */}
              <div className="bg-black/60 backdrop-blur-sm px-5 py-4 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <Eye className="w-6 h-6 text-white" />
                <span className="text-white text-xl font-bold">{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* معلومات البث السفلية */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-white text-4xl font-bold mb-3">{stream.title}</h2>
            {stream.description && (
              <p className="text-white/90 text-2xl mb-4">{stream.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-xl">
                <span>التصنيف: {stream.category}</span>
                {isStreamer && (
                  <>
                    <span className="mx-4">•</span>
                    <span className="text-green-400 font-semibold">أنت المضيف - يراك المشاهدون الآن</span>
                  </>
                )}
                <span className="mx-4">•</span>
                <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                  {isConnected ? (isStreamer ? 'البث نشط' : 'متصل بالبث الحقيقي') : 'جاري الاتصال'}
                </span>
              </div>
              <div className="text-white/80 text-xl">
                بدأ منذ {Math.floor((Date.now() - new Date(stream.startedAt!).getTime()) / 60000)} دقيقة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}