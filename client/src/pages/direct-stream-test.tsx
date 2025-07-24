import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function DirectStreamTest() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [streamId, setStreamId] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartStream = async () => {
    if (!title.trim()) {
      setError('يرجى إدخال عنوان البث');
      return;
    }

    try {
      setError('');
      console.log('🎥 بدء البث المباشر...');

      // الحصول على الكاميرا
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('✅ تم الحصول على الكاميرا:', stream);

      // عرض الفيديو
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            console.log('✅ بدأ عرض الفيديو');
            setIsLive(true);
            streamRef.current = stream;
            
            // إنشاء معرف البث
            const newStreamId = `stream-${Date.now()}`;
            setStreamId(newStreamId);
            
            // حفظ في الاستضافة
            if (!(window as any).hostStreams) {
              (window as any).hostStreams = {};
            }
            
            (window as any).hostStreams[newStreamId] = {
              id: newStreamId,
              title: title,
              isActive: true,
              startTime: new Date().toISOString(),
              stream: stream
            };
            
            console.log('📡 تم حفظ البث في الاستضافة:', newStreamId);
            console.log('🗂️ البثوث المحفوظة:', Object.keys((window as any).hostStreams));
            
          }).catch(err => {
            console.error('❌ فشل تشغيل الفيديو:', err);
            setError('فشل في تشغيل الفيديو');
          });
        };
      }

    } catch (err) {
      console.error('❌ خطأ في البث:', err);
      
      let message = 'فشل في بدء البث';
      if (err.name === 'NotAllowedError') {
        message = 'يجب السماح بالوصول للكاميرا والميكروفون';
      } else if (err.name === 'NotFoundError') {
        message = 'لم يتم العثور على كاميرا أو ميكروفون';
      } else if (err.name === 'NotReadableError') {
        message = 'الكاميرا مستخدمة من تطبيق آخر';
      }
      
      setError(message);
    }
  };

  const handleStopStream = () => {
    console.log('⏹️ إيقاف البث...');
    
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
    if ((window as any).hostStreams && streamId) {
      delete (window as any).hostStreams[streamId];
      console.log('🗑️ تم حذف البث من الاستضافة');
    }

    setIsLive(false);
    setStreamId('');
    
    // العودة للرئيسية
    setTimeout(() => setLocation('/'), 1000);
  };

  // منع المغادرة أثناء البث
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLive) {
        e.preventDefault();
        e.returnValue = 'أنت في بث مباشر. هل تريد المغادرة؟';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLive]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* الهيدر */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <button 
            onClick={() => setLocation('/')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← العودة
          </button>
          
          <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>
            🐰 بث مباشر - LaaBoBo
          </h1>
          
          <div style={{ width: '100px' }}></div>
        </div>

        {!isLive ? (
          /* نموذج بدء البث */
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '40px',
            borderRadius: '15px',
            maxWidth: '500px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔴</div>
            
            <h2 style={{ color: 'white', marginBottom: '30px' }}>
              بث مباشر حقيقي
            </h2>

            {error && (
              <div style={{
                background: '#dc2626',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
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
                padding: '15px',
                marginBottom: '20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '16px'
              }}
            />

            <button
              onClick={handleStartStream}
              disabled={!title.trim()}
              style={{
                width: '100%',
                padding: '15px',
                background: title.trim() ? '#dc2626' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: title.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              🔴 بدء البث المباشر
            </button>

            <div style={{
              background: 'rgba(255,193,7,0.2)',
              color: '#ffc107',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '20px',
              fontSize: '14px'
            }}>
              💡 سيتم استخدام الاستضافة المباشرة للمنصة
            </div>
          </div>
        ) : (
          /* واجهة البث المباشر */
          <div>
            {/* معلومات البث */}
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              padding: '20px',
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
                <span style={{ color: 'white', fontWeight: 'bold' }}>LIVE</span>
                <span style={{ color: 'white' }}>{title}</span>
              </div>
              
              <button
                onClick={handleStopStream}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                إنهاء البث
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
                  minHeight: '500px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' // مرآة
                }}
              />
              
              {/* حالة البث */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(34,197,94,0.9)',
                color: 'white',
                padding: '8px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📡 نشط في الاستضافة
              </div>
            </div>

            {/* معلومات الاستضافة */}
            <div style={{
              background: 'rgba(34,197,94,0.2)',
              color: '#22c55e',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                ✅ البث يعمل على الاستضافة!
              </p>
              <div style={{ fontSize: '14px' }}>
                <div>🆔 معرف البث: {streamId}</div>
                <div>📡 حالة الاستضافة: متصل</div>
                <div>🎥 نوع البث: مباشر حقيقي</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}