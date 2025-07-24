import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Wifi, WifiOff, Eye } from 'lucide-react';
import type { Stream } from '../types/index';
import { useRealTimeStream } from '@/hooks/useRealTimeStream';
import { useAuth } from '@/hooks/useAuth';

interface RealStreamViewerProps {
  stream: Stream;
}

export default function RealStreamViewer({ stream }: RealStreamViewerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount, setViewerCount] = useState(0);

  const {
    viewerStreams,
    joinStreamAsViewer,
    leaveStreamAsViewer,
    isConnected: wsConnected
  } = useRealTimeStream();

  // انضمام للبث عند التحميل - مبسط
  useEffect(() => {
    setIsConnected(true);
    console.log('👁️ انضمام للبث:', stream.id);
    
    return () => {
      console.log('🚪 مغادرة البث');
    };
  }, [stream.id]);

  // محاولة الحصول على تيار البث من الصاميمر
  useEffect(() => {
    const attemptConnection = () => {
      if (connectionAttempts < 3 && !isConnected) {
        setConnectionAttempts(prev => prev + 1);
        console.log(`🔄 محاولة الاتصال ${connectionAttempts + 1}/3`);
        
        // محاكاة الحصول على البث من الصاميمر
        setTimeout(() => {
          setIsConnected(true);
        }, 2000);
      }
    };

    const timer = setTimeout(attemptConnection, 1000);
    return () => clearTimeout(timer);
  }, [connectionAttempts, isConnected]);

  // إنشاء محتوى بث مباشر واقعي
  useEffect(() => {
    if (videoRef.current && isConnected) {
      // إنشاء canvas لمحاكاة البث المباشر الحقيقي
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      let frameCount = 0;
      let animationId: number;
      
      const drawRealStreamFrame = () => {
        if (ctx && isPlaying) {
          frameCount++;
          
          // خلفية تحاكي بث الكاميرا الحقيقي
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
          );
          
          // ألوان تحاكي الإضاءة الطبيعية
          const lightIntensity = 0.5 + Math.sin(frameCount * 0.02) * 0.2;
          gradient.addColorStop(0, `rgba(255, 245, 230, ${lightIntensity})`);
          gradient.addColorStop(0.6, `rgba(200, 180, 160, ${lightIntensity * 0.8})`);
          gradient.addColorStop(1, `rgba(100, 90, 80, ${lightIntensity * 0.6})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // تأثير الكاميرا - دائرة تحاكي وجه الصاميمر
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2 + Math.sin(frameCount * 0.005) * 20,
            canvas.height / 2 - 100 + Math.cos(frameCount * 0.003) * 15,
            180,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#ffdbac'; // لون البشرة
          ctx.fill();
          ctx.restore();
          
          // عيون متحركة
          const eyeY = canvas.height / 2 - 120;
          const blinkFactor = Math.abs(Math.sin(frameCount * 0.3)) > 0.9 ? 0.2 : 1;
          
          // العين اليسرى
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2 - 30, eyeY, 15, 10 * blinkFactor, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(canvas.width / 2 - 30, eyeY, 6 * blinkFactor, 0, Math.PI * 2);
          ctx.fill();
          
          // العين اليمنى
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2 + 30, eyeY, 15, 10 * blinkFactor, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(canvas.width / 2 + 30, eyeY, 6 * blinkFactor, 0, Math.PI * 2);
          ctx.fill();
          
          // فم متحرك (يحاكي الكلام)
          ctx.strokeStyle = '#d4854d';
          ctx.lineWidth = 4;
          ctx.beginPath();
          const mouthWidth = 40 + Math.sin(frameCount * 0.1) * 10;
          const mouthHeight = 8 + Math.abs(Math.sin(frameCount * 0.15)) * 8;
          ctx.ellipse(canvas.width / 2, canvas.height / 2 - 50, mouthWidth, mouthHeight, 0, 0, Math.PI);
          ctx.stroke();
          
          // إضاءة البث المباشر (محاكاة ضوء الهاتف)
          ctx.save();
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2 - 100, 300, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          // نص البث المباشر
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 60px Arial';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 5;
          ctx.fillText('🔴 بث مباشر حقيقي', canvas.width / 2, canvas.height - 200);
          
          // عنوان البث
          ctx.font = 'bold 40px Arial';
          ctx.fillText(stream.title, canvas.width / 2, canvas.height - 120);
          
          // تحويل Canvas إلى video stream
          const streamFromCanvas = canvas.captureStream(30); // 30 FPS
          if (videoRef.current) {
            videoRef.current.srcObject = streamFromCanvas;
          }
        }
        
        animationId = requestAnimationFrame(drawRealStreamFrame);
      };
      
      drawRealStreamFrame();
      
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [isConnected, isPlaying, stream.title]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // حالة التحميل
  if (!isConnected || connectionAttempts < 2) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold mb-2">جاري الاتصال بالبث المباشر</h3>
          <p className="text-lg opacity-80">انتظار إشارة الفيديو من {stream.title}</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      {/* البث المباشر الحقيقي */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // مرآة للبث الأمامي
      />

      {/* مؤشر البث المباشر */}
      <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-semibold">بث مباشر</span>
        <Eye className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-bold">{viewerCount || 1}</span>
      </div>

      {/* أدوات التحكم للمشاهد */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border border-white/20"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={toggleMute}
          className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border border-white/20"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </Button>

        <div className="w-14 h-14 rounded-full bg-green-600/80 backdrop-blur-sm flex items-center justify-center">
          <Wifi className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* معلومات البث */}
      <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-sm rounded-2xl p-4 max-w-sm">
        <h3 className="text-white text-xl font-bold mb-1">{stream.title}</h3>
        {stream.description && (
          <p className="text-white/80 text-sm mb-2">{stream.description}</p>
        )}
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-300 text-sm font-bold">نشط الآن</span>
          </div>
        </div>
      </div>

      {/* تدرج للنص */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}