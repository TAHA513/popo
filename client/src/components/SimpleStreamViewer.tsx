import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Wifi, WifiOff } from 'lucide-react';
import type { Stream } from '../types/index';

interface SimpleStreamViewerProps {
  stream: Stream;
}

export default function SimpleStreamViewer({ stream: streamData }: SimpleStreamViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true); // Start playing automatically
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [isConnected, setIsConnected] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // محاولة محاكاة تيار البث المباشر
  useEffect(() => {
    if (videoRef.current) {
      // إنشاء كانفاس لعرض محتوى البث المباشر
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      let frameCount = 0;
      
      const drawFrame = () => {
        if (ctx) {
          frameCount++;
          
          // خلفية متحركة بألوان LaaBoBo
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          const hue = (frameCount / 2) % 360;
          gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
          gradient.addColorStop(0.5, '#ec4899'); // LaaBoBo pink
          gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 40%)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // دائرة متحركة في الخلفية
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2 + Math.sin(frameCount * 0.01) * 200,
            canvas.height / 2 + Math.cos(frameCount * 0.01) * 200,
            300,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'white';
          ctx.fill();
          ctx.globalAlpha = 1;
          
          // إطار للمحتوى
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 3;
          ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
          
          // نص البث المباشر
          ctx.fillStyle = 'white';
          ctx.font = 'bold 120px Arial';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 10;
          ctx.fillText('🔴 بث مباشر', canvas.width / 2, canvas.height / 2 - 200);
          
          // عنوان البث
          ctx.font = 'bold 80px Arial';
          ctx.fillText(streamData.title || 'LaaBoBo Live', canvas.width / 2, canvas.height / 2);
          
          // معلومات البث
          ctx.font = '60px Arial';
          ctx.fillText(`👥 ${streamData.viewerCount || 0} مشاهد`, canvas.width / 2, canvas.height / 2 + 150);
          
          // الوقت مع أيقونة متحركة
          const now = new Date();
          const timeIcon = frameCount % 60 < 30 ? '🕐' : '🕑';
          ctx.fillText(`${timeIcon} ${now.toLocaleTimeString('ar-SA')}`, canvas.width / 2, canvas.height / 2 + 250);
          
          // شعار LaaBoBo
          ctx.font = 'bold 50px Arial';
          ctx.fillText('🐰 LaaBoBo Live', canvas.width / 2, canvas.height - 100);
          
          ctx.shadowBlur = 0;
        }
        
        if (isPlaying) {
          requestAnimationFrame(drawFrame);
        }
      };
      
      // إنشاء تيار الفيديو من الكانفاس
      const stream = canvas.captureStream(30);
      videoRef.current.srcObject = stream;
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = isMuted;
      
      // بدء الرسم
      drawFrame();
      
      // بدء التشغيل التلقائي
      videoRef.current.play().catch(e => {
        console.log('تم منع التشغيل التلقائي:', e);
      });
      
      setIsLoading(false);
      setIsConnected(true);
    }
    
    return () => {
      setIsPlaying(false);
    };
  }, [streamData.title, streamData.viewerCount]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.log('تشغيل الفيديو منع تلقائياً:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-8">
          <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold mb-2">جاري الاتصال بالبث المباشر...</p>
          <p className="text-gray-400">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      {/* Video Player */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        autoPlay
        muted={isMuted}
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setIsConnected(false);
          setConnectionAttempts(prev => prev + 1);
        }}
      />
      
      {/* Connection Status Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white max-w-md mx-auto px-8">
            <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">انقطع الاتصال</h3>
            <p className="text-gray-300 mb-6">جاري إعادة محاولة الاتصال بالبث المباشر...</p>
            <div className="w-12 h-12 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-400 mt-4">المحاولة {connectionAttempts}</p>
          </div>
        </div>
      )}

      {/* Video Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-3">
          {/* Play/Pause Controls */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 w-10 h-10 p-0 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/20 w-10 h-10 p-0 rounded-full"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Stream Info */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse text-white">
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm">{isConnected ? 'متصل' : 'منقطع'}</span>
            </div>
            
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">مباشر</span>
            </div>
          </div>

          {/* Fullscreen Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20 w-10 h-10 p-0 rounded-full"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Live Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center bg-red-600 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
          <span className="text-white text-sm font-semibold">مباشر</span>
        </div>
      </div>
    </div>
  );
}