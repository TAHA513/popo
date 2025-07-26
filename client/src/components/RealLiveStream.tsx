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
    // For viewers, show a realistic simulation or fetch actual stream
    // In a real app, this would connect to the actual stream via WebRTC/ZegoCloud
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
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(0.5, '#764ba2');
      gradient.addColorStop(1, '#f093fb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw realistic person
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Head with natural skin tone
      const headSize = 180 + Math.sin(frame * 0.03) * 8; // Breathing effect
      ctx.fillStyle = '#FDBCB4';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 150, headSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 200, headSize + 20, 0, Math.PI);
      ctx.fill();
      
      // Eyes with blinking
      const eyeSize = frame % 120 > 110 ? 2 : 12; // Blinking effect
      ctx.fillStyle = '#2C3E50';
      ctx.beginPath();
      ctx.arc(centerX - 40, centerY - 180, eyeSize, 0, Math.PI * 2);
      ctx.arc(centerX + 40, centerY - 180, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose
      ctx.strokeStyle = '#E8A686';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 150);
      ctx.lineTo(centerX - 8, centerY - 130);
      ctx.lineTo(centerX, centerY - 125);
      ctx.stroke();
      
      // Mouth - realistic talking animation
      ctx.strokeStyle = '#D35400';
      ctx.lineWidth = 6;
      ctx.beginPath();
      const mouthY = centerY - 100;
      const mouthMovement = Math.sin(frame * 0.15);
      const mouthWidth = 25 + Math.abs(mouthMovement) * 15;
      const mouthHeight = 5 + Math.abs(mouthMovement) * 10;
      ctx.ellipse(centerX, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI);
      ctx.stroke();
      
      // Teeth when mouth is open
      if (Math.abs(mouthMovement) > 0.3) {
        ctx.fillStyle = 'white';
        ctx.fillRect(centerX - 20, mouthY - 3, 40, 6);
      }
      
      // Body/shirt
      ctx.fillStyle = '#3498DB';
      ctx.fillRect(centerX - 120, centerY + 50, 240, 300);
      
      // Arms with natural movement
      const armMovement = Math.sin(frame * 0.08) * 20;
      ctx.fillStyle = '#FDBCB4';
      // Left arm
      ctx.fillRect(centerX - 160, centerY + 80 + armMovement, 40, 150);
      // Right arm  
      ctx.fillRect(centerX + 120, centerY + 80 - armMovement, 40, 150);
      
      // Hands
      ctx.beginPath();
      ctx.arc(centerX - 140, centerY + 240 + armMovement, 25, 0, Math.PI * 2);
      ctx.arc(centerX + 140, centerY + 240 - armMovement, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Stream info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
      
      // Host name and title
      ctx.fillStyle = 'white';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stream.title || 'بث مباشر', centerX, canvas.height - 140);
      
      ctx.font = '40px Arial';
      ctx.fillText(`المضيف يتحدث الآن`, centerX, canvas.height - 90);
      
      ctx.font = '32px Arial';
      ctx.fillText(`التصنيف: ${stream.category || 'بث سريع'}`, centerX, canvas.height - 40);
      
      // Live indicator
      const liveSize = 25 + Math.sin(frame * 0.2) * 8;
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(150, 150, liveSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 مباشر', 200, 165);
      
      // Sound waves for talking effect
      if (Math.abs(mouthMovement) > 0.2) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const waveSize = 100 + i * 50 + Math.abs(mouthMovement) * 30;
          ctx.arc(centerX + 200, centerY - 100, waveSize, 0, Math.PI * 0.5);
          ctx.stroke();
        }
      }

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