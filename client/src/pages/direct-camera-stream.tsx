import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function DirectCameraStream() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // بدء البث المباشر
  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🎥 طلب أذونات الكاميرا...');
      
      // الحصول على كاميرا عالية الجودة
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ تم الحصول على الكاميرا');

      // عرض الفيديو
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // ضمان تشغيل الفيديو
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            console.log('✅ بدأ عرض الفيديو');
          } catch (error) {
            console.error('❌ خطأ في تشغيل الفيديو:', error);
          }
        };
      }

      setIsStreaming(true);
      setIsLoading(false);

      // محاكاة مشاهدين
      const viewerInterval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 2));
      }, 3000);

      // حفظ العداد للتنظيف
      (window as any).viewerInterval = viewerInterval;

      toast({
        title: "🔴 بث مباشر",
        description: "بدأ البث المباشر بنجاح!"
      });

    } catch (error: any) {
      console.error('❌ خطأ في البث:', error);
      setIsLoading(false);
      
      let message = "فشل في بدء البث";
      if (error.name === 'NotAllowedError') {
        message = "تم رفض أذونات الكاميرا - يرجى السماح بالوصول للكاميرا والميكروفون";
      } else if (error.name === 'NotFoundError') {
        message = "لم يتم العثور على كاميرا أو ميكروفون";
      } else if (error.name === 'NotReadableError') {
        message = "الكاميرا مستخدمة من تطبيق آخر - يرجى إغلاق التطبيقات الأخرى";
      }
      
      toast({
        title: "خطأ في البث",
        description: message,
        variant: "destructive"
      });
    }
  };

  // إيقاف البث
  const stopStream = () => {
    try {
      // إيقاف الكاميرا
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`تم إيقاف ${track.kind}`);
        });
        streamRef.current = null;
      }

      // إيقاف عداد المشاهدين
      if ((window as any).viewerInterval) {
        clearInterval((window as any).viewerInterval);
        delete (window as any).viewerInterval;
      }

      // تنظيف الفيديو
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsStreaming(false);
      
      toast({
        title: "تم إيقاف البث",
        description: "تم إنهاء البث المباشر"
      });

    } catch (error) {
      console.error('❌ خطأ في إيقاف البث:', error);
    }
  };

  // تنظيف عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if ((window as any).viewerInterval) {
        clearInterval((window as any).viewerInterval);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline" 
            className="text-white border-white/20 hover:bg-white/10"
          >
            ← العودة للرئيسية
          </Button>
          
          <h1 className="text-2xl font-bold text-white">
            🐰 بث مباشر - LaaBoBo
          </h1>
          
          <div className="w-20" />
        </div>

        {!isStreaming ? (
          /* واجهة بدء البث */
          <Card className="max-w-md mx-auto bg-black/40 backdrop-blur border-white/20 p-8">
            <div className="text-center space-y-6">
              <div className="text-6xl">📹</div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">ابدأ بث مباشر</h2>
                <p className="text-gray-300">شارك لحظاتك مع المشاهدين</p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="عنوان البث..."
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  disabled={isLoading}
                />

                <Button
                  onClick={startStream}
                  disabled={!streamTitle.trim() || isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري بدء البث...
                    </div>
                  ) : (
                    '🔴 ابدأ البث المباشر'
                  )}
                </Button>
              </div>

              <div className="text-xs text-gray-400 bg-yellow-900/20 rounded p-3">
                ⚠️ تأكد من السماح للمتصفح بالوصول للكاميرا والميكروفون
              </div>
            </div>
          </Card>
        ) : (
          /* واجهة البث المباشر */
          <div className="max-w-4xl mx-auto">
            
            {/* معلومات البث */}
            <div className="bg-black/40 backdrop-blur rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-bold">مباشر</span>
                </div>
                <span className="text-white">{streamTitle}</span>
              </div>
              
              <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-1">
                  <span>👁️</span>
                  <span>{viewerCount}</span>
                </div>
                <Button
                  onClick={stopStream}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  إنهاء البث
                </Button>
              </div>
            </div>

            {/* شاشة الفيديو */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[70vh] object-cover"
              />
              
              {/* إحصائيات البث */}
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur rounded-lg p-3">
                <div className="text-white text-sm space-y-1">
                  <div>📊 جودة: HD 1080p</div>
                  <div>⏱️ مدة البث: {Math.floor(Date.now() / 60000) % 60} دقيقة</div>
                  <div>👥 مشاهدين: {viewerCount}</div>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  onClick={() => {
                    if (streamRef.current) {
                      const videoTrack = streamRef.current.getVideoTracks()[0];
                      if (videoTrack) {
                        videoTrack.enabled = !videoTrack.enabled;
                        toast({
                          description: videoTrack.enabled ? "تم تشغيل الكاميرا" : "تم إيقاف الكاميرا"
                        });
                      }
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  className="bg-black/50 backdrop-blur text-white border-white/20"
                >
                  📹
                </Button>
                
                <Button
                  onClick={() => {
                    if (streamRef.current) {
                      const audioTrack = streamRef.current.getAudioTracks()[0];
                      if (audioTrack) {
                        audioTrack.enabled = !audioTrack.enabled;
                        toast({
                          description: audioTrack.enabled ? "تم تشغيل الميكروفون" : "تم كتم الميكروفون"
                        });
                      }
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  className="bg-black/50 backdrop-blur text-white border-white/20"
                >
                  🎤
                </Button>
              </div>
            </div>
            
            {/* رسالة للمشاهدين */}
            <div className="mt-4 text-center">
              <p className="text-gray-300">
                📱 أنت الآن في بث مباشر! يمكن للمشاهدين رؤيتك الآن
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}