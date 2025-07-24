import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Users, Heart, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CameraTestButton from '@/components/CameraTestButton';

export default function SimpleCameraStream() {
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

  // بدء البث المباشر مع الكاميرا
  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }

    // التحقق من دعم المتصفح
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "متصفح غير مدعوم",
        description: "يرجى استخدام متصفح حديث مثل Chrome أو Safari",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎥 طلب أذونات الكاميرا...');
      
      // إنشاء البث في قاعدة البيانات أولاً
      console.log('💾 إنشاء البث في قاعدة البيانات...');
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: streamTitle,
          category: 'general',
          isActive: true
        })
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء البث');
      }

      const streamData = await response.json();
      console.log('✅ تم إنشاء البث:', streamData);
      
      // حفظ معرف البث لحذفه لاحقاً
      streamRef.current = { streamId: streamData.id } as any;
      
      // طلب بسيط أولاً
      let stream;
      try {
        console.log('📱 محاولة أساسية للكاميرا...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (basicError) {
        console.log('📱 محاولة متقدمة للكاميرا...');
        // محاولة مع إعدادات محددة للهاتف
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            facingMode: { ideal: 'user' },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      console.log('✅ تم الحصول على stream:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('📺 ربط الفيديو...');
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // محاولة تشغيل الفيديو
        try {
          await videoRef.current.play();
          console.log('✅ بدأ تشغيل الفيديو');
        } catch (playError) {
          console.warn('⚠️ خطأ تشغيل، إعادة محاولة...', playError);
          // إعادة محاولة بعد وقت قصير
          setTimeout(async () => {
            try {
              if (videoRef.current) {
                await videoRef.current.play();
              }
            } catch (retryError) {
              console.error('❌ فشل نهائي في التشغيل:', retryError);
            }
          }, 100);
        }
      }

      setIsStreaming(true);
      
      // محاكاة المشاهدين
      const interval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 3));
        setLikes(prev => prev + Math.floor(Math.random() * 2));
      }, 3000);

      toast({
        title: "🔴 بث مباشر",
        description: "بدأ البث المباشر بنجاح!",
      });

      // تنظيف عند إغلاق المكون
      return () => clearInterval(interval);

    } catch (error: any) {
      console.error('❌ خطأ في الكاميرا:', error);
      
      let errorMessage = "لا يمكن الوصول إلى الكاميرا";
      let errorTitle = "خطأ في الكاميرا";
      
      if (error.name === 'NotAllowedError') {
        errorTitle = "تم رفض الإذن";
        errorMessage = "يرجى النقر على 'السماح' عندما يطلب المتصفح أذونات الكاميرا والميكروفون";
      } else if (error.name === 'NotFoundError') {
        errorTitle = "كاميرا غير موجودة";
        errorMessage = "لم يتم العثور على كاميرا. تأكد من وجود كاميرا في الجهاز";
      } else if (error.name === 'NotReadableError') {
        errorTitle = "كاميرا مشغولة";
        errorMessage = "الكاميرا مستخدمة من تطبيق آخر. أغلق التطبيقات الأخرى وحاول مرة أخرى";
      } else if (error.name === 'OverconstrainedError') {
        errorTitle = "إعدادات غير مدعومة";
        errorMessage = "إعدادات الكاميرا المطلوبة غير متاحة على هذا الجهاز";
      } else if (error.name === 'SecurityError') {
        errorTitle = "خطأ أمني";
        errorMessage = "يجب استخدام HTTPS للوصول إلى الكاميرا";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // إيقاف البث
  const stopStream = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // حذف البث من قاعدة البيانات
    try {
      console.log('🗑️ حذف البث من قاعدة البيانات...');
      const streamId = (streamRef.current as any)?.streamId;
      if (streamId) {
        const response = await fetch(`/api/streams/${streamId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('✅ تم حذف البث من قاعدة البيانات');
        }
      }
    } catch (error) {
      console.error('❌ خطأ في حذف البث:', error);
    }
    
    setIsStreaming(false);
    setLocation('/');
  };

  // تبديل الكاميرا
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
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

  // إذا لم يبدأ البث بعد
  if (!isStreaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              🔴 بث مباشر
            </CardTitle>
            <p className="text-gray-300">
              بث مباشر مع الكاميرا
            </p>
            <div className="text-yellow-300 text-xs text-center mt-2 bg-yellow-900/20 rounded p-2">
              📱 سيطلب المتصفح أذونات الكاميرا - انقر "السماح"
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CameraTestButton />
            
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
                    startStream();
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
                  console.log('🎯 زر البث تم النقر عليه');
                  startStream();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
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
    <div className="min-h-screen bg-black relative">
      {/* الفيديو */}
      <video
        ref={videoRef}
        className="w-full h-screen object-cover"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {/* شريط علوي */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold">مباشر</span>
              <span className="text-white">{streamTitle}</span>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-white text-sm">
              <Users className="w-4 h-4" />
              <span>{viewerCount}</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>{likes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="absolute bottom-20 left-4 right-4 z-50">
        <div className="flex justify-center space-x-4 rtl:space-x-reverse">
          <Button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full ${isVideoEnabled ? 'bg-white/20' : 'bg-red-600'}`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
          </Button>
          
          <Button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full ${isAudioEnabled ? 'bg-white/20' : 'bg-red-600'}`}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
          </Button>
          
          <Button
            onClick={stopStream}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
        </div>
      </div>

      {/* رسائل التفاعل */}
      <div className="absolute bottom-40 right-4 z-50">
        <div className="flex flex-col space-y-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">{viewerCount}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <Heart className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <span className="text-xs">{likes}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-white text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}