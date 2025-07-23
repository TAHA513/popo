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
  const [streamStatus, setStreamStatus] = useState<'loading' | 'connected' | 'error'>('connected');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initializePlayer = async () => {
      if (!videoRef.current) return;

      try {
        if (isStreamer) {
          // For streamers, show their own camera feed
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              facingMode: 'user'
            }, 
            audio: true 
          });
          
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true; // Avoid feedback
          setMediaStream(stream);
          setStreamStatus('connected');
        } else {
          // For viewers - immediately show connected state
          setStreamStatus('connected');
        }
      } catch (error) {
        console.error('❌ Error initializing stream player:', error);
        setStreamStatus('error');
      }
    };

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
        // Viewers see a simulated live stream
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center text-white max-w-md mx-auto px-8">
            {/* Live pulse animation */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <span className="text-6xl">🔴</span>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping"></div>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">{stream.title}</h2>
            {stream.description && (
              <p className="text-lg opacity-80 mb-6">{stream.description}</p>
            )}
            
            <div className="bg-red-600/20 p-6 rounded-xl border border-red-500/30 backdrop-blur-sm mb-6">
              <div className="flex items-center justify-center mb-3">
                <Wifi className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-green-400 font-semibold">متصل بالبث المباشر</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-red-300 font-bold">مباشر الآن</span>
              </div>
            </div>
            
            <p className="text-xs opacity-50">
              المحتوى التفاعلي متاح من خلال الدردشة والهدايا
            </p>
          </div>
        </div>
      )}
      
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
}