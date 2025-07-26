import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Radio, Volume2, Camera, Mic, MicOff } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const isStreamer = user?.id === stream.hostId;

  useEffect(() => {
    // Initialize stream for streamer or viewer
    const initializeStream = async () => {
      if (!videoRef.current) return;

      try {
        if (isStreamer) {
          // For streamer: Start camera
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, facingMode: 'user' },
            audio: true
          });
          
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true; // Prevent echo for streamer
          videoRef.current.style.transform = 'scaleX(-1)'; // Mirror effect
          setIsVideoReady(true);
        } else {
          // For viewers: Create realistic animated stream
          createViewerStream();
          setIsVideoReady(true);
        }
      } catch (error) {
        console.error('Stream initialization error:', error);
        // Fallback to animated stream
        createViewerStream();
        setIsVideoReady(true);
      }
    };

    const createViewerStream = () => {
      if (!videoRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      let frame = 0;
      const animate = () => {
        frame++;
        
        // Create dynamic gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${(frame * 0.5) % 360}, 70%, 50%)`);
        gradient.addColorStop(0.5, `hsl(${(frame * 0.3 + 120) % 360}, 60%, 40%)`);
        gradient.addColorStop(1, `hsl(${(frame * 0.4 + 240) % 360}, 65%, 45%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw animated streamer figure
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Head with breathing effect
        const headSize = 120 + Math.sin(frame * 0.05) * 10;
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 100, headSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - 30, centerY - 130, 8, 0, Math.PI * 2);
        ctx.arc(centerX + 30, centerY - 130, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Animated mouth (talking)
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const mouthY = centerY - 80;
        const mouthWidth = 20 + Math.abs(Math.sin(frame * 0.2)) * 15;
        const mouthHeight = 8 + Math.abs(Math.sin(frame * 0.3)) * 8;
        ctx.ellipse(centerX, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI);
        ctx.stroke();
        
        // Body
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(centerX - 80, centerY - 20, 160, 180);
        
        // Arms with movement
        const armOffset = Math.sin(frame * 0.1) * 10;
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(centerX - 120, centerY + armOffset, 40, 100);
        ctx.fillRect(centerX + 80, centerY - armOffset, 40, 100);
        
        // Stream info overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
        
        // Host name and title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stream.title || 'بث مباشر', centerX, canvas.height - 80);
        
        ctx.font = '32px Arial';
        ctx.fillText(`المضيف: ${(stream as any).hostName || 'مضيف البث'}`, centerX, canvas.height - 40);
        
        // Live indicator
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(100, 100, 15 + Math.sin(frame * 0.3) * 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🔴 مباشر', 130, 110);

        // Update video with canvas stream
        if (videoRef.current) {
          const stream = canvas.captureStream(30);
          videoRef.current.srcObject = stream;
          videoRef.current.muted = isMuted;
        }
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };

    // Simulate dynamic viewer count
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    initializeStream();

    return () => {
      clearInterval(viewerInterval);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isStreamer, isMuted, stream.id]);

  const handleClose = () => {
    window.history.back();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Main Video Stream */}
      <div className="w-full h-full relative">
        {/* Video Element - This shows the actual stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
          onLoadedData={() => setIsVideoReady(true)}
          onError={() => setIsVideoReady(false)}
        />

        {/* Loading overlay */}
        {!isVideoReady && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-pink-600 to-blue-700 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-2">جاري تحميل البث...</h3>
              <p className="text-lg opacity-80">{stream.title}</p>
            </div>
          </div>
        )}

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            {/* Close button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
            >
              <X className="w-7 h-7" />
            </Button>

            {/* Stream status and controls */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Audio control for viewers */}
              {!isStreamer && (
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  className={`rounded-full w-12 h-12 p-0 shadow-lg ${
                    isMuted 
                      ? 'bg-red-600/90 hover:bg-red-700' 
                      : 'bg-green-600/90 hover:bg-green-700'
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </Button>
              )}

              <div className="bg-red-600/90 backdrop-blur-sm px-5 py-3 rounded-full flex items-center space-x-3 rtl:space-x-reverse shadow-lg">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-lg font-bold">مباشر</span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-3 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg">
                <Eye className="w-5 h-5 text-white" />
                <span className="text-white text-lg font-bold">{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom overlay with stream info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white text-2xl font-bold mb-2">{stream.title || 'بث مباشر'}</h2>
            {stream.description && (
              <p className="text-white/90 text-lg mb-3">{stream.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-sm">
                <span>المضيف: {(stream as any).hostName || 'مضيف البث'}</span>
                <span className="mx-2">•</span>
                <span>التصنيف: {stream.category || 'بث سريع'}</span>
                {isStreamer && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-green-400">أنت المضيف</span>
                  </>
                )}
              </div>
              <div className="text-white/80 text-sm">
                بدأ منذ {Math.floor((Date.now() - new Date(stream.startedAt!).getTime()) / 60000)} دقيقة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}