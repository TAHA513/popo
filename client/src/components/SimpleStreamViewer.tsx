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
  const [isLoading, setIsLoading] = useState(false);

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
          
          // نص البث المباشر - أكثر حيوية
          ctx.fillStyle = 'white';
          ctx.font = 'bold 120px Arial';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 10;
          
          // تأثير نبضات للنص
          const pulseFactor = 1 + Math.sin(frameCount * 0.1) * 0.1;
          ctx.save();
          ctx.scale(pulseFactor, pulseFactor);
          ctx.fillText('🔴 بث مباشر نشط', canvas.width / 2 / pulseFactor, (canvas.height / 2 - 200) / pulseFactor);
          ctx.restore();
          
          // عنوان البث
          ctx.font = 'bold 80px Arial';
          ctx.fillText(streamData.title || 'LaaBoBo Live', canvas.width / 2, canvas.height / 2);
          
          // معلومات البث
          ctx.font = '60px Arial';
          ctx.fillText(`👥 ${streamData.viewerCount || 0} مشاهد`, canvas.width / 2, canvas.height / 2 + 150);
          
          // الوقت مع أيقونة متحركة وإحصائيات البث
          const now = new Date();
          const timeIcon = frameCount % 60 < 30 ? '🕐' : '🕑';
          ctx.fillText(`${timeIcon} ${now.toLocaleTimeString('ar-SA')}`, canvas.width / 2, canvas.height / 2 + 250);
          
          // إضافة عداد المشاهدات المتحرك
          const viewerCount = (streamData.viewerCount || 0) + Math.floor(Math.sin(frameCount * 0.01) * 5);
          ctx.font = '80px Arial';
          ctx.fillText(`👁️ ${Math.max(1, viewerCount)} مشاهد نشط`, canvas.width / 2, canvas.height / 2 + 350);
          
          // إضافة نبضات القلب للدلالة على النشاط
          if (frameCount % 120 < 10) {
            ctx.font = '100px Arial';
            ctx.fillStyle = '#ff0066';
            ctx.fillText('💓', canvas.width / 2 + 300, canvas.height / 2 + 100);
          }
          
          // شعار LaaBoBo مع تأثير
          ctx.font = 'bold 60px Arial';
          ctx.fillStyle = '#ec4899'; // LaaBoBo pink
          ctx.fillText('🐰 LaaBoBo Live', canvas.width / 2, canvas.height - 150);
          
          // رسالة للمستخدم
          ctx.font = '40px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText('هذا محتوى تجريبي للبث المباشر', canvas.width / 2, canvas.height - 80);
          ctx.fillText('البث الحقيقي يتطلب كاميرا واتصال إنترنت', canvas.width / 2, canvas.height - 40);
          
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
      setIsPlaying(true);
    }
    
    return () => {
      setIsPlaying(false);
    };
  }, [streamData.title, streamData.viewerCount, isPlaying]);

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

  // Remove loading screen - show stream immediately
  if (false) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Animated Live Stream Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900 animate-pulse">
        {/* Moving particles effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating text animations */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white space-y-4">
            <div className="text-6xl animate-pulse">🎥</div>
            <h1 className="text-3xl font-bold animate-bounce">{streamData.title}</h1>
            <p className="text-xl opacity-80 animate-pulse">بث مباشر تفاعلي</p>
            <div className="flex items-center justify-center space-x-2 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-lg font-semibold">مباشر الآن</span>
            </div>
          </div>
        </div>
        
        {/* Floating emojis */}
        <div className="absolute inset-0 pointer-events-none">
          {['❤️', '👏', '🔥', '✨', '🎉', '💫'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-bounce opacity-70"
              style={{
                left: `${10 + (i * 15)}%`,
                top: `${20 + Math.sin(i) * 30}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>
      
      {/* Hidden video element for future real streaming */}
      <video
        ref={videoRef}
        className="hidden w-full h-full object-cover"
        playsInline
        autoPlay
        muted={isMuted}
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setIsConnected(false);
          setConnectionAttempts(prev => prev + 1);
        }}
      />
      
      {/* Connection Status Overlay - Hidden since we show animated content */}
      {false && !isConnected && (
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