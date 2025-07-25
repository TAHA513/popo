import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuthFixed';
import { 
  ZEGO_STANDALONE_CONFIG, 
  initStandaloneZego, 
  generateStandaloneToken,
  createZegoUser,
  createZegoRoom 
} from '@/lib/zegoStandalone';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Users, Heart, MessageCircle } from 'lucide-react';

interface ZegoStandaloneProps {
  streamTitle: string;
  onStreamEnd: () => void;
}

export default function ZegoStandalone({ streamTitle, onStreamEnd }: ZegoStandaloneProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roomID] = useState(`room_${Date.now()}`);

  useEffect(() => {
    initializeStandaloneStreaming();
    return () => {
      cleanup();
    };
  }, []);

  const initializeStandaloneStreaming = async () => {
    try {
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }

      console.log('🚀 Initializing standalone ZEGO streaming...');
      
      // Initialize ZEGO Engine without server dependency
      const engine = await initStandaloneZego(
        ZEGO_STANDALONE_CONFIG.appID, 
        ZEGO_STANDALONE_CONFIG.server
      );
      
      setZegoEngine(engine);
      
      // Generate standalone token
      const token = generateStandaloneToken(user.id, roomID);
      console.log('🔑 Generated standalone token');
      
      // Create user and room objects
      const zegoUser = createZegoUser(user.id, user.username || 'المستخدم');
      const zegoRoom = createZegoRoom(roomID, streamTitle);
      
      // Login to room
      await engine.loginRoom(zegoRoom.roomID, token, zegoUser);
      setIsConnected(true);
      console.log('✅ Connected to ZEGO room independently');
      
      // Start camera preview
      await startCameraPreview(engine);
      
      // Start publishing stream
      await startPublishing(engine);
      
    } catch (error) {
      console.error('❌ Standalone streaming initialization failed:', error);
      setError('فشل في تهيئة البث المستقل: ' + (error as Error).message);
    }
  };

  const startCameraPreview = async (engine: any) => {
    try {
      const constraints = {
        camera: {
          video: cameraEnabled,
          audio: micEnabled
        }
      };

      await engine.startPreview(videoRef.current, constraints);
      console.log('📹 Camera preview started independently');
    } catch (error) {
      console.error('❌ Camera preview failed:', error);
      setError('فشل في تشغيل الكاميرا: ' + (error as Error).message);
    }
  };

  const startPublishing = async (engine: any) => {
    try {
      const streamID = `stream_${user?.id}_${Date.now()}`;
      await engine.startPublishingStream(streamID);
      setIsPublishing(true);
      console.log('📡 Publishing stream independently:', streamID);
    } catch (error) {
      console.error('❌ Publishing failed:', error);
      setError('فشل في بدء البث: ' + (error as Error).message);
    }
  };

  const toggleCamera = async () => {
    if (!zegoEngine) return;
    
    try {
      const newState = !cameraEnabled;
      await zegoEngine.mutePublishStreamVideo(!newState);
      setCameraEnabled(newState);
      console.log('📹 Camera toggled:', newState ? 'ON' : 'OFF');
    } catch (error) {
      console.error('❌ Camera toggle failed:', error);
    }
  };

  const toggleMic = async () => {
    if (!zegoEngine) return;
    
    try {
      const newState = !micEnabled;
      await zegoEngine.mutePublishStreamAudio(!newState);
      setMicEnabled(newState);
      console.log('🎤 Microphone toggled:', newState ? 'ON' : 'OFF');
    } catch (error) {
      console.error('❌ Microphone toggle failed:', error);
    }
  };

  const endStream = async () => {
    try {
      await cleanup();
      onStreamEnd();
    } catch (error) {
      console.error('❌ End stream failed:', error);
      onStreamEnd(); // End anyway
    }
  };

  const cleanup = async () => {
    try {
      if (zegoEngine) {
        if (isPublishing) {
          await zegoEngine.stopPublishingStream();
        }
        await zegoEngine.stopPreview();
        await zegoEngine.logoutRoom();
        console.log('🧹 ZEGO cleanup completed independently');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-red-400 font-bold text-lg mb-2">خطأ في البث المستقل</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <Button 
            onClick={onStreamEnd}
            variant="outline"
            className="text-red-400 border-red-400 hover:bg-red-500/20"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
            مباشر مستقل
          </div>
          <div className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {viewerCount}
          </div>
        </div>
        
        <h1 className="text-white font-bold text-lg flex-1 text-center px-4 truncate">
          {streamTitle}
        </h1>
        
        <div className="w-16"></div>
      </div>

      {/* Side Stats */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-6">
        <div className="flex flex-col items-center text-white">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-1">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-sm font-bold">{likes}</span>
        </div>
        
        <div className="flex flex-col items-center text-white">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-1">
            <MessageCircle className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-sm font-bold">{comments}</span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center justify-center space-x-6">
          <Button
            onClick={toggleCamera}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              cameraEnabled 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {cameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>
          
          <Button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              micEnabled 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          
          <Button
            onClick={endStream}
            className="w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Connection Status */}
        <div className="text-center mt-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected && isPublishing 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected && isPublishing ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
            }`}></div>
            {isConnected && isPublishing ? 'البث نشط مستقل عبر ZEGO Cloud' : 'جاري الاتصال المستقل...'}
          </div>
        </div>
      </div>
    </div>
  );
}