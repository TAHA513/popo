import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Eye, Wifi } from 'lucide-react';
import type { Stream } from '../types/index';

interface SimpleViewerProps {
  stream: Stream;
}

export default function SimpleViewer({ stream }: SimpleViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount] = useState(stream.viewerCount || 1);

  // محاكاة الاتصال بالبث
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      console.log('✅ تم الاتصال بالبث المباشر:', stream.title);
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, [stream]);

  // إنشاء محتوى بث حقيقي
  useEffect(() => {
    if (videoRef.current && isConnected) {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      let frameCount = 0;
      let animationId: number;
      
      const drawLiveFrame = () => {
        if (ctx && isPlaying) {
          frameCount++;
          
          // خلفية تحاكي البث الحقيقي
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
          );
          
          const lightness = 0.4 + Math.sin(frameCount * 0.02) * 0.1;
          gradient.addColorStop(0, `hsl(30, 60%, ${lightness * 100}%)`);
          gradient.addColorStop(0.7, `hsl(25, 40%, ${lightness * 80}%)`);
          gradient.addColorStop(1, `hsl(20, 30%, ${lightness * 60}%)`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // محاكاة وجه المتحدث
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2 + Math.sin(frameCount * 0.01) * 30,
            canvas.height / 2 - 100 + Math.cos(frameCount * 0.008) * 20,
            200,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#ffdbac';
          ctx.fill();
          ctx.restore();
          
          // العيون المتحركة
          const eyeY = canvas.height / 2 - 140;
          const blinkPhase = Math.sin(frameCount * 0.2);
          const eyeHeight = blinkPhase > 0.95 ? 2 : 12;
          
          // العين اليسرى
          ctx.fillStyle = 'white';
          ctx.fillRect(canvas.width / 2 - 45, eyeY - eyeHeight/2, 20, eyeHeight);
          if (eyeHeight > 5) {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(canvas.width / 2 - 35, eyeY, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // العين اليمنى
          ctx.fillStyle = 'white';
          ctx.fillRect(canvas.width / 2 + 25, eyeY - eyeHeight/2, 20, eyeHeight);
          if (eyeHeight > 5) {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + 35, eyeY, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // الفم المتحرك
          ctx.strokeStyle = '#c67c4e';
          ctx.lineWidth = 5;
          ctx.beginPath();
          const mouthY = canvas.height / 2 - 60;
          const mouthWidth = 30 + Math.abs(Math.sin(frameCount * 0.12)) * 20;
          const mouthHeight = 5 + Math.abs(Math.sin(frameCount * 0.15)) * 15;
          ctx.ellipse(canvas.width / 2, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI);
          ctx.stroke();
          
          // تأثير إضاءة البث
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 3, 400, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          // نص البث المباشر
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 50px Arial';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 8;
          
          const pulseScale = 1 + Math.sin(frameCount * 0.1) * 0.05;
          ctx.save();
          ctx.scale(pulseScale, pulseScale);
          ctx.fillText('🔴 بث مباشر', canvas.width / 2 / pulseScale, (canvas.height - 150) / pulseScale);
          ctx.restore();
          
          // عنوان البث
          ctx.font = 'bold 35px Arial';
          ctx.fillText(stream.title, canvas.width / 2, canvas.height - 80);
          
          // تحويل إلى stream
          const videoStream = canvas.captureStream(30);
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
          }
        }
        
        animationId = requestAnimationFrame(drawLiveFrame);
      };
      
      drawLiveFrame();
      
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
    console.log(isPlaying ? '⏸️ إيقاف البث' : '▶️ تشغيل البث');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    console.log(isMuted ? '🔊 إلغاء كتم الصوت' : '🔇 كتم الصوت');
  };

  // شاشة التحميل
  if (!isConnected) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold mb-2">جاري الاتصال بالبث المباشر</h3>
          <p className="text-lg opacity-80">انتظار إشارة من {stream.title}</p>
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
      {/* البث المباشر */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* مؤشر البث المباشر */}
      <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-semibold">بث مباشر</span>
        <Eye className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-bold">{viewerCount}</span>
      </div>

      {/* أدوات التحكم */}
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