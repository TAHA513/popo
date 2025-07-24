import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function SimpleCameraTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // اختبار الكاميرا
  const testCamera = async () => {
    try {
      console.log('🎥 اختبار الكاميرا...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ تم الحصول على الكاميرا');
      console.log('📋 معلومات البث:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoSettings: stream.getVideoTracks()[0]?.getSettings()
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // محاولة تشغيل الفيديو
        try {
          await videoRef.current.play();
          console.log('✅ بدأ تشغيل الفيديو');
          
          toast({
            title: "نجح الاختبار!",
            description: "الكاميرا تعمل بشكل صحيح"
          });
          
        } catch (playError) {
          console.error('❌ فشل تشغيل الفيديو:', playError);
          
          // محاولة مع صوت مكتوم
          videoRef.current.muted = true;
          await videoRef.current.play();
          
          toast({
            title: "تحذير",
            description: "الفيديو يعمل لكن مع كتم الصوت",
            variant: "destructive"
          });
        }
      }

    } catch (error: any) {
      console.error('❌ خطأ في الكاميرا:', error);
      
      let message = "فشل في الوصول للكاميرا";
      if (error.name === 'NotAllowedError') {
        message = "تم رفض أذونات الكاميرا - يرجى السماح بالوصول";
      } else if (error.name === 'NotFoundError') {
        message = "لم يتم العثور على كاميرا";
      } else if (error.name === 'NotReadableError') {
        message = "الكاميرا مستخدمة من تطبيق آخر";
      }
      
      toast({
        title: "خطأ في الكاميرا",
        description: message,
        variant: "destructive"
      });
    }
  };

  // بدء البث
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
    await testCamera();
    setIsStreaming(true);
    setIsLoading(false);
  };

  // إيقاف البث
  const stopStream = () => {
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

    setIsStreaming(false);
    
    toast({
      title: "تم إيقاف البث",
      description: "تم إنهاء البث المباشر"
    });
  };

  // تنظيف عند المغادرة
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
            🐰 اختبار الكاميرا - LaaBoBo
          </h1>
          
          <div className="w-20" />
        </div>

        {!isStreaming ? (
          /* واجهة بدء البث */
          <Card className="max-w-md mx-auto bg-black/40 backdrop-blur border-white/20 p-8">
            <div className="text-center space-y-6">
              <div className="text-6xl">📹</div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">اختبار بث مباشر</h2>
                <p className="text-gray-300">اختبار الكاميرا والميكروفون</p>
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
                      جاري اختبار الكاميرا...
                    </div>
                  ) : (
                    '🔴 اختبر الكاميرا'
                  )}
                </Button>

                <Button
                  onClick={testCamera}
                  variant="outline"
                  className="w-full text-white border-white/20 hover:bg-white/10"
                >
                  🎥 اختبار سريع للكاميرا
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
                  <span className="text-white font-bold">اختبار مباشر</span>
                </div>
                <span className="text-white">{streamTitle}</span>
              </div>
              
              <Button
                onClick={stopStream}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                إيقاف الاختبار
              </Button>
            </div>

            {/* شاشة الفيديو */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="w-full h-auto min-h-[500px] object-cover transform scale-x-[-1]"
                style={{ 
                  minHeight: '500px',
                  backgroundColor: '#1a1a1a'
                }}
              />
              
              {/* حالة الفيديو */}
              <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded text-sm font-bold">
                📹 اختبار الكاميرا
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
            
            {/* معلومات الاختبار */}
            <div className="mt-4 text-center">
              <div className="bg-blue-900/20 rounded-lg p-4">
                <p className="text-blue-300 font-bold mb-2">
                  🧪 اختبار الكاميرا والميكروفون
                </p>
                <p className="text-gray-300 text-sm">
                  إذا كنت ترى نفسك في الفيديو أعلاه، فالكاميرا تعمل بشكل صحيح
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}