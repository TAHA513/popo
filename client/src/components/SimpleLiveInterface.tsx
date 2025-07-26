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
          
          // Simulate viewer experience with dynamic updates
          const updateViewers = () => {
            if (mounted) {
              setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
              setTimeout(updateViewers, 5000 + Math.random() * 10000);
            }
          };
          updateViewers();
        }
      } catch (error) {
        console.error('❌ خطأ في البث:', error);
        if (mounted) setStatus('error');
      }
    };

    const createViewerStream = () => {
      // For viewers, don't use complex canvas - use simpler approach
      if (videoRef.current && mounted) {
        // Create a placeholder stream instead of complex canvas
        videoRef.current.poster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23a855f7;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23ec4899;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)' /%3E%3Ccircle cx='640' cy='260' r='100' fill='%23ffffff' opacity='0.9'/%3E%3Ctext x='640' y='270' font-family='Arial' font-size='60' fill='%23a855f7' text-anchor='middle' font-weight='bold'%3E${((stream as any).hostName || 'S')[0]}%3C/text%3E%3Ctext x='640' y='450' font-family='Arial' font-size='36' fill='white' text-anchor='middle' font-weight='bold'%3E🔴 ${(stream as any).hostName || 'مضيف البث'}%3C/text%3E%3Ctext x='640' y='500' font-family='Arial' font-size='24' fill='white' text-anchor='middle'%3E${stream.title || 'بث مباشر'}%3C/text%3E%3Ctext x='640' y='550' font-family='Arial' font-size='28' fill='%23ffffff' text-anchor='middle'%3Eيتحدث الآن مباشرة%3C/text%3E%3C/svg%3E";
        
        // Hide controls for clean experience
        videoRef.current.controls = false;
        videoRef.current.autoplay = false;
        videoRef.current.load();
      }
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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black z-50">
      {/* الفيديو */}
      {isStreamer ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}

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