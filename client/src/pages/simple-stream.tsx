import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Mic, ArrowLeft, X, Video, VideoOff, MicOff, Users, Heart, MessageCircle, Gift, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function SimpleStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // إنشاء البث
  const createStreamMutation = useMutation({
    mutationFn: (data: { title: string; description: string; category: string }) => 
      apiRequest('/api/streams', 'POST', data),
    onSuccess: async (newStream) => {
      console.log('✅ تم إنشاء البث:', newStream);
      setCurrentStreamId(newStream.id);
      setIsLive(true);
      
      // تشغيل الكاميرا فوراً بعد إنشاء البث
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        // إذا فشلت الكاميرا، احذف البث
        await apiRequest(`/api/streams/${newStream.id}`, 'DELETE', {});
        setIsLive(false);
        setCurrentStreamId(null);
      }
    },
    onError: (error) => {
      console.error('❌ خطأ في إنشاء البث:', error);
      alert('فشل في إنشاء البث. حاول مرة أخرى.');
    }
  });

  // تشغيل الكاميرا بطريقة مبسطة
  const startCamera = async () => {
    try {
      console.log('🎥 محاولة تشغيل الكاميرا...');
      
      // إيقاف الكاميرا السابقة إن وجدت
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      console.log('✅ تم الحصول على MediaStream:', stream);
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = isLive ? false : true; // كتم الصوت فقط في المعاينة
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        
        // تشغيل الفيديو فوراً
        try {
          await videoRef.current.play();
          console.log('▶️ تم تشغيل الفيديو بنجاح');
          setCameraReady(true);
        } catch (playError) {
          console.error('❌ خطأ في تشغيل الفيديو:', playError);
          // محاولة ثانية بعد تحميل البيانات
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current!.play();
              console.log('▶️ تم تشغيل الفيديو في المحاولة الثانية');
              setCameraReady(true);
            } catch (secondError) {
              console.error('❌ فشل في تشغيل الفيديو نهائياً:', secondError);
            }
          };
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في تشغيل الكاميرا:', error);
      alert('لا يمكن الوصول للكاميرا. تأكد من إعطاء الإذن في المتصفح.');
      return false;
    }
  };

  // بدء البث المباشر
  const startLive = async () => {
    if (!streamTitle.trim()) {
      alert('اكتب اسم البث أولاً');
      return;
    }
    
    // إنشاء البث في قاعدة البيانات
    createStreamMutation.mutate({
      title: streamTitle.trim(),
      description: streamTitle.trim(),
      category: 'gaming'
    });
  };

  // إيقاف البث
  const stopStreaming = async () => {
    console.log('🛑 إيقاف البث...');
    
    // حذف البث من قاعدة البيانات
    if (currentStreamId) {
      try {
        await apiRequest(`/api/streams/${currentStreamId}`, 'DELETE', {});
        console.log('✅ تم حذف البث من قاعدة البيانات');
      } catch (error) {
        console.error('❌ خطأ في حذف البث:', error);
      }
    }
    
    // إيقاف الكاميرا والمايك
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ تم إيقاف المسار:', track.kind);
      });
      setMediaStream(null);
    }
    
    // إعادة تعيين الحالة
    setIsLive(false);
    setCurrentStreamId(null);
    setViewerCount(0);
    setCameraReady(false);
    
    // العودة للصفحة الرئيسية
    setLocation('/');
  };

  // تبديل الكاميرا
  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
        console.log('📹 الكاميرا:', videoTrack.enabled ? 'مفعلة' : 'متوقفة');
      }
    }
  };

  // تبديل الميكروفون
  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
        console.log('🎤 المايك:', audioTrack.enabled ? 'مفعل' : 'متوقف');
      }
    }
  };

  // تنظيف الموارد عند إغلاق الصفحة
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // محاكاة عدد المشاهدين
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // واجهة البث المباشر
  if (isLive) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* الفيديو المباشر */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted={false}
          controls={false}
        />
        
        {/* تأكيد أن الفيديو يعمل */}
        {!mediaStream && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
            <div className="text-white text-center">
              <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg">جاري تشغيل البث...</p>
            </div>
          </div>
        )}
        
        {/* طبقة إذا كانت الكاميرا متوقفة */}
        {!cameraEnabled && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
            <div className="text-white text-center">
              <VideoOff className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-xl opacity-70">الكاميرا متوقفة</p>
            </div>
          </div>
        )}

        {/* شريط علوي */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-30">
          <div className="flex items-center justify-between">
            {/* زر الإغلاق */}
            <Button 
              onClick={stopStreaming}
              variant="ghost" 
              className="text-white hover:bg-red-500/20 rounded-full w-12 h-12 p-0"
            >
              <X className="w-6 h-6" />
            </Button>
            
            {/* معلومات البث */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                🔴 مباشر
              </div>
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1 space-x-reverse">
                <Users className="w-4 h-4" />
                <span>{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* معلومات البث أسفل */}
        <div className="absolute bottom-32 left-4 right-4 z-30">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-white font-bold text-lg mb-1">{streamTitle}</h3>
            <p className="text-white/70 text-sm">بث مباشر • {viewerCount} مشاهد</p>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6 space-x-reverse z-30">
          <Button 
            onClick={toggleCamera}
            className={`w-16 h-16 rounded-full ${cameraEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'} text-white border-2 border-white/30`}
          >
            {cameraEnabled ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
          </Button>
          
          <Button 
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full ${micEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'} text-white border-2 border-white/30`}
          >
            {micEnabled ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </Button>
        </div>
      </div>
    );
  }

  // واجهة بدء البث
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* الهيدر */}
      <div className="flex items-center justify-between p-4">
        <Button 
          onClick={() => setLocation('/')}
          variant="ghost" 
          className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">بث مباشر جديد</h1>
        <div className="w-12"></div>
      </div>

      {/* تحذير قبل البث */}
      <div className="mx-4 mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
        <div className="flex items-center space-x-2 space-x-reverse mb-2">
          <span className="text-red-400 text-xl">⚠️</span>
          <h3 className="text-red-300 font-bold">تنبيه مهم</h3>
        </div>
        <p className="text-red-200 text-sm">
          يُمنع بث أي محتوى غير أخلاقي أو مخالف للقوانين. المستخدم مسؤول قانونياً عن المحتوى المبثوث.
        </p>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
          <Camera className="w-16 h-16 text-white" />
        </div>
        
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">ابدأ بثك المباشر</h2>
          <p className="text-white/70 max-w-md">
            أدخل اسم البث وابدأ في التواصل مع متابعيك مباشرة
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <Input
            placeholder="اسم البث (مثال: ألعاب ومرح)"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center py-6 text-lg rounded-2xl"
            maxLength={50}
          />
          
          <Button 
            onClick={startLive}
            disabled={!streamTitle.trim() || createStreamMutation.isPending}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-6 rounded-2xl font-bold text-xl disabled:opacity-50 shadow-xl"
          >
            {createStreamMutation.isPending ? 'جاري البدء...' : '🔴 ابدأ البث المباشر'}
          </Button>
        </div>

        {/* معاينة الكاميرا للاختبار */}
        <div className="mt-8">
          <Button 
            onClick={startCamera}
            className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            اختبار الكاميرا
          </Button>
          
          {mediaStream && (
            <div>
              <h3 className="text-white text-center mb-4">معاينة الكاميرا</h3>
              <video 
                ref={videoRef}
                className="w-64 h-48 rounded-lg border-2 border-white/20"
                autoPlay
                playsInline
                muted
              />
              <p className="text-green-400 text-center mt-2">✅ الكاميرا تعمل بنجاح</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}