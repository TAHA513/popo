import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Volume2, MicOff, Camera, CameraOff } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface RealLiveStreamProps {
  stream: Stream;
}

export default function RealLiveStream({ stream }: RealLiveStreamProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const isStreamer = user?.id === stream.hostId;

  useEffect(() => {
    initializeStream();
    
    // Update viewer count periodically
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    return () => {
      clearInterval(interval);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeStream = async () => {
    if (!videoRef.current) return;

    try {
      if (isStreamer) {
        await startStreamerCamera();
      } else {
        await startViewerStream();
      }
    } catch (error) {
      console.error('Error initializing stream:', error);
      await startViewerStream(); // Fallback to viewer stream
    }
  };

  const startStreamerCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Prevent feedback
        videoRef.current.style.transform = 'scaleX(-1)'; // Mirror effect
        videoRef.current.play();
        setMediaStream(stream);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      throw error;
    }
  };

  const startViewerStream = async () => {
    // For viewers, try to get actual stream from ZegoCloud first
    try {
      // Initialize ZegoCloud for viewers to see real stream
      const zegoConfig = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());
      
      if (zegoConfig.appId && (stream as any).zegoRoomId && (stream as any).zegoStreamId) {
        // Try to connect to ZegoCloud and get actual stream
        const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
        
        const zg = new ZegoExpressEngine(parseInt(zegoConfig.appId), 'wss://webliveroom-api.zego.im/ws');
        
        await zg.loginRoom((stream as any).zegoRoomId, {
          userID: user?.id || 'viewer_' + Date.now(),
          userName: user?.firstName || 'مشاهد'
        });
        
        // Start playing the actual stream
        const remoteStream = await zg.startPlayingStream((stream as any).zegoStreamId);
        
        if (videoRef.current && remoteStream) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.muted = isMuted;
          videoRef.current.play();
          setMediaStream(remoteStream);
          console.log('✅ Connected to real stream via ZegoCloud');
          return; // Exit early if we successfully connected to real stream
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not connect to ZegoCloud stream, falling back to simulation:', error);
    }
    
    // Fallback: Create a more realistic waiting screen
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !videoRef.current) return;

    let frame = 0;
    const animate = () => {
      frame++;
      
      // Create realistic background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#2C3E50');
      gradient.addColorStop(0.5, '#34495E');
      gradient.addColorStop(1, '#2C3E50');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Connection status
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔄 جاري الاتصال بالبث المباشر...', canvas.width / 2, canvas.height / 2 - 100);
      
      ctx.font = '60px Arial';
      ctx.fillText('سيظهر المضيف الحقيقي خلال ثوانٍ', canvas.width / 2, canvas.height / 2);
      
      ctx.font = '50px Arial';
      ctx.fillStyle = '#3498DB';
      ctx.fillText(stream.title || 'بث مباشر', canvas.width / 2, canvas.height / 2 + 100);
      
      // Animated loading indicator
      const loadingSize = 50 + Math.sin(frame * 0.1) * 20;
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 + 200, loadingSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Live indicator
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(200, 200, 25 + Math.sin(frame * 0.2) * 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 مباشر', 250, 215);

      // Update video
      if (videoRef.current) {
        const stream = canvas.captureStream(30);
        videoRef.current.srcObject = stream;
        videoRef.current.muted = isMuted;
        setMediaStream(stream);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Keep trying to connect to real stream every 5 seconds
    setTimeout(() => {
      startViewerStream();
    }, 5000);
  };

  const toggleVideo = () => {
    if (mediaStream && isStreamer) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream && isStreamer) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    } else {
      // For viewers, toggle mute
      setIsMuted(!isMuted);
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
      }
    }
  };

  const handleClose = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
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
              {/* Streamer Controls */}
              {isStreamer && (
                <>
                  <Button
                    onClick={toggleVideo}
                    variant="ghost"
                    className={`rounded-full w-12 h-12 p-0 ${
                      isVideoEnabled 
                        ? 'bg-green-600/90 hover:bg-green-700' 
                        : 'bg-red-600/90 hover:bg-red-700'
                    }`}
                  >
                    {isVideoEnabled ? (
                      <Camera className="w-6 h-6 text-white" />
                    ) : (
                      <CameraOff className="w-6 h-6 text-white" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={toggleAudio}
                    variant="ghost"
                    className={`rounded-full w-12 h-12 p-0 ${
                      isAudioEnabled 
                        ? 'bg-green-600/90 hover:bg-green-700' 
                        : 'bg-red-600/90 hover:bg-red-700'
                    }`}
                  >
                    {isAudioEnabled ? (
                      <Volume2 className="w-6 h-6 text-white" />
                    ) : (
                      <MicOff className="w-6 h-6 text-white" />
                    )}
                  </Button>
                </>
              )}

              {/* Viewer Audio Control */}
              {!isStreamer && (
                <Button
                  onClick={toggleAudio}
                  variant="ghost"
                  className={`rounded-full w-12 h-12 p-0 ${
                    !isMuted 
                      ? 'bg-green-600/90 hover:bg-green-700' 
                      : 'bg-red-600/90 hover:bg-red-700'
                  }`}
                >
                  {!isMuted ? (
                    <Volume2 className="w-6 h-6 text-white" />
                  ) : (
                    <MicOff className="w-6 h-6 text-white" />
                  )}
                </Button>
              )}

              <div className="bg-red-600/90 backdrop-blur-sm px-5 py-3 rounded-full flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-lg font-bold">مباشر</span>
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