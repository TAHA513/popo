import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, X, Eye, Settings, Users } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface NewLiveStreamerProps {
  stream: Stream;
  onClose: () => void;
}

export default function NewLiveStreamer({ stream, onClose }: NewLiveStreamerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [streamStatus, setStreamStatus] = useState<'starting' | 'live' | 'error'>('starting');
  const [viewerCount, setViewerCount] = useState(1);

  useEffect(() => {
    let mounted = true;
    
    const startStream = async () => {
      try {
        console.log('🎥 بدء البث المباشر للصاميمر:', user?.username);
        
        // طلب إذن الكاميرا والمايكروفون
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true; // منع الصدى
          
          setMediaStream(stream);
          setStreamStatus('live');
          
          console.log('✅ تم بدء البث المباشر بنجاح');
          
          // محاكاة زيادة المشاهدين
          setTimeout(() => {
            if (mounted) setViewerCount(3);
          }, 5000);
          setTimeout(() => {
            if (mounted) setViewerCount(7);
          }, 15000);
        }
      } catch (error) {
        console.error('❌ خطأ في بدء البث:', error);
        if (mounted) {
          setStreamStatus('error');
        }
      }
    };

    startStream();

    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('🛑 تم إيقاف البث وإغلاق الكاميرا');
      }
    };
  }, [user, stream.id]);

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        console.log(isVideoEnabled ? '📹 تم إيقاف الفيديو' : '📹 تم تشغيل الفيديو');
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        console.log(isAudioEnabled ? '🔇 تم كتم الصوت' : '🔊 تم تشغيل الصوت');
      }
    }
  };

  const endStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    onClose();
    console.log('📱 تم إنهاء البث المباشر');
  };

  // شاشة البدء
  if (streamStatus === 'starting') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-4">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold mb-4">🎥 جاري بدء البث المباشر</h2>
          <p className="text-lg opacity-90 mb-6">نحتاج إذن للوصول إلى الكاميرا والمايكروفون</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-3">{stream.title}</h3>
            <p className="text-white/80">{stream.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // شاشة الخطأ
  if (streamStatus === 'error') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-4">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">خطأ في بدء البث المباشر</h2>
          <p className="text-lg opacity-90 mb-6">لم نتمكن من الوصول إلى الكاميرا أو المايكروفون</p>
          <div className="space-y-3 mb-8">
            <p className="text-sm opacity-75">• تأكد من السماح بالوصول للكاميرا</p>
            <p className="text-sm opacity-75">• تحقق من أن الكاميرا غير مستخدمة في تطبيق آخر</p>
            <p className="text-sm opacity-75">• جرب إعادة تحميل الصفحة</p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-laa-pink hover:bg-pink-600 px-8 py-3">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* فيديو البث المباشر */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* تراكب إيقاف الفيديو */}
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <CameraOff className="w-32 h-32 mx-auto mb-6 opacity-60" />
              <h3 className="text-2xl font-bold mb-2">الكاميرا مُوقفة</h3>
              <p className="text-lg opacity-80">المشاهدون لا يرون الفيديو الآن</p>
            </div>
          </div>
        )}

        {/* الهيدر العلوي */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-30">
          <div className="flex items-center justify-between">
            <Button
              onClick={endStream}
              variant="ghost"
              className="bg-red-600/80 hover:bg-red-700 text-white rounded-full w-12 h-12 p-0"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="flex items-center space-x-4">
              <div className="bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-bold">مباشر</span>
              </div>
              
              <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
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
              <h2 className="text-white text-2xl font-bold mb-1">{stream.title}</h2>
              {stream.description && (
                <p className="text-white/80 text-lg">{stream.description}</p>
              )}
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-400 text-sm font-bold">{viewerCount} مشاهد</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-red-400 text-sm font-bold">بث مباشر</span>
                </div>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full ${
                  isVideoEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isVideoEnabled ? (
                  <Camera className="w-7 h-7 text-white" />
                ) : (
                  <CameraOff className="w-7 h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={toggleAudio}
                className={`w-16 h-16 rounded-full ${
                  isAudioEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-7 h-7 text-white" />
                ) : (
                  <MicOff className="w-7 h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={endStream}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
              >
                <X className="w-7 h-7 text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* تأثيرات إضافية */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none"></div>
      </div>
    </div>
  );
}