import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ZEGO SDK تهيئة مباشرة
const loadZegoScript = () => {
  return new Promise((resolve, reject) => {
    if (window.ZegoExpressEngine) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/zego-express-engine-webrtc@3.2.0/index.js';
    script.onload = () => {
      setTimeout(() => {
        if (window.ZegoExpressEngine) {
          resolve(true);
        } else {
          reject(new Error('SDK not available'));
        }
      }, 1000);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function UltraSimpleZego() {
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      console.log('🚀 تهيئة النظام...');
      await loadZegoScript();
      console.log('✅ تم تحميل ZEGO');
      setReady(true);
    } catch (err) {
      console.error('❌ فشل التهيئة:', err);
      setError('فشل في تحميل نظام البث');
    }
  };

  const startBroadcast = async () => {
    if (!title.trim()) {
      setError('أدخل عنوان البث');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. الحصول على الكاميرا
      console.log('📷 الحصول على الكاميرا...');
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // عرض الفيديو محلياً
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      // 2. إعداد ZEGO
      const appID = 1034062164;
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;

      if (!appSign) {
        throw new Error('مفتاح ZEGO غير متوفر');
      }

      engineRef.current = new window.ZegoExpressEngine(appID, appSign);

      // 3. إنشاء الغرفة والبث
      const roomID = `room-${Date.now()}`;
      const userID = `user-${Date.now()}`;
      const streamID = `stream-${Date.now()}`;

      await engineRef.current.loginRoom(roomID, { userID, userName: 'مذيع' });
      await engineRef.current.startPublishingStream(streamID, streamRef.current);

      console.log('🎉 البث بدأ!');
      setIsLive(true);
      setLoading(false);

    } catch (err: any) {
      console.error('❌ خطأ:', err);
      setLoading(false);
      
      if (err.name === 'NotAllowedError') {
        setError('تم رفض إذن الكاميرا');
      } else {
        setError(`خطأ: ${err.message}`);
      }
    }
  };

  const stopBroadcast = async () => {
    try {
      if (engineRef.current) {
        await engineRef.current.stopPublishingStream();
        await engineRef.current.logoutRoom();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsLive(false);
      setTitle('');
    } catch (err) {
      console.error('خطأ في الإيقاف:', err);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-pulse text-6xl mb-4">🐰</div>
          <p className="text-xl">تحميل LaaBoBo Live...</p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            🐰 LaaBoBo Live
          </h1>
        </div>

        {/* منطقة الفيديو */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
            {streamRef.current ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-2">📹</div>
                <p>اضغط لبدء البث</p>
              </div>
            )}
            
            {isLive && (
              <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                🔴 مباشر
              </div>
            )}
          </div>
        </div>

        {/* إدخال العنوان */}
        {!isLive && (
          <div className="mb-6">
            <Input
              type="text"
              placeholder="عنوان البث..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white text-right"
              dir="rtl"
            />
          </div>
        )}

        {/* رسائل الخطأ */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="space-y-3">
          {!isLive ? (
            <Button
              onClick={startBroadcast}
              disabled={loading || !title.trim()}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-bold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  جاري البدء...
                </div>
              ) : (
                '🎥 ابدأ البث المباشر'
              )}
            </Button>
          ) : (
            <Button
              onClick={stopBroadcast}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 text-lg font-bold"
            >
              ⏹️ إيقاف البث
            </Button>
          )}
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}