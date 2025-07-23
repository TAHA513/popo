import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, Settings, Wifi, WifiOff } from 'lucide-react';
import { Stream } from '@/types';

interface LiveStreamPlayerProps {
  stream: Stream;
  isStreamer: boolean;
}

export default function LiveStreamPlayer({ stream, isStreamer }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamStatus, setStreamStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initializePlayer = async () => {
      if (!videoRef.current) return;

      try {
        if (isStreamer) {
          // For streamers, show their own camera feed
          console.log('🎥 Requesting camera access for streamer...');
          
          // Set a timeout to avoid indefinite loading
          const timeout = setTimeout(() => {
            console.warn('⏱️ Camera access timeout, showing error state');
            setStreamStatus('error');
          }, 5000); // 5 seconds timeout
          
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                facingMode: 'user'
              }, 
              audio: true 
            });
            
            clearTimeout(timeout);
            console.log('✅ Camera access granted, setting up video...');
            videoRef.current.srcObject = stream;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            videoRef.current.muted = true; // Avoid feedback
            
            // Set connected immediately after getting stream
            setStreamStatus('connected');
            setMediaStream(stream);
          } catch (cameraError) {
            clearTimeout(timeout);
            throw cameraError;
          }
        } else {
          // For viewers - show connected immediately with simulated stream
          console.log('👁️ Setting up viewer interface...');
          setStreamStatus('connected');
        }
      } catch (error) {
        console.error('❌ Error initializing stream player:', error);
        setStreamStatus('error');
      }
    };

    // Start immediately
    initializePlayer();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream.id, isStreamer]);

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  if (streamStatus === 'loading') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold mb-2">🔴 جاري تحضير الكاميرا</p>
          <p className="text-lg font-semibold">{stream.title}</p>
          <p className="text-sm opacity-75 mt-2">يرجى السماح بالوصول للكاميرا</p>
          <div className="mt-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-laa-pink hover:bg-pink-600 text-sm"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (streamStatus === 'error') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-red-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <p className="text-6xl mb-4">⚠️</p>
          <p className="text-xl font-bold mb-2">لا يمكن الوصول للكاميرا</p>
          <p className="text-sm opacity-75 mb-6">
            يرجى السماح بالوصول للكاميرا والمايكروفون من إعدادات المتصفح، 
            أو المتابعة بدون فيديو.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-laa-pink hover:bg-pink-600 w-full"
            >
              إعادة المحاولة
            </Button>
            <Button 
              onClick={() => setStreamStatus('connected')} 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10 w-full"
            >
              المتابعة بدون كاميرا
            </Button>
          </div>
          <p className="text-xs opacity-50 mt-4">
            يمكنك بدء البث حتى لو لم تعمل الكاميرا
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {isStreamer ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Streamer Controls */}
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

          {/* Video disabled overlay */}
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <CameraOff className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold">الكاميرا مُوقفة</p>
                <p className="text-sm opacity-75">اضغط على أيقونة الكاميرا لإعادة التشغيل</p>
              </div>
            </div>
          )}
        </>
      ) : (
        // Streamers without camera show a placeholder
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white max-w-md mx-auto px-8">
            {/* Live indicator */}
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <span className="text-7xl">🎥</span>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-red-500/40 animate-pulse"></div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4">{stream.title}</h2>
            {stream.description && (
              <p className="text-xl opacity-80 mb-6">{stream.description}</p>
            )}
            
            <div className="bg-red-600/20 p-6 rounded-xl border border-red-500/30 backdrop-blur-sm mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-3"></div>
                <span className="text-red-300 font-bold text-lg">بث مباشر نشط</span>
              </div>
              <p className="text-sm opacity-75">
                {isStreamer ? 'أنت تبث الآن - يمكن للمشاهدين رؤيتك والتفاعل معك' : 'البث المباشر جاري - انضم للدردشة'}
              </p>
            </div>
            
            {isStreamer && (
              <p className="text-sm opacity-60 bg-blue-600/20 p-4 rounded-lg">
                💡 نصيحة: يمكنك تفعيل الكاميرا من الأزرار في الأعلى لعرض الفيديو
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}