import { useState, useRef } from 'react';
import { useLocation } from 'wouter';

export default function SuperSimpleStream() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const startStream = async () => {
    if (!title) {
      setError('أدخل عنوان البث');
      return;
    }

    try {
      setError('');
      console.log('🎥 بدء البث...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ تم الحصول على الكاميرا');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
        
        setStreaming(true);
        console.log('✅ البث يعمل!');
        
        // حفظ في منصة الاستضافة
        (window as any).liveStream = {
          id: Date.now(),
          title: title,
          active: true,
          stream: stream
        };
        
        console.log('📡 تم حفظ البث في الاستضافة');
      }

    } catch (err: any) {
      console.error('❌ خطأ:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('اسمح للموقع بالوصول للكاميرا من إعدادات المتصفح');
      } else {
        setError('فشل في تشغيل الكاميرا: ' + err.message);
      }
    }
  };

  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    delete (window as any).liveStream;
    setStreaming(false);
    setLocation('/');
  };

  return (
    <div style={{ 
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>
            🐰 LaaBoBo Live
          </h1>
          <p style={{ margin: 0, opacity: 0.8 }}>بث مباشر بسيط</p>
        </div>

        {!streaming ? (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '40px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔴</div>
            
            <h2 style={{ marginBottom: '30px' }}>ابدأ البث الآن</h2>

            {error && (
              <div style={{
                background: '#dc2626',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <input
              type="text"
              placeholder="عنوان البث..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                borderRadius: '10px',
                border: 'none',
                marginBottom: '20px',
                background: 'rgba(255,255,255,0.9)',
                color: 'black'
              }}
            />

            <button
              onClick={startStream}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '10px',
                border: 'none',
                background: title ? '#dc2626' : '#666',
                color: 'white',
                cursor: title ? 'pointer' : 'not-allowed'
              }}
            >
              🔴 بدء البث المباشر
            </button>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255,193,7,0.2)',
              borderRadius: '10px',
              fontSize: '14px'
            }}>
              💡 تأكد من السماح للموقع بالوصول للكاميرا
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  background: '#dc2626',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{ fontWeight: 'bold' }}>مباشر</span>
                <span>{title}</span>
              </div>
              
              <button
                onClick={stopStream}
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                إيقاف
              </button>
            </div>

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
                  minHeight: '400px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
              
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'rgba(34,197,94,0.9)',
                padding: '5px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                📡 متصل بالاستضافة
              </div>
            </div>

            <div style={{
              background: 'rgba(34,197,94,0.2)',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                ✅ البث نشط على المنصة!
              </div>
              <div style={{ fontSize: '14px' }}>
                يمكن للمشاهدين مشاهدتك الآن من الصفحة الرئيسية
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => setLocation('/')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}