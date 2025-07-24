import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function SimpleLiveStreaming() {
  const [, setLocation] = useLocation();
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  const nextStep = () => {
    if (!streamTitle.trim()) {
      setError('يرجى إدخال عنوان للبث');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const requestCameraPermissions = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Requesting camera and microphone permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('Camera permission granted');
      setLocalStream(stream);
      
      // Display stream in video element immediately
      console.log('Setting up video stream...');
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.playsInline = true;
        
        // Ensure video dimensions and visibility
        localVideoRef.current.style.display = 'block';
        localVideoRef.current.style.opacity = '1';
        localVideoRef.current.style.width = '100%';
        localVideoRef.current.style.height = '100%';
        
        // Force video to play
        try {
          await localVideoRef.current.play();
          console.log('✅ Video started playing successfully! Camera should be visible now.');
        } catch (playError) {
          console.error('❌ Video play error:', playError);
        }
      } else {
        console.error('❌ Video element not found!');
      }
      
      setCurrentStep(3);
      
    } catch (error: any) {
      console.error('Camera permission error:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('يرجى السماح بالوصول للكاميرا والميكروفون. اضغط على أيقونة القفل بجوار عنوان الموقع واختر "السماح"');
      } else if (error.name === 'NotFoundError') {
        setError('لم يتم العثور على كاميرا أو ميكروفون متصل بالجهاز');
      } else if (error.name === 'NotReadableError') {
        setError('الكاميرا أو الميكروفون قيد الاستخدام من تطبيق آخر');
      } else {
        setError('فشل في الوصول للكاميرا. تأكد من منح الإذن للمتصفح');
      }
    } finally {
      setLoading(false);
    }
  };

  const startLiveStream = async () => {
    setLoading(true);
    setError('');

    try {
      // Create simple stream notification in localStorage
      const streamData = {
        id: Date.now(),
        hostId: 'current-user',
        title: streamTitle,
        category: 'general',
        isActive: true,
        viewerCount: 1,
        hostName: 'المستخدم الحالي',
        hostAvatar: '🐰',
        createdAt: new Date().toISOString()
      };
      
      // Create unique but consistent stream ID
      const streamID = `stream_${streamData.id}`;
      const enhancedStreamData = {
        ...streamData,
        streamID: streamID,
        zegoRoomID: `room_${streamData.id}`,
        isPublisher: true
      };
      
      // Store notification with stream ID for viewers
      const streamDataStr = JSON.stringify(enhancedStreamData);
      const startTimeStr = Date.now().toString();
      
      localStorage.setItem('liveStreamNotification', streamDataStr);
      localStorage.setItem('liveStreamStartTime', startTimeStr);
      localStorage.setItem('currentStreamID', streamID);
      
      console.log('🔴 Stream notification created with streamID:', enhancedStreamData);
      console.log('📡 Stream ID for viewers:', streamID);
      
      // Initialize ZEGO streaming with proper stream ID
      try {
        await initializeZegoStreaming(streamID, enhancedStreamData.zegoRoomID);
        console.log('✅ ZEGO streaming initialized successfully');
      } catch (zegoError) {
        console.error('❌ ZEGO initialization failed:', zegoError);
      }

      setIsStreaming(true);
      setCurrentStep(4);
      
      // Simulate viewer interactions
      simulateViewerInteractions();
      
    } catch (error: any) {
      console.error('Start stream error:', error);
      setError(error.message || 'فشل في بدء البث المباشر');
    } finally {
      setLoading(false);
    }
  };

  const simulateViewerInteractions = () => {
    // Simulate viewer count growth
    let viewers = 1;
    const viewerInterval = setInterval(() => {
      viewers += Math.floor(Math.random() * 3);
      setViewerCount(viewers);
    }, 3000);

    // Simulate likes
    let currentLikes = 0;
    const likeInterval = setInterval(() => {
      currentLikes += Math.floor(Math.random() * 2);
      setLikes(currentLikes);
    }, 2000);

    // Cleanup after 5 minutes (demo)
    setTimeout(() => {
      clearInterval(viewerInterval);
      clearInterval(likeInterval);
    }, 300000);
  };

  const stopLiveStream = async () => {
    try {
      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // Stop ZEGO stream
      if ((window as any).zegoEngine) {
        try {
          const streamID = localStorage.getItem('currentStreamID');
          if (streamID) {
            await (window as any).zegoEngine.stopPublishingStream(streamID);
          }
          (window as any).zegoEngine.logoutRoom();
          (window as any).zegoEngine.destroyEngine();
          delete (window as any).zegoEngine;
          console.log('🛑 ZEGO stream stopped');
        } catch (error) {
          console.error('ZEGO stop error:', error);
        }
      }

      // Remove all stream notifications when stopping
      localStorage.removeItem('liveStreamNotification');
      localStorage.removeItem('liveStreamStartTime');
      localStorage.removeItem('currentStreamID');
      sessionStorage.removeItem('liveStreamNotification');
      sessionStorage.removeItem('liveStreamStartTime');
      delete (window as any).liveStreamData;
      delete (window as any).liveStreamStartTime;
      console.log('🛑 Stream manually ended - all notifications removed');

      setIsStreaming(false);
      setLocation('/');
      
    } catch (error) {
      console.error('Stop stream error:', error);
      setLocation('/');
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !cameraEnabled;
        setCameraEnabled(newState);
        videoTrack.enabled = newState;
        console.log('Camera toggled:', newState ? 'ON' : 'OFF');
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !micEnabled;
        setMicEnabled(newState);
        audioTrack.enabled = newState;
        console.log('Microphone toggled:', newState ? 'ON' : 'OFF');
      }
    }
  };

  // Ensure video element gets stream when component mounts or stream changes
  useEffect(() => {
    if (localStream && localVideoRef.current && currentStep >= 3) {
      console.log('🔄 Connecting stream to video element...');
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.autoplay = true;
      localVideoRef.current.playsInline = true;
      
      // Force play
      localVideoRef.current.play().then(() => {
        console.log('✅ Stream connected successfully!');
      }).catch(error => {
        console.error('❌ Failed to play video:', error);
      });
    }
  }, [localStream, currentStep]);

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ZEGO streaming functions
  const initializeZegoStreaming = async (streamID: string, roomID: string) => {
    try {
      console.log('🔧 Starting ZEGO initialization...');
      
      // Load ZEGO SDK if not loaded
      if (!window.ZegoExpressEngine) {
        console.log('📦 Loading ZEGO SDK...');
        await loadZegoSDK();
      }
      
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      
      if (!appID || !appSign) {
        throw new Error('ZEGO credentials not found');
      }

      // Create ZEGO engine
      const zg = new window.ZegoExpressEngine(appID, appSign);
      
      // Get token from server
      const response = await fetch('/api/zego-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: `publisher_${Date.now()}`,
          roomID: roomID
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get ZEGO token');
      }

      const { token, userID } = await response.json();
      console.log('🔑 Got publisher token for room:', roomID);

      // Login to room
      await zg.loginRoom(roomID, token, { userID, userName: 'المُبث' });
      console.log('🏠 Publisher logged into room successfully');

      // Start publishing stream with local video
      if (localStream) {
        console.log('📡 Starting to publish stream:', streamID);
        await zg.startPublishingStream(streamID, localStream);
        console.log('✅ Stream published successfully with ID:', streamID);
        
        // Store ZEGO instance for cleanup
        (window as any).zegoEngine = zg;
      }

    } catch (error) {
      console.error('❌ ZEGO streaming error:', error);
      throw error;
    }
  };

  const loadZegoSDK = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/zego-express-engine-webrtc@3.0.2/index.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Step 1: Stream Title */}
        {currentStep === 1 && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">🔴 بث مباشر</h1>
              <p className="text-gray-300">ابدأ البث المباشر الآن</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <label className="block text-sm font-medium mb-2">عنوان البث</label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="أدخل عنوان البث..."
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={nextStep}
                className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-3 px-6 rounded-lg font-medium transition-all duration-200"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Camera Permissions */}
        {currentStep === 2 && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">📹 تشغيل الكاميرا</h1>
              <p className="text-gray-300">نحتاج إذن للوصول للكاميرا والميكروفون</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold mb-2">اذن الكاميرا مطلوب</h3>
                <p className="text-gray-300 text-sm">سيطلب المتصفح إذن للوصول للكاميرا والميكروفون</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={requestCameraPermissions}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'جاري التحقق...' : '🎥 تشغيل الكاميرا'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Camera Preview */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">📸 معاينة الكاميرا</h1>
              <p className="text-gray-300">تحقق من إعدادات الكاميرا قبل البدء</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="relative">
                <video
                  ref={localVideoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-red-500'} hover:opacity-80 transition-opacity`}
                  >
                    {cameraEnabled ? '📹' : '📹❌'}
                  </button>
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-red-500'} hover:opacity-80 transition-opacity`}
                  >
                    {micEnabled ? '🎤' : '🎤❌'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  العودة
                </button>
                <button
                  onClick={startLiveStream}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'جاري البدء...' : '🔴 ابدأ البث'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Live Streaming */}
        {currentStep === 4 && isStreaming && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 font-semibold">مباشر</span>
                </div>
                <h1 className="text-2xl font-bold">{streamTitle}</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main video */}
              <div className="lg:col-span-3">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    className="w-full h-96 object-cover"
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                  />
                  
                  {/* Live controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                      onClick={toggleCamera}
                      className={`p-3 rounded-full ${cameraEnabled ? 'bg-green-500/80' : 'bg-red-500/80'} backdrop-blur-sm transition-all`}
                    >
                      {cameraEnabled ? '📹' : '📹❌'}
                    </button>
                    <button
                      onClick={toggleMic}
                      className={`p-3 rounded-full ${micEnabled ? 'bg-green-500/80' : 'bg-red-500/80'} backdrop-blur-sm transition-all`}
                    >
                      {micEnabled ? '🎤' : '🎤❌'}
                    </button>
                    <button
                      onClick={stopLiveStream}
                      className="p-3 rounded-full bg-red-600/80 hover:bg-red-700/80 backdrop-blur-sm transition-all"
                    >
                      ⏹️
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats sidebar */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                  <h3 className="font-semibold mb-3">إحصائيات البث</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>👁️ المشاهدون</span>
                      <span className="font-bold">{viewerCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>❤️ الإعجابات</span>
                      <span className="font-bold">{likes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⏱️ المدة</span>
                      <span className="font-bold">مباشر</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                  <h3 className="font-semibold mb-3">التحكم</h3>
                  <button
                    onClick={stopLiveStream}
                    className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    إنهاء البث
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}