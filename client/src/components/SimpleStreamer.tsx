import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface SimpleStreamerProps {
  stream: Stream;
}

export default function SimpleStreamer({ stream }: SimpleStreamerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error'>('active');

  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('🎥 بدء تشغيل الكاميرا للصاميمر:', user?.username);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true; // تجنب الصدى
          
          setMediaStream(stream);
          setCameraStatus('active');
          console.log('✅ تم تشغيل الكاميرا بنجاح');
        }
      } catch (error) {
        console.error('❌ خطأ في الوصول للكاميرا:', error);
        setCameraStatus('error');
      }
    };

    initCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('🛑 تم إيقاف الكاميرا');
      }
    };
  }, [stream.id, user]);

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        console.log(isVideoEnabled ? '📹 إيقاف الفيديو' : '📹 تشغيل الفيديو');
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        console.log(isAudioEnabled ? '🔇 إيقاف الصوت' : '🔊 تشغيل الصوت');
      }
    }
  };

  if (cameraStatus === 'loading') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold mb-2">جاري تشغيل الكاميرا</h3>
          <p className="text-lg opacity-80">انتظار إذن الوصول للكاميرا والمايكروفون</p>
        </div>
      </div>
    );
  }

  if (cameraStatus === 'error') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-6xl mb-4">⚠️</p>
          <p className="text-xl font-bold mb-2">خطأ في الوصول للكاميرا</p>
          <p className="text-sm opacity-75 mb-4">يرجى السماح بالوصول للكاميرا والمايكروفون</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-laa-pink hover:bg-pink-600"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {/* فيديو الكاميرا للصاميمر */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // مرآة الكاميرا الأمامية
      />

      {/* أدوات التحكم */}
      <div className="absolute top-4 right-4 z-30 flex flex-col space-y-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full ${
            isVideoEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isVideoEnabled ? (
            <Camera className="w-5 h-5 text-white" />
          ) : (
            <CameraOff className="w-5 h-5 text-white" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full ${
            isAudioEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isAudioEnabled ? (
            <Mic className="w-5 h-5 text-white" />
          ) : (
            <MicOff className="w-5 h-5 text-white" />
          )}
        </Button>
      </div>

      {/* تراكب إيقاف الفيديو */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <CameraOff className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold">الكاميرا مُوقفة</p>
            <p className="text-sm opacity-75">اضغط على أيقونة الكاميرا لإعادة التشغيل</p>
          </div>
        </div>
      )}

      {/* مؤشر البث المباشر */}
      <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-semibold">بث مباشر</span>
      </div>

      {/* معلومات البث */}
      <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-sm rounded-2xl p-4 max-w-sm">
        <h3 className="text-white text-xl font-bold mb-1">{stream.title}</h3>
        {stream.description && (
          <p className="text-white/80 text-sm mb-2">{stream.description}</p>
        )}
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-300 text-sm font-bold">نشط الآن</span>
          </div>
        </div>
      </div>

      {/* تدرج للنص */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}