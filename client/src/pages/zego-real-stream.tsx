import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';

// ZEGO Cloud SDK
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}

export default function ZegoRealStream() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const zegoEngine = useRef<any>(null);
  const roomID = useRef<string>('');

  // تحميل ZEGO SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/zego-express-engine-webrtc@2.19.0/index.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ ZEGO SDK تم تحميله');
    };
    script.onerror = () => {
      setError('فشل في تحميل SDK');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const startZegoStream = async () => {
    if (!title.trim()) {
      setError('أدخل عنوان البث');
      return;
    }

    if (!window.ZegoExpressEngine) {
      setError('ZEGO SDK غير محمل');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔴 بدء البث باستخدام ZEGO Cloud...');

      // إعداد ZEGO Engine
      const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
      const appSign = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN;
      
      console.log('📱 AppID:', appID);
      console.log('🔑 AppSign متوفر:', appSign ? 'نعم' : 'لا');
      console.log('🔑 طول AppSign:', appSign ? appSign.length : 0);

      zegoEngine.current = new window.ZegoExpressEngine(appID, appSign);
      
      // إنشاء معرف غرفة فريد
      roomID.current = `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // معلومات المستخدم
      const userInfo = {
        userID: `user-${Date.now()}`,
        userName: 'مذيع LaaBoBo'
      };

      console.log('🏠 دخول الغرفة:', roomID.current);
      
      // دخول الغرفة
      await zegoEngine.current.loginRoom(roomID.current, userInfo);
      
      // بدء البث
      const streamID = `stream-${roomID.current}`;
      
      console.log('📹 بدء البث:', streamID);
      
      // الحصول على وسائط محلية
      const localStream = await zegoEngine.current.createStream({
        camera: {
          audio: true,
          video: true
        }
      });

      console.log('✅ تم الحصول على الوسائط المحلية');

      // عرض الفيديو محلياً
      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
        videoRef.current.muted = true;
        await videoRef.current.play();
        
        console.log('✅ الفيديو يعمل محلياً');
      }

      // نشر البث
      await zegoEngine.current.startPublishingStream(streamID, localStream);
      
      console.log('🌐 تم نشر البث بنجاح!');
      
      setIsLive(true);
      setLoading(false);

      // حفظ معلومات البث
      (window as any).activeZegoStream = {
        roomID: roomID.current,
        streamID: streamID,
        title: title,
        isActive: true,
        startTime: new Date().toISOString()
      };

      // محاكاة عدد المشاهدين
      const viewerInterval = setInterval(() => {
        if (isLive) {
          setViewerCount(Math.floor(Math.random() * 50) + 1);
        } else {
          clearInterval(viewerInterval);
        }
      }, 3000);

    } catch (err: any) {
      console.error('❌ خطأ في ZEGO:', err);
      setLoading(false);
      
      let message = 'فشل في بدء البث';
      if (err.code === 1003001) {
        message = 'خطأ في إعدادات ZEGO - تحقق من AppID و AppSign';
      } else if (err.toString().includes('camera')) {
        message = 'فشل في الوصول للكاميرا - اسمح بالوصول من إعدادات المتصفح';
      }
      
      setError(message + '\n\nخطأ تقني: ' + err.message);
    }
  };

  const stopZegoStream = async () => {
    try {
      console.log('⏹️ إيقاف بث ZEGO...');

      if (zegoEngine.current) {
        // إيقاف النشر
        await zegoEngine.current.stopPublishingStream();
        
        // مغادرة الغرفة
        await zegoEngine.current.logoutRoom(roomID.current);
        
        console.log('✅ تم إيقاف البث');
      }

      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
      }

      // إزالة من الذاكرة
      delete (window as any).activeZegoStream;

      setIsLive(false);
      setViewerCount(0);
      
      // العودة للرئيسية
      setTimeout(() => setLocation('/'), 1000);

    } catch (err: any) {
      console.error('❌ خطأ في إيقاف البث:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #667eea, #764ba2)', 
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* العنوان */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            🐰 LaaBoBo Live - ZEGO Cloud
          </h1>
          <p style={{ margin: 0, color: '#ccc' }}>بث مباشر حقيقي</p>
        </div>

        {!isLive ? (
          /* نموذج البث */
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>
              {loading ? '⏳' : '🔴'}
            </div>
            
            <h2 style={{ marginBottom: '20px', color: 'white' }}>
              {loading ? 'جاري إعداد البث...' : 'بث مباشر عبر ZEGO Cloud'}
            </h2>

            {error && (
              <div style={{
                background: '#dc2626',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                whiteSpace: 'pre-line',
                textAlign: 'left'
              }}>
                ❌ {error}
              </div>
            )}

            <input
              type="text"
              placeholder="عنوان البث..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginBottom: '20px',
                boxSizing: 'border-box',
                opacity: loading ? 0.5 : 1
              }}
            />

            <button
              onClick={startZegoStream}
              disabled={!title.trim() || loading}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                background: (title.trim() && !loading) ? '#dc2626' : '#666',
                color: 'white',
                cursor: (title.trim() && !loading) ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ جاري الإعداد...' : '🔴 بث مباشر ZEGO'}
            </button>

            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '10px',
              borderRadius: '8px',
              marginTop: '20px',
              fontSize: '14px'
            }}>
              🌐 بث حقيقي عبر ZEGO Cloud - AppID: 1034062164
            </div>
          </div>
        ) : (
          /* واجهة البث المباشر */
          <div>
            {/* شريط حالة البث */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#dc2626',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{ fontWeight: 'bold' }}>LIVE ZEGO</span>
                <span>{title}</span>
                <span style={{ 
                  background: '#10b981', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px' 
                }}>
                  👥 {viewerCount}
                </span>
              </div>
              
              <button
                onClick={stopZegoStream}
                style={{
                  padding: '8px 15px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                إيقاف
              </button>
            </div>

            {/* شاشة الفيديو */}
            <div style={{
              background: 'black',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '300px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
              
              {/* مؤشرات البث */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: '#10b981',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                🌐 ZEGO LIVE
              </div>

              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                Room: {roomID.current.slice(-8)}
              </div>
            </div>

            {/* رسالة النجاح */}
            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginTop: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ✅ بث مباشر حقيقي نشط!
              </div>
              <div style={{ fontSize: '14px' }}>
                يتم البث عبر خوادم ZEGO Cloud العالمية
              </div>
            </div>
          </div>
        )}

        {/* زر العودة */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setLocation('/')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#ccc',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← العودة للرئيسية
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}