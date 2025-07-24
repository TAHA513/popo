import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Users, Heart, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function SimpleLiveStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  
  // إحصائيات البث
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  // بدء البث المباشر
  const startLiveStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }

    // التحقق من دعم المتصفح أولاً
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "متصفح غير مدعوم",
        description: "يرجى استخدام متصفح حديث مثل Chrome أو Firefox",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎥 طلب أذونات الكاميرا والميكروفون...');
      setIsRequestingPermissions(true);
      
      toast({
        title: "طلب أذونات",
        description: "يرجى النقر على 'السماح' في نافذة المتصفح",
      });
      
      // طلب الأذونات بشكل صريح
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      console.log('🔍 جاري طلب الأذونات من المتصفح...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setIsRequestingPermissions(false);

      console.log('✅ تم الحصول على أذونات الكاميرا والميكروفون');
      setHasPermissions(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
          console.log('✅ بدأ عرض الفيديو');
        } catch (playError) {
          console.warn('⚠️ خطأ في تشغيل الفيديو، إعادة المحاولة...', playError);
          setTimeout(async () => {
            try {
              await videoRef.current?.play();
            } catch (retryError) {
              console.error('❌ فشل في تشغيل الفيديو:', retryError);
            }
          }, 100);
        }
      }

      setIsStreaming(true);
      
      toast({
        title: "🔴 بث مباشر",
        description: "بدأ البث المباشر بنجاح!",
      });

      // محاكاة زيادة المشاهدين والتفاعل
      const statsInterval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 3) + 1);
        setLikes(prev => prev + Math.floor(Math.random() * 2));
        setComments(prev => prev + Math.floor(Math.random() * 1));
      }, 3000);

      // تنظيف عند إغلاق المكون
      return () => clearInterval(statsInterval);

    } catch (error) {
      console.error('❌ خطأ في بدء البث:', error);
      setIsRequestingPermissions(false);
      
      let errorMessage = "لا يمكن الوصول إلى الكاميرا";
      let errorTitle = "خطأ في البث";
      
      if ((error as any).name === 'NotAllowedError') {
        errorTitle = "تم رفض الإذن";
        errorMessage = "لم تظهر نافذة الأذونات أو تم رفضها. يرجى تفعيل الكاميرا من إعدادات المتصفح أو تحديث الصفحة والمحاولة مرة أخرى";
      } else if ((error as any).name === 'NotFoundError') {
        errorTitle = "كاميرا غير موجودة";
        errorMessage = "لم يتم العثور على كاميرا. تأكد من وجود كاميرا متصلة بالجهاز";
      } else if ((error as any).name === 'NotReadableError') {
        errorTitle = "كاميرا مشغولة";
        errorMessage = "الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيقات الأخرى وحاول مرة أخرى";
      } else if ((error as any).name === 'OverconstrainedError') {
        errorTitle = "إعدادات غير مدعومة";
        errorMessage = "إعدادات الكاميرا المطلوبة غير متاحة. جرب كاميرا أخرى";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // إنهاء البث
  const endStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 تم إيقاف ${track.kind}`);
      });
    }
    
    setIsStreaming(false);
    setHasPermissions(false);
    setLocation('/');
  };

  // تبديل الفيديو
  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  // تبديل الصوت
  const toggleAudio = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  // تنظيف عند إغلاق المكون
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // إذا لم يبدأ البث بعد - عرض نموذج إدخال العنوان
  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              🔴 بث مباشر
            </CardTitle>
            <p className="text-gray-300">
              ابدأ البث المباشر الآن
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">
                عنوان البث
              </label>
              <Input
                type="text"
                placeholder="أدخل عنوان البث المباشر..."
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && streamTitle.trim()) {
                    startLiveStream();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation('/')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                رجوع
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startLiveStream();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={!streamTitle.trim() || isRequestingPermissions}
                type="button"
              >
                {isRequestingPermissions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    انتظار الأذونات...
                  </>
                ) : (
                  <>🔴 ابدأ البث</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // واجهة البث المباشر
  return (
    <div className="min-h-screen bg-black relative">
      {/* فيديو البث */}
      <video
        ref={videoRef}
        className="w-full h-screen bg-black object-cover"
        muted
        playsInline
        autoPlay
        style={{ transform: 'scaleX(-1)' }} // مرآة الكاميرا
      />
      
      {/* شريط علوي مع معلومات البث */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-bold">مباشر</span>
            <span className="text-white">{streamTitle}</span>
          </div>
          
          <Button
            onClick={endStream}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            إنهاء البث
          </Button>
        </div>
      </div>

      {/* إحصائيات البث */}
      <div className="absolute top-20 right-4 space-y-2">
        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center">
          <Users className="w-4 h-4 mr-2 text-blue-400" />
          <span>{viewerCount}</span>
        </div>
        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center">
          <Heart className="w-4 h-4 mr-2 text-red-400" />
          <span>{likes}</span>
        </div>
        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-green-400" />
          <span>{comments}</span>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Button
          onClick={toggleVideo}
          className={`${isVideoEnabled ? 'bg-green-600/80 hover:bg-green-700/80' : 'bg-red-600/80 hover:bg-red-700/80'} text-white rounded-full p-4 backdrop-blur-sm`}
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>
        <Button
          onClick={toggleAudio}
          className={`${isAudioEnabled ? 'bg-green-600/80 hover:bg-green-700/80' : 'bg-red-600/80 hover:bg-red-700/80'} text-white rounded-full p-4 backdrop-blur-sm`}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
}