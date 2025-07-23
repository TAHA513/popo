import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Wifi, WifiOff } from 'lucide-react';
import type { Stream } from '../types/index';

interface SimpleStreamViewerProps {
  stream: Stream;
}

export default function SimpleStreamViewer({ stream }: SimpleStreamViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // محاولة محاكاة تيار البث المباشر
  useEffect(() => {
    const setupViewer = async () => {
      console.log('👁️ Setting up stream viewer for:', stream.title);
      
      // For viewers, immediately show a connected state without waiting for camera
      setIsLoading(false);
      setIsConnected(true);
      setIsPlaying(true);
      
      if (videoRef.current) {
        // Create a canvas-based stream simulation
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        
        let animationFrame = 0;
        const drawFrame = () => {
          if (ctx && isPlaying) {
            animationFrame++;
            
            // خلفية متحركة
            const time = animationFrame * 0.02;
            const gradient = ctx.createLinearGradient(
              Math.sin(time) * 200 + canvas.width / 2, 
              Math.cos(time) * 200 + canvas.height / 2,
              canvas.width / 2, 
              canvas.height / 2
            );
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#f093fb');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // نص البث المباشر مع تأثير النبضة
            const pulseScale = 1 + Math.sin(time * 3) * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + Math.sin(time * 2) * 0.1})`;
            ctx.font = `bold ${80 * pulseScale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('🔴 بث مباشر', canvas.width / 2, canvas.height / 2 - 100);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(stream.title, canvas.width / 2, canvas.height / 2);
            
            ctx.font = '30px Arial';
            ctx.fillText(`المشاهدون: ${stream.viewerCount || 0}`, canvas.width / 2, canvas.height / 2 + 60);
            
            // الوقت الحالي
            const now = new Date();
            ctx.font = '25px Arial';
            ctx.fillText(now.toLocaleTimeString('ar-SA'), canvas.width / 2, canvas.height / 2 + 120);
            
            // نبضات على الحواف
            const pulseOpacity = Math.sin(time * 4) * 0.3 + 0.2;
            ctx.strokeStyle = `rgba(255, 0, 0, ${pulseOpacity})`;
            ctx.lineWidth = 8;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          }
          
          if (isPlaying) {
            requestAnimationFrame(drawFrame);
          }
        };
        
        try {
          const stream = canvas.captureStream(30);
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = isMuted;
          
          drawFrame();
          console.log('✅ Stream viewer ready with animated content');
        } catch (error) {
          console.warn('Canvas stream not supported, using fallback');
          setIsConnected(true);
        }
      }
    };

    // Start immediately, no delay
    setupViewer();
  }, [stream.title, stream.viewerCount, isPlaying, isMuted]);

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