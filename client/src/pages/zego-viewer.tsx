import { useState, useRef, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';

// ZEGO Cloud SDK للمشاهدين
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}

export default function ZegoViewer() {
  const [, params] = useRoute('/zego-viewer/:roomId');
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [streamEnded, setStreamEnded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const zegoEngine = useRef<any>(null);

  // تحميل ZEGO SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/zego-express-engine-webrtc@2.19.0/index.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ ZEGO SDK محمل للمشاهد');
      joinStream();
    };
    script.onerror = () => {
      setError('فشل في تحميل SDK');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const joinStream = async () => {
    if (!window.ZegoExpressEngine || !params?.roomId) {
      setError('معرف البث غير صحيح');
      setLoading(false);
      return;
    }

    try {
      console.log('👁️ انضمام للبث كمشاهد...', params.roomId);

      // إعداد ZEGO Engine
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      
      zegoEngine.current = new window.ZegoExpressEngine(appID, appSign);
      
      // معلومات المشاهد
      const userInfo = {
        userID: `viewer-${Date.now()}`,
        userName: `مشاهد ${Math.floor(Math.random() * 1000)}`
      };

      // دخول الغرفة
      await zegoEngine.current.loginRoom(params.roomId, userInfo);
      
      console.log('✅ تم دخول الغرفة');

      // البحث عن البث النشط
      const streamID = `stream-${params.roomId}`;
      
      // استقبال البث
      zegoEngine.current.on('streamAdd', async (streamList: any[]) => {
        console.log('📺 تم العثور على بث:', streamList);
        
        if (streamList.length > 0) {
          const stream = streamList[0];
          
          // تشغيل البث
          const remoteStream = await zegoEngine.current.startPlayingStream(stream.streamID);
          
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            await videoRef.current.play();
            console.log('✅ يتم عرض البث المباشر');
          }
          
          setLoading(false);
          
          // الحصول على معلومات البث من الذاكرة
          const activeRooms = (window as any).liveRooms || [];
          const roomInfo = activeRooms.find((room: any) => room.roomID === params.roomId);
          if (roomInfo) {
            setStreamTitle(roomInfo.title);
          }
        }
      });

      // استمع لانتهاء البث
      zegoEngine.current.on('streamRemove', () => {
        console.log('📺 انتهى البث');
        setStreamEnded(true);
        setLoading(false);
      });

      // محاكاة عدد المشاهدين
      const viewerInterval = setInterval(() => {
        setViewerCount(Math.floor(Math.random() * 100) + 1);
      }, 3000);

      // تنظيف
      return () => {
        clearInterval(viewerInterval);
      };

    } catch (err: any) {
      console.error('❌ خطأ في المشاهدة:', err);
      setError('فشل في الانضمام للبث: ' + err.message);
      setLoading(false);
    }
  };

  const leaveStream = async () => {
    try {
      if (zegoEngine.current) {
        await zegoEngine.current.logoutRoom(params?.roomId);
      }
      setLocation('/');
    } catch (err) {
      console.error('خطأ في مغادرة البث:', err);
      setLocation('/');
    }
  };

  if (streamEnded) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">انتهى البث المباشر</h1>
          <p className="text-gray-300 mb-6">شكراً لمشاهدتك</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* شريط علوي */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <button
          onClick={leaveStream}
          className="text-white hover:text-pink-300"
        >
          ← العودة
        </button>
        <div className="text-white text-center">
          <h1 className="font-bold">{streamTitle || 'بث مباشر'}</h1>
          <p className="text-sm text-gray-300">👁️ {viewerCount} مشاهد</p>
        </div>
        <div className="w-16"></div>
      </div>

      {/* منطقة الفيديو */}
      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>جاري الانضمام للبث...</p>
          </div>
        ) : error ? (
          <div className="text-center text-white">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-xl mb-4">خطأ في تحميل البث</p>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => setLocation('/')}
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <video
              ref={videoRef}
              className="w-full h-auto rounded-lg shadow-lg"
              controls={false}
              autoPlay
              playsInline
            />
            
            {/* تفاعلات جانبية */}
            <div className="absolute right-4 bottom-20 space-y-4">
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30">
                ❤️
              </button>
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30">
                💬
              </button>
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/30">
                🎁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}