import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Heart, MessageCircle } from 'lucide-react';

// ZEGO imports
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}

export default function ZegoViewer() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [streamData, setStreamData] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(1);
  const [likes, setLikes] = useState(0);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const zegoEngineRef = useRef<any>(null);

  useEffect(() => {
    // Get stream data from localStorage
    const streamDataStr = localStorage.getItem('liveStreamNotification');
    if (!streamDataStr) {
      setError('لا يوجد بث نشط حالياً');
      setIsLoading(false);
      return;
    }

    try {
      const data = JSON.parse(streamDataStr);
      setStreamData(data);
      initializeViewer(data);
    } catch (err) {
      setError('خطأ في بيانات البث');
      setIsLoading(false);
    }
  }, []);

  const initializeViewer = async (data: any) => {
    try {
      console.log('🎯 Initializing viewer for stream:', data);
      
      // Load ZEGO SDK
      if (!window.ZegoExpressEngine) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/zego-express-engine-webrtc@3.0.2/index.js';
        script.onload = () => connectToStream(data);
        script.onerror = () => setError('فشل في تحميل SDK');
        document.head.appendChild(script);
      } else {
        connectToStream(data);
      }
    } catch (err) {
      console.error('Viewer initialization error:', err);
      setError('فشل في تهيئة المشاهد');
      setIsLoading(false);
    }
  };

  const connectToStream = async (data: any) => {
    try {
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      
      if (!appID || !appSign) {
        throw new Error('ZEGO credentials not found');
      }

      // Create ZEGO engine
      const zg = new window.ZegoExpressEngine(appID, appSign);
      zegoEngineRef.current = zg;

      // Generate token for viewer
      const response = await fetch('/api/zego-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: `viewer_${Date.now()}`,
          roomID: data.zegoRoomID || `room_${data.id}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get ZEGO token');
      }

      const { token, userID } = await response.json();
      console.log('🔑 Got viewer token for room:', data.zegoRoomID);

      // Login to room
      await zg.loginRoom(
        data.zegoRoomID || `room_${data.id}`,
        token,
        { userID, userName: 'مشاهد' }
      );

      console.log('🏠 Viewer logged into room successfully');

      // Start playing the stream
      const streamID = data.streamID || `stream_${data.id}`;
      console.log('📺 Attempting to play stream:', streamID);

      const remoteStream = await zg.startPlayingStream(streamID);
      
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(console.error);
        console.log('✅ Stream connected successfully');
        setIsLoading(false);
        
        // Start viewer simulation
        simulateViewerActivity();
      } else {
        throw new Error('Failed to get remote stream');
      }

    } catch (err: any) {
      console.error('🚫 Stream connection error:', err);
      setError(err.message || 'فشل في الاتصال بالبث');
      setIsLoading(false);
    }
  };

  const simulateViewerActivity = () => {
    // Simulate viewer count changes
    let currentViewers = Math.floor(Math.random() * 20) + 5;
    setViewerCount(currentViewers);
    
    const viewerInterval = setInterval(() => {
      currentViewers += Math.floor(Math.random() * 3) - 1;
      currentViewers = Math.max(1, currentViewers);
      setViewerCount(currentViewers);
    }, 5000);

    // Simulate likes
    let currentLikes = Math.floor(Math.random() * 50) + 10;
    setLikes(currentLikes);
    
    const likeInterval = setInterval(() => {
      currentLikes += Math.floor(Math.random() * 2);
      setLikes(currentLikes);
    }, 3000);

    // Cleanup
    return () => {
      clearInterval(viewerInterval);
      clearInterval(likeInterval);
    };
  };

  const handleLeave = () => {
    if (zegoEngineRef.current) {
      zegoEngineRef.current.logoutRoom();
      zegoEngineRef.current.destroyEngine();
    }
    setLocation('/');
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
    // Add like animation effect here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>جاري الاتصال بالبث...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl mb-2">خطأ في البث</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => setLocation('/')} className="bg-red-500 hover:bg-red-600">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Video Player */}
      <video
        ref={remoteVideoRef}
        className="w-full h-screen object-cover"
        autoPlay
        playsInline
        muted={false}
      />
      
      {/* Overlay Controls */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <Button
            onClick={handleLeave}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5 ml-2" />
            الخروج
          </Button>
          
          <div className="flex items-center space-x-2 text-white">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">{viewerCount}</span>
          </div>
        </div>

        {/* Stream Info Overlay */}
        <div className="absolute bottom-20 left-4 text-white">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {streamData?.hostAvatar || '🐰'}
            </div>
            <div>
              <h3 className="font-semibold">{streamData?.title}</h3>
              <p className="text-sm text-gray-300">{streamData?.hostName}</p>
            </div>
          </div>
        </div>

        {/* Interaction Buttons */}
        <div className="absolute bottom-20 right-4 flex flex-col space-y-4">
          <Button
            onClick={handleLike}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12 p-0"
          >
            <Heart className="w-5 h-5" />
          </Button>
          <span className="text-white text-xs text-center">{likes}</span>
          
          <Button
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12 p-0"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* Live Badge */}
        <div className="absolute top-20 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>مباشر</span>
        </div>
      </div>
    </div>
  );
}