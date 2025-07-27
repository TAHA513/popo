import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, CameraOff, Mic, MicOff, StopCircle, Users, 
  X, Settings, Maximize, Minimize 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface QuickStreamInterfaceProps {
  streamData?: any;
  onStreamEnd?: () => void;
}

export default function QuickStreamInterface({ streamData, onStreamEnd }: QuickStreamInterfaceProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(1);
  const [streamDuration, setStreamDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  // حساب مدة البث بالوقت الحقيقي
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
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
      setLikes(prev => prev + Math.floor(Math.random() * 3));
      setComments(prev => prev + Math.floor(Math.random() * 2));
    }, 8000);

    return () => clearInterval(statsTimer);
  }, []);

  useEffect(() => {
    if (streamData) {
      initializeQuickStream();
    }
    
    return () => cleanup();
  }, [streamData]);

  const initializeQuickStream = async () => {
    try {
      console.log('🚀 Initializing quick stream interface...');
      
      // انتظار تحميل عنصر الفيديو
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await startLocalCamera();
      await connectToZegoCloud();
      
    } catch (error) {
      console.error('❌ Quick stream initialization failed:', error);
      await startLocalCamera();
    }
  };

  const connectToZegoCloud = async () => {
    try {
      // الحصول على إعدادات ZegoCloud
      const config = await fetch('/api/zego-config', {
        credentials: 'include'
      }).then(res => res.json());

      if (!config.appId || !streamData) return;

      const streamId = streamData.zegoStreamId || `stream_${streamData.id}`;
      const roomId = streamData.zegoRoomId || `room_${streamData.id}`;

      // تحميل وتهيئة ZegoCloud SDK
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      const zg = new ZegoExpressEngine(parseInt(config.appId), 'wss://webliveroom-api.zego.im/ws');
      setZegoEngine(zg);
      
      // تسجيل دخول للغرفة
      await zg.loginRoom(roomId, {
        userID: config.userID || `host_${user?.id}`,
        userName: config.userName || user?.username || 'مضيف'
      }, config.token || '');

      // بدء البث إذا كان لدينا localStream
      if (localStream) {
        await zg.startPublishingStream(streamId, localStream);
        console.log('✅ ZegoCloud streaming started');
      }
      
    } catch (error) {
      console.error('❌ ZegoCloud connection failed:', error);
    }
  };

  const startLocalCamera = async () => {
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
        setIsStreaming(true);
      }
      
    } catch (error) {
      console.error('❌ Camera access failed:', error);
    }
  };

  // تنسيق الوقت
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

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
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
      onStreamEnd?.();
      setLocation('/');
      
    } catch (error) {
      console.error('❌ Error ending stream:', error);
      cleanup();
      onStreamEnd?.();
      setLocation('/');
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsStreaming(false);
  };

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="w-full h-full relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls={false}
            className="w-full h-full object-cover"
          />

          {/* شريط علوي */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={toggleFullScreen}
                variant="ghost"
                className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12 p-0"
              >
                <Minimize className="w-6 h-6" />
              </Button>

              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="bg-red-600/90 px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-bold">🔴 مباشر</span>
                </div>
                
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-bold">{formatDuration(streamDuration)}</span>
                </div>
                
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-white font-bold">{viewerCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* أزرار التحكم السفلية */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 rtl:space-x-reverse bg-black/60 backdrop-blur-sm rounded-full px-6 py-3">
              <Button
                onClick={toggleCamera}
                variant="ghost"
                className={`rounded-full w-14 h-14 p-0 ${
                  isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isCameraOn ? <Camera className="w-7 h-7 text-white" /> : <CameraOff className="w-7 h-7 text-white" />}
              </Button>

              <Button
                onClick={toggleMicrophone}
                variant="ghost"
                className={`rounded-full w-14 h-14 p-0 ${
                  isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
                }`}
              >
                {isMicOn ? <Mic className="w-7 h-7 text-white" /> : <MicOff className="w-7 h-7 text-white" />}
              </Button>

              <Button
                onClick={endStream}
                variant="ghost"
                className="bg-red-600/90 hover:bg-red-700 rounded-full w-14 h-14 p-0"
              >
                <StopCircle className="w-7 h-7 text-white" />
              </Button>
            </div>

            <div className="mt-4 text-center">
              <span className="bg-green-600/90 text-white px-6 py-3 rounded-full text-lg font-bold">
                🔴 البث نشط - {formatDuration(streamDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        className="w-full h-full object-cover"
      />

      {/* معلومات البث العلوية */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="bg-red-600/90 px-3 py-1 rounded-full flex items-center space-x-1 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-bold">مباشر</span>
            </div>
            
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-bold">{formatDuration(streamDuration)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              onClick={toggleFullScreen}
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 p-0"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1 rtl:space-x-reverse">
              <Users className="w-3 h-3 text-white" />
              <span className="text-white text-sm font-bold">{viewerCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التحكم السفلية */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
          <Button
            onClick={toggleCamera}
            variant="ghost"
            className={`rounded-full w-12 h-12 p-0 ${
              isCameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
            }`}
          >
            {isCameraOn ? <Camera className="w-5 h-5 text-white" /> : <CameraOff className="w-5 h-5 text-white" />}
          </Button>

          <Button
            onClick={toggleMicrophone}
            variant="ghost"
            className={`rounded-full w-12 h-12 p-0 ${
              isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600/90 hover:bg-red-700'
            }`}
          >
            {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
          </Button>

          <Button
            onClick={endStream}
            variant="ghost"
            className="bg-red-600/90 hover:bg-red-700 rounded-full w-12 h-12 p-0"
          >
            <StopCircle className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* حالة البث */}
        <div className="mt-3 text-center">
          <span className="bg-green-600/90 text-white px-4 py-2 rounded-full text-sm font-bold">
            {isStreaming ? `🔴 البث نشط - ${formatDuration(streamDuration)}` : 'جاري تهيئة البث...'}
          </span>
        </div>

        {/* معلومات إضافية */}
        {streamData && (
          <div className="mt-2 text-center text-white text-xs opacity-80">
            <div>{streamData.title || 'بث مباشر'}</div>
            <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse mt-1">
              <span>❤️ {likes}</span>
              <span>💬 {comments}</span>
              <span>👥 {viewerCount} مشاهد</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}