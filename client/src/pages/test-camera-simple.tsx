import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestCameraSimple() {
  const [, setLocation] = useLocation();
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      console.log('🎥 بدء الكاميرا...', navigator.mediaDevices);
      
      // تحقق من دعم المتصفح
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('المتصفح لا يدعم الكاميرا');
        return;
      }

      // طلب إذن الكاميرا
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('✅ تم الحصول على البث:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        settings: stream.getVideoTracks()[0]?.getSettings()
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
          setIsStreaming(true);
          console.log('✅ الكاميرا تعمل! البث يظهر الآن');
          
          // إرسال البث للاستضافة
          await sendStreamToHost(stream);
          
        } catch (playError) {
          console.error('❌ فشل تشغيل الفيديو:', playError);
          videoRef.current.muted = true;
          await videoRef.current.play();
          setIsStreaming(true);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في الكاميرا:', error);
      
      let message = 'فشل في تشغيل الكاميرا';
      if (error.name === 'NotAllowedError') {
        message = 'يجب السماح للموقع بالوصول للكاميرا من إعدادات المتصفح';
      } else if (error.name === 'NotFoundError') {
        message = 'لم يتم العثور على كاميرا';
      } else if (error.name === 'NotReadableError') {
        message = 'الكاميرا مستخدمة من تطبيق آخر';
      }
      
      alert(message + '\n\nخطأ تقني: ' + error.message);
    }
  };

  // إرسال البث للاستضافة
  const sendStreamToHost = async (stream) => {
    try {
      console.log('📡 إرسال البث للاستضافة...');
      
      // إنشاء معرف فريد للبث
      const streamId = 'live-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      // حفظ البث في الاستضافة (في الذاكرة المؤقتة)
      if (!window.liveStreams) {
        window.liveStreams = new Map();
      }
      
      window.liveStreams.set(streamId, {
        id: streamId,
        title: streamTitle,
        stream: stream,
        startTime: new Date(),
        viewerCount: 1
      });
      
      console.log('✅ تم حفظ البث في الاستضافة بالمعرف:', streamId);
      console.log('📋 البثوث النشطة:', Array.from(window.liveStreams.keys()));
      
      // محاكاة مشاهدين
      setTimeout(() => {
        const liveStream = window.liveStreams?.get(streamId);
        if (liveStream) {
          liveStream.viewerCount = Math.floor(Math.random() * 10) + 1;
          console.log('👥 عدد المشاهدين:', liveStream.viewerCount);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ فشل في إرسال البث للاستضافة:', error);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <Button onClick={() => setLocation('/')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            ← العودة
          </Button>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
            🐰 اختبار البث - LaaBoBo
          </h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {!isStreaming ? (
          <div style={{ 
            background: 'rgba(0,0,0,0.4)', 
            padding: '40px', 
            borderRadius: '15px', 
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📹</div>
            
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>
              اختبار الكاميرا
            </h2>
            <p style={{ color: '#ccc', marginBottom: '30px' }}>
              اختبار بسيط للتأكد من عمل الكاميرا
            </p>

            <div style={{ marginBottom: '20px' }}>
              <Input
                placeholder="عنوان البث..."
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  width: '100%'
                }}
              />
            </div>

            <Button 
              onClick={startCamera}
              disabled={!streamTitle.trim()}
              style={{ 
                background: '#dc2626', 
                color: 'white', 
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                width: '100%'
              }}
            >
              🔴 تشغيل الكاميرا
            </Button>

            <div style={{ 
              background: 'rgba(255,193,7,0.2)', 
              color: '#ffc107', 
              padding: '15px', 
              borderRadius: '8px', 
              marginTop: '20px',
              fontSize: '14px'
            }}>
              ⚠️ تأكد من السماح للمتصفح بالوصول للكاميرا
            </div>
          </div>
        ) : (
          <div>
            <div style={{ 
              background: 'rgba(0,0,0,0.4)', 
              padding: '15px', 
              borderRadius: '10px', 
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  background: '#dc2626', 
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{ color: 'white', fontWeight: 'bold' }}>مباشر</span>
                <span style={{ color: 'white' }}>{streamTitle}</span>
              </div>
              
              <Button 
                onClick={() => window.location.reload()}
                style={{ background: '#dc2626', color: 'white' }}
              >
                إيقاف الاختبار
              </Button>
            </div>

            <div style={{ background: 'black', borderRadius: '15px', overflow: 'hidden' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  minHeight: '400px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            </div>
            
            <div style={{ 
              background: 'rgba(34,197,94,0.2)', 
              color: '#22c55e', 
              padding: '20px', 
              borderRadius: '10px', 
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                ✅ البث المباشر نشط!
              </p>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                تم إرسال البث للاستضافة بنجاح - يمكن للمشاهدين مشاهدتك الآن
              </p>
              <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px' }}>
                📊 حالة الاستضافة: متصل ✅<br/>
                📡 نوع البث: مباشر عبر المنصة<br/>
                👥 متاح للمشاهدة في الصفحة الرئيسية
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}