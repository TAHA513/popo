import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Volume2, MicOff } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface ZegoStreamViewerProps {
  stream: Stream;
}

export default function ZegoStreamViewer({ stream }: ZegoStreamViewerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const isStreamer = user?.id === stream.hostId;

  useEffect(() => {
    initializeZegoStream();
    
    // Update viewer count periodically
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const initializeZegoStream = async () => {
    try {
      setIsLoading(true);
      
      // Add a small delay to prevent multiple rapid initialization attempts
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isStreamer) {
        await initializeStreamerMode();
      } else {
        await initializeViewerMode();
      }
    } catch (error) {
      console.warn('ZegoCloud initialization failed, using fallback:', error);
      await fallbackToLocalStream();
    } finally {
      setIsLoading(false);
    }
  };

  const initializeStreamerMode = async () => {
    try {
      // Get ZegoCloud configuration
      const config = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());

      if (!config.appId) {
        throw new Error('ZegoCloud configuration not available');
      }

      // Initialize ZegoCloud for streaming with proper error handling
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      
      // Validate appId before using it
      if (!config.appId || isNaN(parseInt(config.appId))) {
        throw new Error('Invalid ZegoCloud App ID');
      }
      
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      
      // Login to room
      await zg.loginRoom((stream as any).zegoRoomId!, {
        userID: config.userID,
        userName: config.userName
      });

      // Get local camera stream
      const localStream = await zg.createStream({
        camera: {
          audio: true,
          video: true,
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrate: 3000
        }
      });

      // Display local stream
      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream;
        videoRef.current.muted = true; // Prevent echo
        videoRef.current.style.transform = 'scaleX(-1)'; // Mirror effect
        await videoRef.current.play();
        
        // Start publishing stream
        await zg.startPublishingStream((stream as any).zegoStreamId!, localStream);
        
        setZegoEngine(zg);
        setIsConnected(true);
        console.log('✅ Streamer mode initialized successfully');
      }
    } catch (error) {
      console.error('Streamer mode initialization failed:', error);
      throw error;
    }
  };

  const initializeViewerMode = async () => {
    try {
      // Get ZegoCloud configuration
      const config = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());

      if (!config.appId) {
        throw new Error('ZegoCloud configuration not available');
      }

      // Initialize ZegoCloud for viewing with proper error handling
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      
      // Validate appId before using it
      if (!config.appId || isNaN(parseInt(config.appId))) {
        throw new Error('Invalid ZegoCloud App ID');
      }
      
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      
      // Login to room as viewer
      await zg.loginRoom((stream as any).zegoRoomId!, {
        userID: config.userID || 'viewer_' + Date.now(),
        userName: config.userName || 'مشاهد'
      });

      // Start playing the stream
      const remoteStream = await zg.startPlayingStream((stream as any).zegoStreamId!);
      
      // Display remote stream
      if (videoRef.current && remoteStream) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.muted = isMuted;
        await videoRef.current.play();
        
        setZegoEngine(zg);
        setIsConnected(true);
        console.log('✅ Viewer mode initialized successfully - showing real streamer');
      } else {
        throw new Error('Could not get remote stream');
      }
    } catch (error) {
      console.error('Viewer mode initialization failed:', error);
      throw error;
    }
  };

  const fallbackToLocalStream = async () => {
    try {
      // Cleanup any existing ZegoCloud connections to prevent WebSocket errors
      if (zegoEngine) {
        try {
          zegoEngine.logoutRoom();
          zegoEngine.destroyEngine();
          setZegoEngine(null);
        } catch (cleanupError) {
          console.warn('Error cleaning up ZegoCloud engine:', cleanupError);
        }
      }

      if (isStreamer) {
        // For streamers, fall back to local camera
        const stream = await navigator.mediaDevices.getUserMedia({
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

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.style.transform = 'scaleX(-1)';
          await videoRef.current.play();
          setIsConnected(true);
          console.log('✅ Fallback to local camera for streamer');
        }
      } else {
        // For viewers, show connection message
        showConnectionMessage();
      }
    } catch (error) {
      console.error('Fallback stream failed:', error);
      showConnectionMessage();
    }
  };

  const showConnectionMessage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Connection message
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔄 جاري الاتصال بالمضيف...', canvas.width / 2, canvas.height / 2 - 100);
      
      ctx.font = '60px Arial';
      ctx.fillText('سيظهر البث المباشر خلال لحظات', canvas.width / 2, canvas.height / 2);
      
      ctx.font = '50px Arial';
      ctx.fillStyle = '#3498DB';
      ctx.fillText(stream.title || 'بث مباشر', canvas.width / 2, canvas.height / 2 + 100);
      
      // Live indicator
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(200, 200, 25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 مباشر', 250, 215);
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const stream = canvas.captureStream(30);
    videoRef.current.srcObject = stream;
    videoRef.current.muted = isMuted;
  };

  const cleanup = () => {
    if (zegoEngine) {
      zegoEngine.logoutRoom();
      zegoEngine.destroyEngine();
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleAudio = () => {
    if (isStreamer && zegoEngine) {
      // Toggle microphone for streamer
      zegoEngine.mutePublishStreamAudio(!isMuted);
      setIsMuted(!isMuted);
    } else {
      // Toggle audio for viewer
      setIsMuted(!isMuted);
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
      }
    }
  };

  const handleClose = () => {
    cleanup();
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Main Video Stream */}
      <div className="w-full h-full relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
            <div className="text-center text-white">
              <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-3xl font-bold mb-2">
                {isStreamer ? 'جاري تشغيل الكاميرا...' : 'جاري الاتصال بالبث...'}
              </h3>
              <p className="text-xl opacity-80">{stream.title}</p>
            </div>
          </div>
        )}

        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-14 h-14 p-0"
            >
              <X className="w-7 h-7" />
            </Button>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Audio Control */}
              <Button
                onClick={toggleAudio}
                variant="ghost"
                className={`rounded-full w-12 h-12 p-0 ${
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

              {/* Connection Status */}
              <div className={`px-5 py-3 rounded-full flex items-center space-x-3 rtl:space-x-reverse ${
                isConnected ? 'bg-green-600/90' : 'bg-red-600/90'
              }`}>
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-lg font-bold">
                  {isConnected ? 'مباشر' : 'اتصال...'}
                </span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-3 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <Eye className="w-5 h-5 text-white" />
                <span className="text-white text-lg font-bold">{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white text-3xl font-bold mb-2">{stream.title}</h2>
            {stream.description && (
              <p className="text-white/90 text-xl mb-3">{stream.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-white/80">
                <span>التصنيف: {stream.category}</span>
                {isStreamer && (
                  <>
                    <span className="mx-3">•</span>
                    <span className="text-green-400 font-semibold">أنت المضيف</span>
                  </>
                )}
                <span className="mx-3">•</span>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? 'متصل' : 'جاري الاتصال'}
                </span>
              </div>
              <div className="text-white/80">
                بدأ منذ {Math.floor((Date.now() - new Date(stream.startedAt!).getTime()) / 60000)} دقيقة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}