import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SimpleZegoStream() {
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: عنوان, 2: كاميرا, 3: بث
  const [sdkLoaded, setSdkLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zegoEngineRef = useRef<any>(null);
  const roomIdRef = useRef<string>('');

  // تحميل ZEGO SDK عند تحميل الصفحة
  useEffect(() => {
    loadZegoSDK();
  }, []);

  const loadZegoSDK = async () => {
    try {
      // التحقق إذا كان SDK محمل بالفعل
      if (window.ZegoExpressEngine) {
        setSdkLoaded(true);
        console.log('✅ ZEGO SDK محمل مسبقاً');
        return;
      }

      console.log('📦 تحميل ZEGO SDK...');
      
      // حذف أي script موجود مسبقاً
      const existingScript = document.querySelector('script[src*="zego-express-engine"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/zego-express-engine-webrtc@3.2.0/index.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('انتهت مهلة تحميل SDK'));
        }, 10000); // 10 ثوان
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log('✅ تم تحميل ZEGO SDK');
          
          // التحقق من وجود ZegoExpressEngine
          setTimeout(() => {
            if (window.ZegoExpressEngine) {
              console.log('✅ ZegoExpressEngine متوفر');
              setSdkLoaded(true);
              resolve(true);
            } else {
              console.error('❌ ZegoExpressEngine غير متوفر بعد التحميل');
              reject(new Error('ZegoExpressEngine غير متوفر'));
            }
          }, 500);
        };
        
        script.onerror = (err) => {
          clearTimeout(timeout);
          console.error('❌ فشل في تحميل ZEGO SDK', err);
          reject(err);
        };
        
        document.head.appendChild(script);
      });

    } catch (err: any) {
      console.error('❌ خطأ في تحميل SDK:', err);
      setError(`فشل في تحميل نظام البث: ${err?.message || 'خطأ غير معروف'}`);
      
      // محاولة التحميل مرة أخرى بعد 3 ثوان
      setTimeout(() => {
        console.log('🔄 محاولة إعادة التحميل...');
        loadZegoSDK();
      }, 3000);
    }
  };

  const startStream = async () => {
    if (!title.trim()) {
      setError('أدخل عنوان البث');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // الخطوة 1: التحقق من SDK
      if (!sdkLoaded || !window.ZegoExpressEngine) {
        throw new Error('نظام البث غير محمل');
      }

      console.log('🎯 بدء عملية البث...');
      setStep(2);

      // الخطوة 2: طلب إذن الكاميرا
      console.log('📷 طلب إذن الكاميرا...');
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // عرض معاينة الكاميرا
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
        await videoRef.current.play();
        console.log('✅ الكاميرا تعمل');
      }

      setStep(3);

      // الخطوة 3: إعداد ZEGO
      const appID = 1034062164;
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      
      console.log('🔑 AppID:', appID);
      console.log('🔑 AppSign متوفر:', !!appSign);

      if (!appSign) {
        throw new Error('مفتاح الاستضافة غير متوفر');
      }

      // إنشاء ZEGO Engine
      zegoEngineRef.current = new window.ZegoExpressEngine(appID, appSign);
      console.log('✅ تم إنشاء ZEGO Engine');

      // إنشاء معرف الغرفة
      roomIdRef.current = `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🏠 معرف الغرفة:', roomIdRef.current);

      // دخول الغرفة
      const userInfo = {
        userID: `user-${Date.now()}`,
        userName: 'مذيع LaaBoBo'
      };

      await zegoEngineRef.current.loginRoom(roomIdRef.current, userInfo);
      console.log('✅ تم دخول الغرفة');

      // بدء البث
      const streamID = `stream-${roomIdRef.current}`;
      await zegoEngineRef.current.startPublishingStream(streamID, streamRef.current);
      console.log('🌐 تم بدء البث على ZEGO Cloud!');

      // حفظ معلومات البث في الذاكرة
      if (!(window as any).liveRooms) {
        (window as any).liveRooms = [];
      }
      
      (window as any).liveRooms.push({
        roomID: roomIdRef.current,
        streamID: streamID,
        title: title,
        hostName: 'مذيع LaaBoBo',
        viewerCount: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      setIsLive(true);
      setLoading(false);
      console.log('🎉 البث مباشر الآن!');

    } catch (err: any) {
      console.error('❌ خطأ في البث:', err);
      setLoading(false);
      
      let message = 'فشل في بدء البث';
      if (err.name === 'NotAllowedError') {
        message = 'تم رفض إذن الكاميرا - اسمح بالوصول';
      } else if (err.name === 'NotFoundError') {
        message = 'لم يتم العثور على كاميرا';
      } else if (err.message.includes('AppSign')) {
        message = 'خطأ في مفاتيح الاستضافة';
      }
      
      setError(message);
    }
  };

  const stopStream = async () => {
    try {
      console.log('⏹️ إيقاف البث...');

      if (zegoEngineRef.current) {
        await zegoEngineRef.current.stopPublishingStream();
        await zegoEngineRef.current.logoutRoom(roomIdRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // إزالة من قائمة البثوث
      if ((window as any).liveRooms) {
        (window as any).liveRooms = (window as any).liveRooms.filter(
          (room: any) => room.roomID !== roomIdRef.current
        );
      }

      setIsLive(false);
      setStep(1);
      setTitle('');
      console.log('✅ تم إيقاف البث');

    } catch (err) {
      console.error('خطأ في إيقاف البث:', err);
    }
  };

  if (!sdkLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-xl mb-4">تحميل نظام البث...</p>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={loadZegoSDK}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              🔄 إعادة المحاولة
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto">
        
        {/* شريط التقدم */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-pink-500' : 'bg-gray-600'}`}>
              1
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-pink-500' : 'bg-gray-600'}`}>
              2
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-pink-500' : 'bg-gray-600'}`}>
              3
            </div>
          </div>
          <p className="text-center text-gray-300">
            {step === 1 && 'أدخل عنوان البث'}
            {step === 2 && 'إعداد الكاميرا'}
            {step === 3 && 'البث المباشر'}
          </p>
        </div>

        {/* منطقة الفيديو */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
            {streamRef.current ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-2">📹</div>
                <p>معاينة الكاميرا</p>
              </div>
            )}
            
            {isLive && (
              <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-sm font-bold">
                🔴 مباشر
              </div>
            )}
          </div>
        </Card>

        {/* إدخال العنوان */}
        {!isLive && (
          <div className="space-y-4 mb-6">
            <Input
              type="text"
              placeholder="عنوان البث..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              dir="rtl"
            />
          </div>
        )}

        {/* رسائل الخطأ */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="space-y-3">
          {!isLive ? (
            <Button
              onClick={startStream}
              disabled={loading || !title.trim()}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
            >
              {loading ? '🔄 جاري البدء...' : '🎥 ابدأ البث المباشر'}
            </Button>
          ) : (
            <Button
              onClick={stopStream}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3"
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