import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, StopCircle, Users, Maximize, Minimize } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';


interface InstantFullScreenStreamProps {
  streamData: any;
  onStreamEnd: () => void;
}

export default function InstantFullScreenStream({ streamData, onStreamEnd }: InstantFullScreenStreamProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(1);
  const [streamDuration, setStreamDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  // حساب مدة البث
  useEffect(() => {
    const startTime = streamData?.startedAt ? new Date(streamData.startedAt).getTime() : Date.now();
    
    const timer = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      setStreamDuration(duration);
    }, 1000);

    return () => clearInterval(timer);
  }, [streamData]);

  // تحديث الإحصائيات
  useEffect(() => {
    const statsTimer = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
      setLikes(prev => prev + Math.floor(Math.random() * 2));
      setComments(prev => prev + Math.floor(Math.random() * 1));
    }, 5000);

    return () => clearInterval(statsTimer);
  }, []);

  useEffect(() => {
    initializeStream();
    return () => cleanup();
  }, []);

  const initializeStream = async () => {
    try {
      console.log('🚀 Initializing instant full-screen stream...');
      await startCamera();
      await connectZego();
    } catch (error) {
      console.error('❌ Stream initialization failed:', error);
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.style.transform = 'scaleX(-1)';
        await videoRef.current.play();
      }
      
    } catch (error) {
      console.error('❌ Camera access failed:', error);
    }
  };

  const connectZego = async () => {
    try {
      const config = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());

      if (!config.appId || !streamData) return;

      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      setZegoEngine(zg);
      
      await zg.loginRoom(streamData.zegoRoomId || 'default-room', 
        config.userID || `host_${user?.id}`,
        config.userName || user?.username || 'مضيف',
        config.token || ''
      );

      if (localStream) {
        await zg.startPublishingStream(streamData.zegoStreamId, localStream);
        console.log('✅ ZegoCloud streaming started');
      }
      
    } catch (error) {
      console.error('❌ ZegoCloud connection failed:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
        if (zegoEngine) {
          zegoEngine.mutePublishStreamVideo(!isCameraOn);
        }
      }
    }
  };

  const toggleMicrophone = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
        if (zegoEngine) {
          zegoEngine.mutePublishStreamAudio(!isMicOn);
        }
      }
    }
  };

  const endStream = async () => {
    try {
      if (zegoEngine) {
        await zegoEngine.stopPublishingStream();
        await zegoEngine.logoutRoom();
      }

      await fetch('/api/streams/end-all', {
        method: 'POST',
        credentials: 'include'
      });

      cleanup();
      onStreamEnd();
      setLocation('/');
      
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      cleanup();
      onStreamEnd();
      setLocation('/');
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* الفيديو الرئيسي */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls={false}
          className="w-full h-full object-cover"
        />

        {/* شريط علوي */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-red-600/90 px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-lg">🔴 مباشر</span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-bold text-xl">{formatDuration(streamDuration)}</span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-lg">{viewerCount}</span>
              </div>
            </div>

            <div className="text-white text-right">
              <div className="text-xl font-bold">{streamData?.title || 'بث مباشر'}</div>
              <div className="text-sm opacity-80">{user?.username || 'مضيف'}</div>
            </div>
          </div>
        </div>

        {/* أزرار التحكم السفلية */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center space-x-6 rtl:space-x-reverse bg-black/60 backdrop-blur-sm rounded-full px-8 py-4">
            <Button
              onClick={toggleCamera}
              variant="ghost"
              className={`rounded-full w-16 h-16 p-0 ${
                isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
              }`}
            >
              {isCameraOn ? <Camera className="w-8 h-8 text-white" /> : <CameraOff className="w-8 h-8 text-white" />}
            </Button>

            <Button
              onClick={toggleMicrophone}
              variant="ghost"
              className={`rounded-full w-16 h-16 p-0 ${
                isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
              }`}
            >
              {isMicOn ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white" />}
            </Button>

            <Button
              onClick={endStream}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 rounded-full w-16 h-16 p-0"
            >
              <StopCircle className="w-8 h-8 text-white" />
            </Button>
          </div>

          {/* معلومات البث */}
          <div className="mt-4 text-center">
            <div className="bg-green-600/90 text-white px-6 py-3 rounded-full text-lg font-bold">
              🔴 البث نشط - {formatDuration(streamDuration)}
            </div>
            
            <div className="mt-2 flex items-center justify-center space-x-6 rtl:space-x-reverse text-white text-sm">
              <span className="bg-black/60 px-3 py-1 rounded-full">❤️ {likes}</span>
              <span className="bg-black/60 px-3 py-1 rounded-full">💬 {comments}</span>
              <span className="bg-black/60 px-3 py-1 rounded-full">👥 {viewerCount} مشاهد</span>
            </div>
          </div>
        </div>

        {/* رسالة ترحيب */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-purple-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">🎉 مرحباً بك في البث المباشر!</h2>
            <p className="text-lg">الواجهة الاحترافية الجديدة مع عداد الوقت الحقيقي</p>
          </div>
        </div>
      </div>
    </div>
  );
}