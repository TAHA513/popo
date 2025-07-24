import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, X, Eye } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SimpleLiveInterfaceProps {
  stream: Stream;
}

export default function SimpleLiveInterface({ stream }: SimpleLiveInterfaceProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const [isStreamer] = useState(user?.id === stream.hostId);

  // إنهاء البث
  const endStreamMutation = useMutation({
    mutationFn: () => apiRequest(`/api/streams/${stream.id}`, "DELETE"),
    onSuccess: () => {
      console.log('✅ تم إنهاء البث');
      window.history.back();
    },
    onError: () => {
      window.history.back();
    }
  });

  useEffect(() => {
    let mounted = true;
    
    const initStream = async () => {
      try {
        if (isStreamer) {
          // للصاميمر: تشغيل الكاميرا
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, facingMode: 'user' },
            audio: true
          });

          if (mounted && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            videoRef.current.muted = true;
            setMediaStream(stream);
            setStatus('live');
          }
        } else {
          // للمشاهدين: إنشاء بث محاكي
          createViewerStream();
          setStatus('live');
        }
      } catch (error) {
        console.error('❌ خطأ في البث:', error);
        if (mounted) setStatus('error');
      }
    };

    const createViewerStream = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      let frame = 0;
      const animate = () => {
        if (!mounted || !ctx) return;
        frame++;
        
        // خلفية متدرجة
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${(frame * 0.5) % 360}, 70%, 50%)`);
        gradient.addColorStop(1, `hsl(${(frame * 0.3 + 180) % 360}, 60%, 30%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // رسم شخص بسيط
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // الرأس
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 100, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // العيون
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - 25, centerY - 120, 5, 0, Math.PI * 2);
        ctx.arc(centerX + 25, centerY - 120, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // الفم المتحرك
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const mouthY = centerY - 80;
        const mouthWidth = 15 + Math.abs(Math.sin(frame * 0.1)) * 10;
        ctx.ellipse(centerX, mouthY, mouthWidth, 8, 0, 0, Math.PI);
        ctx.stroke();
        
        // الجسم
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(centerX - 50, centerY - 20, 100, 120);
        
        // نص البث
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔴 بث مباشر', centerX, canvas.height - 40);
        
        if (videoRef.current && mounted) {
          const videoStream = canvas.captureStream(30);
          videoRef.current.srcObject = videoStream;
        }
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };

    initStream();

    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isStreamer, stream.id]);

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
    }
  };

  const handleClose = () => {
    if (isStreamer) {
      endStreamMutation.mutate();
    } else {
      window.history.back();
    }
  };

  // شاشة التحميل
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">
            {isStreamer ? 'جاري تشغيل الكاميرا...' : 'جاري الاتصال بالبث...'}
          </h2>
          <p className="text-lg opacity-80">{stream.title}</p>
        </div>
      </div>
    );
  }

  // شاشة الخطأ
  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-4">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">خطأ في البث</h2>
          <p className="text-lg mb-6">لم نتمكن من الوصول للكاميرا والمايكروفون</p>
          <div className="space-y-2 mb-6 text-sm">
            <p>• اسمح بالوصول للكاميرا والمايك</p>
            <p>• تأكد من عدم استخدامهما في تطبيق آخر</p>
          </div>
          <div className="flex space-x-4 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-laa-pink">
              إعادة المحاولة
            </Button>
            <Button onClick={handleClose} variant="outline">
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // واجهة البث الرئيسية
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* الفيديو */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: isStreamer ? 'scaleX(-1)' : 'none' }}
      />

      {/* تراكب إيقاف الفيديو للصاميمر */}
      {isStreamer && !isVideoEnabled && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <CameraOff className="w-24 h-24 mx-auto mb-4 opacity-60" />
            <h3 className="text-xl font-bold">الكاميرا متوقفة</h3>
          </div>
        </div>
      )}

      {/* الهيدر العلوي */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-30">
        <div className="flex items-center justify-between">
          {/* زر الإغلاق */}
          <Button
            onClick={handleClose}
            variant="ghost"
            className="bg-red-600/80 hover:bg-red-700 text-white rounded-full w-12 h-12 p-0"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* مؤشر البث المباشر */}
          <div className="flex items-center space-x-3">
            <div className="bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-bold">مباشر</span>
            </div>
            
            <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full flex items-center space-x-2">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{viewerCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* أدوات التحكم السفلية */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
        <div className="flex items-center justify-between">
          {/* معلومات البث */}
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold mb-1">{stream.title}</h2>
            {stream.description && (
              <p className="text-white/80 text-sm">{stream.description}</p>
            )}
          </div>

          {/* أزرار التحكم للصاميمر فقط */}
          {isStreamer && (
            <div className="flex items-center space-x-3">
              <Button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full ${
                  isVideoEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
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
                className={`w-14 h-14 rounded-full ${
                  isAudioEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}