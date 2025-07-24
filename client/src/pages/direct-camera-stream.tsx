import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Users, Heart, MessageCircle, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function DirectCameraStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // بدء البث المباشر مع الكاميرا
  const startDirectStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }

    // فحص دعم المتصفح
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "المتصفح لا يدعم الكاميرا. استخدم Chrome أو Safari";
      setCameraError(errorMsg);
      toast({
        title: "متصفح غير مدعوم",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 فحص المتصفح:', navigator.userAgent);
    console.log('📱 نوع الجهاز:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop');

    try {
      console.log('🎥 طلب أذونات الكاميرا...');
      setCameraError(null);
      
      // محاولة بسيطة أولاً
      let stream;
      try {
        console.log('📹 محاولة بسيطة للكاميرا...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (basicError) {
        console.log('⚠️ المحاولة البسيطة فشلت، جاري المحاولة بإعدادات متقدمة...');
        // محاولة مع إعدادات محددة
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            facingMode: { ideal: 'user' },
            frameRate: { ideal: 15, max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
      }

      console.log('✅ تم الحصول على stream بنجاح');
      console.log('📊 معلومات Stream:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        active: stream.active
      });

      streamRef.current = stream;
      
      // ربط الكاميرا مع عنصر الفيديو
      if (videoRef.current) {
        console.log('📺 ربط الفيديو بالعنصر...');
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // إضافة event listeners للتشخيص
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ تم تحميل metadata للفيديو');
          console.log('📐 أبعاد الفيديو:', {
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight
          });
        };
        
        videoRef.current.oncanplay = () => {
          console.log('✅ الفيديو جاهز للتشغيل');
        };
        
        videoRef.current.onplaying = () => {
          console.log('✅ الفيديو يعمل الآن');
        };
        
        videoRef.current.onerror = (error) => {
          console.error('❌ خطأ في عنصر الفيديو:', error);
        };
        
        // محاولة تشغيل الفيديو
        try {
          await videoRef.current.play();
          console.log('✅ بدأ تشغيل الفيديو بنجاح');
        } catch (playError) {
          console.warn('⚠️ فشل التشغيل التلقائي:', playError);
          
          // إعادة محاولة بعد تأخير
          setTimeout(async () => {
            try {
              if (videoRef.current) {
                await videoRef.current.play();
                console.log('✅ نجح التشغيل في المحاولة الثانية');
              }
            } catch (retryError) {
              console.error('❌ فشل نهائي في التشغيل:', retryError);
              setCameraError("فشل في تشغيل الفيديو. انقر على الشاشة لبدء التشغيل يدوياً");
            }
          }, 1000);
        }
      }

      setIsStreaming(true);
      
      // محاكاة المشاهدين والتفاعل
      const interval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 2));
        setLikes(prev => prev + Math.floor(Math.random() * 3));
      }, 4000);

      toast({
        title: "🔴 بث مباشر",
        description: "بدأ البث المباشر بنجاح!",
      });

      // تنظيف عند إغلاق
      return () => {
        clearInterval(interval);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

    } catch (error: any) {
      console.error('❌ خطأ في الكاميرا:', error);
      console.error('📋 تفاصيل الخطأ:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = "لا يمكن الوصول إلى الكاميرا";
      let errorTitle = "خطأ في الكاميرا";
      
      if (error.name === 'NotAllowedError') {
        errorTitle = "تم رفض الإذن";
        errorMessage = "يرجى النقر على 'السماح/Allow' عندما يظهر طلب أذونات الكاميرا. إذا لم تظهر النافذة، انقر على أيقونة الكاميرا 📹 في شريط العنوان";
      } else if (error.name === 'NotFoundError') {
        errorTitle = "كاميرا غير موجودة";
        errorMessage = "لم يتم العثور على كاميرا في هذا الجهاز. تأكد من وجود كاميرا وأنها موصولة بشكل صحيح";
      } else if (error.name === 'NotReadableError') {
        errorTitle = "كاميرا مشغولة";
        errorMessage = "الكاميرا مستخدمة من تطبيق آخر. أغلق جميع التطبيقات التي تستخدم الكاميرا (مثل Zoom, Skype, WhatsApp Web)";
      } else if (error.name === 'OverconstrainedError') {
        errorTitle = "إعدادات غير مدعومة";
        errorMessage = "إعدادات الكاميرا المطلوبة غير متاحة على هذا الجهاز. جرب من جهاز آخر";
      } else if (error.name === 'SecurityError') {
        errorTitle = "خطأ أمني";
        errorMessage = "يجب استخدام HTTPS للوصول إلى الكاميرا. تأكد أن الرابط يبدأ بـ https://";
      } else if (error.name === 'TypeError') {
        errorTitle = "متصفح غير مدعوم";
        errorMessage = "هذا المتصفح لا يدعم الكاميرا. استخدم Chrome أو Safari أو Firefox الحديث";
      }
      
      setCameraError(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // إيقاف البث
  const stopStream = () => {
    console.log('🛑 Stopping stream...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('🔌 Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setViewerCount(0);
    setLikes(0);
    setLocation('/');
  };

  // تبديل الكاميرا
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        console.log('📹 Video toggled:', !isVideoEnabled);
      }
    }
  };

  // تبديل الصوت
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        console.log('🎤 Audio toggled:', !isAudioEnabled);
      }
    }
  };

  // تنظيف عند إغلاق المكون
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // إذا لم يبدأ البث بعد - صفحة إدخال العنوان
  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-xl border-white/30 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-3xl font-bold mb-2">
              📱 بث مباشر
            </CardTitle>
            <p className="text-gray-200 text-lg">
              كاميرا مباشرة - بث فوري
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-white text-sm font-medium block mb-3">
                عنوان البث المباشر
              </label>
              <Input
                type="text"
                placeholder="اكتب عنوان البث هنا..."
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && streamTitle.trim()) {
                    startDirectStream();
                  }
                }}
              />
            </div>
            
            {cameraError && (
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200 text-sm font-medium mb-2">❌ خطأ في الكاميرا</p>
                <p className="text-red-100 text-sm leading-relaxed">{cameraError}</p>
                <div className="mt-3 text-yellow-200 text-xs">
                  💡 نصائح للحل:
                  <br />• أعد تحميل الصفحة
                  <br />• تأكد من أن الرابط يبدأ بـ https://
                  <br />• أغلق التطبيقات الأخرى التي تستخدم الكاميرا
                  <br />• جرب متصفح آخر (Chrome مُفضل)
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation('/')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                رجوع
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🎯 زر البث تم النقر عليه، العنوان:', streamTitle);
                  startDirectStream();
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-lg"
                disabled={!streamTitle.trim()}
                type="button"
              >
                🔴 ابدأ البث
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // واجهة البث المباشر
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* الفيديو المباشر */}
      <video
        ref={videoRef}
        className="w-full h-screen object-cover"
        autoPlay
        playsInline
        muted
        style={{ 
          transform: 'scaleX(-1)', // مرآة للكاميرا الأمامية
          backgroundColor: '#000'
        }}
      />
      
      {/* طبقة تحكم شفافة */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30">
        
        {/* شريط علوي */}
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-lg">مباشر</span>
                <span className="text-white text-sm">{streamTitle}</span>
              </div>
              
              <Button
                onClick={stopStream}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* إحصائيات جانبية */}
        <div className="absolute bottom-32 right-4 z-50">
          <div className="flex flex-col space-y-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 text-white text-center">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-bold">{viewerCount}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 text-white text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <span className="text-sm font-bold">{likes}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 text-white text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" />
              <span className="text-xs">دردشة</span>
            </div>
          </div>
        </div>

        {/* أزرار التحكم السفلية */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex space-x-6 rtl:space-x-reverse">
            <Button
              onClick={toggleVideo}
              className={`w-16 h-16 rounded-full ${isVideoEnabled ? 'bg-white/20' : 'bg-red-600'} text-white`}
            >
              {isVideoEnabled ? <Video className="w-8 h-8" /> : <VideoOff className="w-8 h-8" />}
            </Button>
            
            <Button
              onClick={toggleAudio}
              className={`w-16 h-16 rounded-full ${isAudioEnabled ? 'bg-white/20' : 'bg-red-600'} text-white`}
            >
              {isAudioEnabled ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}