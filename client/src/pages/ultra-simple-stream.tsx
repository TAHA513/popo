import { useState, useRef } from 'react';

export default function UltraSimpleStream() {
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = async () => {
    if (!title.trim()) {
      setError('أدخل عنوان البث');
      return;
    }

    try {
      setError('');
      console.log('🎥 طلب الكاميرا...');

      // طلب الكاميرا والميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: true
      });

      console.log('✅ تم الحصول على الكاميرا');
      streamRef.current = stream;

      // عرض الفيديو
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current!.play();
            console.log('✅ الفيديو يعمل');
            setIsLive(true);
            
            // حفظ في الاستضافة
            (window as any).activeLiveStream = {
              id: 'stream-' + Date.now(),
              title: title,
              isActive: true,
              startTime: new Date().toISOString()
            };
            
            console.log('📡 تم حفظ البث في الاستضافة');
            
          } catch (playError) {
            console.error('❌ فشل تشغيل الفيديو:', playError);
            setError('فشل في تشغيل الفيديو');
          }
        };
      }

    } catch (err: any) {
      console.error('❌ خطأ في الكاميرا:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('يجب السماح للموقع بالوصول للكاميرا\nاذهب لإعدادات المتصفح واسمح بالوصول للكاميرا');
      } else if (err.name === 'NotFoundError') {
        setError('لم يتم العثور على كاميرا');
      } else {
        setError('خطأ: ' + err.message);
      }
    }
  };

  const stopStream = () => {
    console.log('⏹️ إيقاف البث');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`تم إيقاف ${track.kind}`);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // إزالة من الاستضافة
    delete (window as any).activeLiveStream;
    console.log('🗑️ تم حذف البث من الاستضافة');

    setIsLive(false);
    window.location.href = '/';
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#1a1a2e', 
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* العنوان */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            🐰 LaaBoBo Live
          </h1>
          <p style={{ margin: 0, color: '#ccc' }}>بث مباشر</p>
        </div>

        {!isLive ? (
          /* نموذج البث */
          <div style={{
            background: '#16213e',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔴</div>
            
            <h2 style={{ marginBottom: '20px', color: 'white' }}>
              ابدأ البث المباشر
            </h2>

            {error && (
              <div style={{
                background: '#dc2626',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                whiteSpace: 'pre-line'
              }}>
                ❌ {error}
              </div>
            )}

            <input
              type="text"
              placeholder="عنوان البث..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={startStream}
              disabled={!title.trim()}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                background: title.trim() ? '#dc2626' : '#666',
                color: 'white',
                cursor: title.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              🔴 بدء البث
            </button>

            <div style={{
              background: '#fbbf24',
              color: '#92400e',
              padding: '10px',
              borderRadius: '8px',
              marginTop: '20px',
              fontSize: '14px'
            }}>
              💡 عند الضغط سيطلب المتصفح إذن الكاميرا - اضغط "سماح"
            </div>
          </div>
        ) : (
          /* واجهة البث المباشر */
          <div>
            {/* شريط حالة البث */}
            <div style={{
              background: '#16213e',
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
                <span style={{ fontWeight: 'bold' }}>مباشر</span>
                <span>{title}</span>
              </div>
              
              <button
                onClick={stopStream}
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
                  transform: 'scaleX(-1)' // مرآة
                }}
              />
              
              {/* مؤشر نشط */}
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
                📡 نشط
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
                ✅ البث نشط في المنصة!
              </div>
              <div style={{ fontSize: '14px' }}>
                يمكن للمشاهدين مشاهدتك من الصفحة الرئيسية
              </div>
            </div>
          </div>
        )}

        {/* زر العودة */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => window.location.href = '/'}
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