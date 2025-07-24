import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface ZegoStreamInterface {
  appID: number;
  server: string;
  token: string;
  userID: string;
  userName: string;
  roomID: string;
}

export default function ZegoLiveStream() {
  const [, setLocation] = useLocation();
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zegoConfig, setZegoConfig] = useState<ZegoStreamInterface | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  
  const zegoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Get ZEGO token from our server
  const getZegoToken = async (userID: string, roomID: string) => {
    try {
      const response = await fetch('/api/zego/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('فشل في الحصول على رمز ZEGO');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('ZEGO token error:', error);
      throw error;
    }
  };

  // Initialize ZEGO streaming
  const initializeZegoStream = async () => {
    setLoading(true);
    setError('');

    try {
      const roomID = `room_${Date.now()}`;
      const userID = `user_${Date.now()}`;
      const userName = 'المذيع';

      // Get token from our server
      const token = await getZegoToken(userID, roomID);

      const config: ZegoStreamInterface = {
        appID: 1034062164, // Your ZEGO App ID
        server: 'wss://webliveroom1034062164-api.coolzcloud.com/ws',
        token,
        userID,
        userName,
        roomID
      };

      setZegoConfig(config);
      setCurrentStep(2);

    } catch (error: any) {
      setError(error.message || 'فشل في تهيئة البث');
    } finally {
      setLoading(false);
    }
  };

  // Start streaming with ZEGO interface
  const startZegoStream = async () => {
    if (!zegoConfig) return;

    setLoading(true);
    try {
      // Create ZEGO streaming interface URL
      const zegoUrl = `https://console.zegocloud.com/webrtc/demo?` +
        `appID=${zegoConfig.appID}&` +
        `server=${encodeURIComponent(zegoConfig.server)}&` +
        `token=${zegoConfig.token}&` +
        `userID=${zegoConfig.userID}&` +
        `userName=${encodeURIComponent(zegoConfig.userName)}&` +
        `roomID=${zegoConfig.roomID}&` +
        `role=anchor`; // anchor = streamer

      // Open ZEGO interface in iframe or new window
      if (zegoContainerRef.current) {
        const iframe = document.createElement('iframe');
        iframe.src = zegoUrl;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '12px';
        
        zegoContainerRef.current.innerHTML = '';
        zegoContainerRef.current.appendChild(iframe);
      }

      setIsStreaming(true);
      setCurrentStep(3);
      
      // Simulate viewer interactions
      simulateViewerStats();

    } catch (error: any) {
      setError(error.message || 'فشل في بدء البث');
    } finally {
      setLoading(false);
    }
  };

  const simulateViewerStats = () => {
    let viewers = 1;
    let currentLikes = 0;

    const viewerInterval = setInterval(() => {
      viewers += Math.floor(Math.random() * 3);
      setViewerCount(viewers);
    }, 5000);

    const likeInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        currentLikes += Math.floor(Math.random() * 3) + 1;
        setLikes(currentLikes);
      }
    }, 3000);

    // Cleanup after stream ends
    setTimeout(() => {
      clearInterval(viewerInterval);
      clearInterval(likeInterval);
    }, 300000); // 5 minutes
  };

  const stopStream = () => {
    setIsStreaming(false);
    if (zegoContainerRef.current) {
      zegoContainerRef.current.innerHTML = '';
    }
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Step 1: Stream Title */}
        {currentStep === 1 && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">⚡ بث ZEGO Cloud</h1>
              <p className="text-gray-300">بث مباشر باستخدام تقنية ZEGO المتقدمة</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <label className="block text-sm font-medium mb-2">عنوان البث</label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="أدخل عنوان البث..."
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <div className="flex space-x-2 mt-6">
                <Button
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={initializeZegoStream}
                  disabled={loading || !streamTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  {loading ? 'جاري التحضير...' : 'التالي'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: ZEGO Configuration */}
        {currentStep === 2 && zegoConfig && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">🎯 إعداد البث</h1>
              <p className="text-gray-300">جاري تحضير واجهة ZEGO Cloud</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">رقم الغرفة</label>
                  <div className="bg-white/10 rounded-lg p-2 text-sm font-mono">
                    {zegoConfig.roomID}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">معرف المستخدم</label>
                  <div className="bg-white/10 rounded-lg p-2 text-sm font-mono">
                    {zegoConfig.userID}
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold mb-2">واجهة ZEGO Cloud جاهزة</h3>
                <p className="text-gray-300 text-sm">اضغط لبدء البث باستخدام واجهة ZEGO المتقدمة</p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  العودة
                </Button>
                <Button
                  onClick={startZegoStream}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {loading ? 'جاري البدء...' : '🚀 ابدأ البث'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Live Streaming Interface */}
        {currentStep === 3 && isStreaming && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 font-semibold">مباشر على ZEGO</span>
                </div>
                <h1 className="text-2xl font-bold">{streamTitle}</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* ZEGO Stream Interface */}
              <div className="lg:col-span-3">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
                  <div 
                    ref={zegoContainerRef}
                    className="w-full min-h-[500px] bg-black rounded-lg flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">⚡</div>
                      <p className="text-gray-300">جاري تحميل واجهة ZEGO...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Sidebar */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-center">إحصائيات البث</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>👁️</span>
                        <span>المشاهدون</span>
                      </span>
                      <span className="font-bold text-blue-400">{viewerCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>❤️</span>
                        <span>الإعجابات</span>
                      </span>
                      <span className="font-bold text-red-400">{likes}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>⚡</span>
                        <span>ZEGO</span>
                      </span>
                      <span className="font-bold text-green-400">متصل</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-center">الأدوات</h3>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-yellow-500 hover:bg-yellow-600"
                      onClick={() => alert('نظام الهدايا قريباً!')}
                    >
                      🎁 إضافة الهدايا
                    </Button>
                    
                    <Button 
                      className="w-full bg-purple-500 hover:bg-purple-600"
                      onClick={() => alert('إعدادات البث')}
                    >
                      ⚙️ الإعدادات
                    </Button>
                    
                    <Button 
                      onClick={stopStream}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      ⏹️ إنهاء البث
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                يتم تشغيل البث باستخدام تقنية ZEGO Cloud المتقدمة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}