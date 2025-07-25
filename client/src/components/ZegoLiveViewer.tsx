import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuthFixed';
import { ZEGO_CONFIG, initZegoEngine, generateZegoToken, ZegoUser } from '@/lib/zegoConfig';
import { Heart, MessageCircle, Share, Gift, Users, Volume2, VolumeX } from 'lucide-react';

interface ZegoLiveViewerProps {
  streamID: string;
  roomID: string;
  streamTitle: string;
  publisherName: string;
  onBack: () => void;
}

export default function ZegoLiveViewer({ 
  streamID, 
  roomID, 
  streamTitle, 
  publisherName, 
  onBack 
}: ZegoLiveViewerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [streamEnded, setStreamEnded] = useState(false);

  useEffect(() => {
    initializeZegoViewer();
    return () => {
      cleanupZego();
    };
  }, []);

  const initializeZegoViewer = async () => {
    try {
      if (!user) {
        setError('يجب تسجيل الدخول لمشاهدة البث');
        return;
      }

      console.log('🎥 Initializing ZEGO viewer for stream:', streamID);
      
      // Initialize ZEGO Engine
      const engine = await initZegoEngine(ZEGO_CONFIG.appID, ZEGO_CONFIG.server);
      
      // Generate authentication token
      const token = await generateZegoToken(user.id);
      
      // Create ZEGO user
      const zegoUser: ZegoUser = {
        userID: user.id,
        userName: user.firstName || user.username || 'مشاهد'
      };

      // Login to room
      const roomConfig = {
        userUpdate: true,
        maxMemberCount: 1000
      };

      await engine.loginRoom(roomID, token, zegoUser, roomConfig);
      console.log('✅ Joined ZEGO room as viewer:', roomID);

      // Start playing the stream
      const remoteStream = await engine.startPlayingStream(streamID);
      
      if (videoRef.current && remoteStream) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.play();
      }

      console.log('✅ Started playing stream:', streamID);

      setZegoEngine(engine);
      setIsConnected(true);
      setIsPlaying(true);

      // Setup event listeners
      setupZegoEventListeners(engine);

    } catch (error: any) {
      console.error('❌ ZEGO viewer initialization failed:', error);
      if (error.message?.includes('stream not found') || error.message?.includes('room not found')) {
        setStreamEnded(true);
        setError('انتهى البث المباشر');
      } else {
        setError(error.message || 'فشل في الاتصال بالبث المباشر');
      }
    }
  };

  const setupZegoEventListeners = (engine: any) => {
    // Room user update
    engine.on('roomUserUpdate', (roomID: string, updateType: string, userList: any[]) => {
      console.log('👥 Viewers updated:', updateType, userList.length);
      setViewerCount(userList.length);
    });

    // Stream update
    engine.on('roomStreamUpdate', (roomID: string, updateType: string, streamList: any[]) => {
      console.log('📡 Stream update:', updateType, streamList.length);
      if (updateType === 'DELETE' && streamList.length === 0) {
        setStreamEnded(true);
        setError('انتهى البث المباشر');
      }
    });

    // Player state update
    engine.on('playerStateUpdate', (streamID: string, state: string, errorCode: number) => {
      console.log('🎮 Player state:', state, errorCode);
      if (state === 'PLAYING') {
        setIsPlaying(true);
      } else if (state === 'NO_PLAY') {
        setIsPlaying(false);
      }
    });

    // Room state update
    engine.on('roomStateUpdate', (roomID: string, state: string, errorCode: number) => {
      console.log('🏠 Room state:', state, errorCode);
      if (state === 'DISCONNECTED') {
        setIsConnected(false);
      }
    });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !muted;
      videoRef.current.muted = newMutedState;
      setMuted(newMutedState);
    }
  };

  const sendLike = async () => {
    try {
      // Simulate sending like
      setLikes(prev => prev + 1);
      
      // Show heart animation
      showHeartAnimation();
      
      console.log('❤️ Like sent');
    } catch (error) {
      console.error('❌ Failed to send like:', error);
    }
  };

  const showHeartAnimation = () => {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'fixed text-4xl pointer-events-none z-50 animate-bounce';
    heart.style.left = Math.random() * window.innerWidth + 'px';
    heart.style.top = window.innerHeight - 200 + 'px';
    heart.style.animation = 'float-up 3s ease-out forwards';
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
      document.body.removeChild(heart);
    }, 3000);
  };

  const cleanupZego = () => {
    if (zegoEngine) {
      try {
        zegoEngine.stopPlayingStream(streamID);
        zegoEngine.logoutRoom(roomID);
        zegoEngine.destroyEngine();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    setZegoEngine(null);
    setIsConnected(false);
    setIsPlaying(false);
  };

  // Simulate live interactions for demo
  useEffect(() => {
    if (isPlaying && !streamEnded) {
      const interval = setInterval(() => {
        setComments(prev => prev + Math.floor(Math.random() * 2));
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, streamEnded]);

  if (streamEnded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-white font-bold text-xl mb-2">انتهى البث المباشر</h3>
          <p className="text-gray-400 mb-6">شكراً لمشاهدتك البث مع {publisherName}</p>
          <Button 
            onClick={onBack}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  if (error && !streamEnded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-8 max-w-md w-full text-center">
          <h3 className="text-red-400 font-bold text-lg mb-2">خطأ في البث</h3>
          <p className="text-red-300 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={initializeZegoViewer}
              className="bg-red-500 hover:bg-red-600 text-white w-full"
            >
              إعادة المحاولة
            </Button>
            <Button 
              onClick={onBack}
              variant="outline"
              className="text-red-400 border-red-400 hover:bg-red-500/20 w-full"
            >
              العودة للرئيسية
            </Button>
          </div>
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
        className="absolute inset-0 w-full h-full object-cover"
        muted={muted}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/20 p-2"
          >
            ←
          </Button>
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
            مباشر
          </div>
          <div className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {viewerCount}
          </div>
        </div>
        
        <Button
          onClick={toggleMute}
          variant="ghost"
          className="text-white hover:bg-white/20 p-2"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Stream Info */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        <h1 className="text-white font-bold text-lg mb-1 truncate">
          {streamTitle}
        </h1>
        <p className="text-gray-300 text-sm">
          بث مباشر من {publisherName}
        </p>
      </div>

      {/* Side Actions */}
      <div className="absolute right-4 bottom-32 space-y-6">
        <button
          onClick={sendLike}
          className="flex flex-col items-center text-white hover:scale-110 transition-transform"
        >
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-1">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-sm font-bold">{likes}</span>
        </button>
        
        <div className="flex flex-col items-center text-white">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-1">
            <MessageCircle className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-sm font-bold">{comments}</span>
        </div>
        
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-1">
            <Share className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-sm font-bold">مشاركة</span>
        </button>
        
        <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-1">
            <Gift className="w-6 h-6 text-yellow-400" />
          </div>
          <span className="text-sm font-bold">هدية</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
          isConnected && isPlaying 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected && isPlaying ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
          }`}></div>
          {isConnected && isPlaying ? 'متصل عبر ZEGO Cloud' : 'جاري الاتصال...'}
        </div>
      </div>

      {/* CSS for heart animation */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px);
          }
        }
      `}</style>
    </div>
  );
}