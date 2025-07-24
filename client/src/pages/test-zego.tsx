import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function TestZego() {
  const [status, setStatus] = useState('تحميل...');
  const [appSignStatus, setAppSignStatus] = useState('فحص...');
  const [error, setError] = useState('');

  useEffect(() => {
    testZegoConnection();
  }, []);

  const testZegoConnection = async () => {
    try {
      setStatus('فحص اتصال ZEGO Cloud...');
      
      // فحص AppSign
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      console.log('🔑 VITE_ZEGOCLOUD_APP_SIGN:', appSign ? 'متوفر' : 'غير متوفر');
      console.log('📏 طول AppSign:', appSign ? appSign.length : 0);
      
      if (!appSign) {
        setAppSignStatus('❌ AppSign غير متوفر');
        setError('VITE_ZEGOCLOUD_APP_SIGN غير موجود في متغيرات البيئة');
        return;
      } else {
        setAppSignStatus('✅ AppSign متوفر');
      }

      // تحميل ZEGO SDK
      setStatus('تحميل ZEGO SDK...');
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/zego-express-engine-webrtc@3.2.0/index.js';
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      if (!window.ZegoExpressEngine) {
        throw new Error('ZegoExpressEngine غير متوفر بعد تحميل SDK');
      }

      setStatus('✅ تم تحميل ZEGO SDK بنجاح');

      // اختبار تهيئة Engine
      const appID = 1034062164;
      console.log('🔧 إنشاء ZEGO Engine...');
      console.log('📱 AppID:', appID);
      
      const engine = new window.ZegoExpressEngine(appID, appSign);
      console.log('✅ تم إنشاء ZEGO Engine بنجاح');
      
      setStatus('✅ ZEGO Cloud جاهز للاستخدام!');

    } catch (err: any) {
      console.error('❌ خطأ في اختبار ZEGO:', err);
      setError(`خطأ: ${err.message}`);
      setStatus('❌ فشل في الاتصال');
    }
  };

  const testCamera = async () => {
    try {
      setStatus('فحص الكاميرا...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStatus('✅ الكاميرا تعمل بشكل صحيح');
      
      // إيقاف البث
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err: any) {
      console.error('❌ خطأ في الكاميرا:', err);
      setError(`خطأ الكاميرا: ${err.message}`);
      setStatus('❌ فشل في الوصول للكاميرا');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">🧪 اختبار ZEGO Cloud</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">حالة الاتصال:</h3>
            <p className="text-blue-600">{status}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">AppSign:</h3>
            <p className="text-green-600">{appSignStatus}</p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800">خطأ:</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={testZegoConnection}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              🔄 إعادة فحص ZEGO
            </Button>
            
            <Button 
              onClick={testCamera}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              📷 فحص الكاميرا
            </Button>
          </div>
          
          <div className="text-center pt-4">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}