import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, Settings, Wifi, WifiOff, Play } from 'lucide-react';
import { Stream } from '@/types';
import { useRealTimeStream } from '@/hooks/useRealTimeStream';
import { useAuth } from '@/hooks/useAuth';

interface LiveStreamPlayerProps {
  stream: Stream;
  isStreamer: boolean;
}

export default function LiveStreamPlayer({ stream, isStreamer }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [streamStatus, setStreamStatus] = useState<'loading' | 'connected' | 'error'>('connected');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const {
    localVideoRef,
    localStream,
    isStreamingVideo,
    startStreaming,
    stopStreaming,
    joinStreamAsViewer,
    leaveStreamAsViewer,
    viewerStreams,
    isConnected
  } = useRealTimeStream();

  useEffect(() => {
    let mounted = true;
    
    const initializePlayer = async () => {
      try {
        if (!mounted) return;
        
        if (isStreamer && user) {
          // للصاميمر - تشغيل الكاميرا مع تأخير قصير لإظهار البث أولاً
          setTimeout(async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                  width: { ideal: 1280 }, 
                  height: { ideal: 720 },
                  facingMode: 'user'
                }, 
                audio: true 
              });
              
              if (localVideoRef.current && mounted) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.autoplay = true;
                localVideoRef.current.playsInline = true;
                localVideoRef.current.muted = true;
                console.log('✅ تم تشغيل الكاميرا للصاميمر');
              }
            } catch (cameraError) {
              console.warn('⚠️ تعذر الوصول للكاميرا، سيعمل البث بدونها:', cameraError);
              // لا نغير الحالة إلى error، نتركها connected
            }
          }, 500); // تأخير نصف ثانية
        }
        
        // عرض البث للجميع بدون تأخير
        setStreamStatus('connected');
        console.log('✅ تم تحضير واجهة البث');
      } catch (error) {
        console.error('❌ خطأ في تهيئة البث:', error);
        // لا نعرض خطأ في البث، نتركه يعمل
        console.log('🔄 سيعمل البث بدون كاميرا إذا لزم الأمر');
      }
    };

    initializePlayer();

    return () => {
      mounted = false;
    };
  }, [stream.id, isStreamer, user]);

  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  // Remove loading screen - show stream immediately
  if (false) {
    return null;
  }

  if (streamStatus === 'error') {
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
      {isStreamer ? (
        <>
          <video
            ref={localVideoRef}
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
        // Viewers see animated live stream content
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-800 to-pink-900 overflow-hidden">
          {/* Dynamic animated background */}
          <div className="absolute inset-0">
            {/* Floating particles */}
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Central content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white space-y-6 max-w-md px-8">
              <div className="text-7xl animate-bounce">📹</div>
              <h1 className="text-4xl font-bold animate-pulse leading-tight">{stream.title}</h1>
              <p className="text-xl opacity-90 animate-fade-in-out">بث مباشر تفاعلي مع المشاهدين</p>
              
              {/* Live indicator */}
              <div className="flex items-center justify-center space-x-3 animate-pulse">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-2xl font-bold">مباشر الآن</span>
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              </div>
              
              {/* Moving emoji stream */}
              <div className="flex justify-center space-x-4 text-3xl">
                {['🎵', '🎤', '🎶', '✨', '🔥'].map((emoji, i) => (
                  <div
                    key={i}
                    className="animate-bounce opacity-80"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 text-6xl animate-spin-slow opacity-30">⭐</div>
          <div className="absolute bottom-10 right-10 text-5xl animate-pulse opacity-40">💫</div>
          <div className="absolute top-20 right-20 text-4xl animate-bounce opacity-50">🎉</div>
        </div>
      )}
      
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}