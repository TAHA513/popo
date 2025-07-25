import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuthFixed';
import { ZEGO_CONFIG, initZegoEngine, generateZegoToken, ZegoUser, ZegoRoom } from '@/lib/zegoConfig';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Users, Heart, MessageCircle } from 'lucide-react';

interface ZegoLivePublisherProps {
  streamTitle: string;
  roomID: string;
  onStreamEnd: () => void;
}

export default function ZegoLivePublisher({ streamTitle, roomID, onStreamEnd }: ZegoLivePublisherProps) {
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

  useEffect(() => {
    initializeZego();
    return () => {
      cleanupZego();
    };
  }, []);

  const initializeZego = async () => {
    try {
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }

      console.log('🚀 Initializing ZEGO for publisher...');
      
      // Initialize ZEGO Engine
      const engine = await initZegoEngine(ZEGO_CONFIG.appID, ZEGO_CONFIG.server);
      
      // Generate authentication token
      const token = await generateZegoToken(user.id);
      
      // Create ZEGO user
      const zegoUser: ZegoUser = {
        userID: user.id,
        userName: user.firstName || user.username || 'مستخدم'
      };

      // Login to room
      const roomConfig = {
        userUpdate: true,
        maxMemberCount: 1000
      };

      await engine.loginRoom(roomID, token, zegoUser, roomConfig);
      console.log('✅ Logged into ZEGO room:', roomID);

      // Start publishing stream
      const streamID = `stream_${user.id}_${Date.now()}`;
      const publishConfig = {
        camera: {
          audio: true,
          video: true,
          videoInput: 'camera',
          audioInput: 'microphone'
        }
      };

      const localStream = await engine.createStream(publishConfig);
      
      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
      }

      await engine.startPublishingStream(streamID, localStream);
      console.log('✅ Started publishing stream:', streamID);

      // Store stream info
      localStorage.setItem('zegoStreamID', streamID);

      setZegoEngine(engine);
      setIsConnected(true);
      setIsPublishing(true);

      // Setup event listeners
      setupZegoEventListeners(engine);

    } catch (error: any) {
      console.error('❌ ZEGO initialization failed:', error);
      setError(error.message || 'فشل في تهيئة البث المباشر');
    }
  };

  const setupZegoEventListeners = (engine: any) => {
    // Room user update
    engine.on('roomUserUpdate', (roomID: string, updateType: string, userList: any[]) => {
      console.log('👥 Room users updated:', updateType, userList.length);
      setViewerCount(userList.length);
    });

    // Room state update
    engine.on('roomStateUpdate', (roomID: string, state: string, errorCode: number) => {
      console.log('🏠 Room state:', state, errorCode);
      if (state === 'DISCONNECTED') {
        setIsConnected(false);
      }
    });

    // Publisher state update
    engine.on('publisherStateUpdate', (streamID: string, state: string, errorCode: number) => {
      console.log('📡 Publisher state:', state, errorCode);
      if (state === 'PUBLISHING') {
        setIsPublishing(true);
      } else if (state === 'NO_PUBLISH') {
        setIsPublishing(false);
      }
    });
  };

  const toggleCamera = async () => {
    if (!zegoEngine) return;
    
    try {
      const newState = !cameraEnabled;
      await zegoEngine.mutePublishStreamVideo(!newState);
      setCameraEnabled(newState);
      console.log('📷 Camera toggled:', newState ? 'ON' : 'OFF');
    } catch (error) {
      console.error('❌ Failed to toggle camera:', error);
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
      console.error('❌ Failed to toggle microphone:', error);
    }
  };

  const endStream = async () => {
    try {
      if (zegoEngine) {
        const streamID = localStorage.getItem('zegoStreamID');
        if (streamID) {
          await zegoEngine.stopPublishingStream(streamID);
        }
        await zegoEngine.logoutRoom(roomID);
        console.log('✅ Stream ended successfully');
      }
      cleanupZego();
      onStreamEnd();
    } catch (error) {
      console.error('❌ Failed to end stream:', error);
      cleanupZego();
      onStreamEnd();
    }
  };

  const cleanupZego = () => {
    if (zegoEngine) {
      zegoEngine.destroyEngine();
    }
    localStorage.removeItem('zegoStreamID');
    setZegoEngine(null);
    setIsConnected(false);
    setIsPublishing(false);
  };

  // Simulate live interactions for demo
  useEffect(() => {
    if (isPublishing) {
      const interval = setInterval(() => {
        setLikes(prev => prev + Math.floor(Math.random() * 3));
        setComments(prev => prev + Math.floor(Math.random() * 2));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isPublishing]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-red-400 font-bold text-lg mb-2">خطأ في البث</h3>
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
            مباشر
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
            {isConnected && isPublishing ? 'البث نشط عبر ZEGO Cloud' : 'جاري الاتصال...'}
          </div>
        </div>
      </div>
    </div>
  );
}