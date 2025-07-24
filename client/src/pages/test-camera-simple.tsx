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
      console.log('🎥 بدء الكاميرا...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        console.log('✅ الكاميرا تعمل!');
      }
    } catch (error) {
      console.error('❌ خطأ في الكاميرا:', error);
      alert('فشل في تشغيل الكاميرا: ' + error.message);
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
                ✅ الكاميرا تعمل بشكل صحيح!
              </p>
              <p style={{ fontSize: '14px' }}>
                إذا كنت ترى نفسك في الفيديو أعلاه، فالكاميرا جاهزة للبث المباشر
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}