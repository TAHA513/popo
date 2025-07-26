import React, { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { X, Eye, Volume2, MicOff } from "lucide-react";

interface StreamData {
  id: number;
  hostId: string;
  title: string;
  description: string | null;
  category: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: string;
}

export default function StreamNewPage() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Fetch user data
  useEffect(() => {
    fetch('/api/auth/user')
      .then(res => res.json())
      .then(userData => {
        if (userData.id) {
          setUser(userData);
        }
      })
      .catch(() => {
        // Redirect to login if not authenticated
        window.location.href = '/api/login';
      });
  }, []);

  // Fetch stream data
  useEffect(() => {
    if (!id || !user) return;

    const fetchStream = async () => {
      try {
        const response = await fetch(`/api/streams/${id}`);
        if (!response.ok) {
          throw new Error('Stream not found');
        }
        const streamData = await response.json();
        setStream(streamData);
        setViewerCount(streamData.viewerCount || 1);
        setLoading(false);
      } catch (err) {
        setError('فشل في تحميل البث');
        setLoading(false);
      }
    };

    fetchStream();
  }, [id, user]);

  // Initialize video stream
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const isStreamer = user?.id === stream.hostId;
    
    const initializeVideo = async () => {
      try {
        if (isStreamer) {
          // For streamer: Start camera
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, facingMode: 'user' },
            audio: true
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.muted = true; // Prevent echo
            videoRef.current.style.transform = 'scaleX(-1)'; // Mirror effect
          }
        } else {
          // For viewers: Create animated stream
          createAnimatedStream();
        }
      } catch (error) {
        console.error('Camera error:', error);
        // Fallback to animated stream
        createAnimatedStream();
      }
    };

    const createAnimatedStream = () => {
      if (!videoRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      let frame = 0;
      const animate = () => {
        frame++;
        
        // Dynamic background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${(frame * 0.5) % 360}, 70%, 50%)`);
        gradient.addColorStop(0.5, `hsl(${(frame * 0.3 + 120) % 360}, 60%, 40%)`);
        gradient.addColorStop(1, `hsl(${(frame * 0.4 + 240) % 360}, 65%, 45%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw animated character
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Head with breathing
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
        
        // Animated mouth
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
        
        // Moving arms
        const armOffset = Math.sin(frame * 0.1) * 10;
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(centerX - 120, centerY + armOffset, 40, 100);
        ctx.fillRect(centerX + 80, centerY - armOffset, 40, 100);
        
        // Stream info overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
        
        // Text information
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stream.title || 'بث مباشر', centerX, canvas.height - 100);
        
        ctx.font = '28px Arial';
        ctx.fillText('يتحدث الآن مباشرة', centerX, canvas.height - 60);
        
        ctx.font = '24px Arial';
        ctx.fillText(`التصنيف: ${stream.category || 'بث سريع'}`, centerX, canvas.height - 30);
        
        // Live indicator
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(100, 100, 15 + Math.sin(frame * 0.3) * 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🔴 مباشر', 130, 110);

        // Update video
        if (videoRef.current) {
          const videoStream = canvas.captureStream(30);
          videoRef.current.srcObject = videoStream;
          videoRef.current.muted = isMuted;
        }
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };

    initializeVideo();

    // Cleanup
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [stream, user, isMuted]);

  // Update viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    window.history.back();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل البث...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-4">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">خطأ في تحميل البث</h2>
          <p className="text-lg mb-6">{error || 'البث غير موجود'}</p>
          <Button onClick={handleClose} className="bg-pink-500 hover:bg-pink-600">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  const isStreamer = user?.id === stream.hostId;

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

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
            >
              <X className="w-7 h-7" />
            </Button>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
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

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white text-2xl font-bold mb-2">{stream.title}</h2>
            {stream.description && (
              <p className="text-white/90 text-lg mb-3">{stream.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-sm">
                <span>التصنيف: {stream.category}</span>
                {isStreamer && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-green-400">أنت المضيف</span>
                  </>
                )}
              </div>
              <div className="text-white/80 text-sm">
                بدأ منذ {Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 60000)} دقيقة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}