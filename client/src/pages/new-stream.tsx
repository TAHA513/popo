import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Mic, ArrowLeft, X, Video, VideoOff, MicOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function NewStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState('title'); // 'title', 'preview', 'live'
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // إنشاء البث
  const createStreamMutation = useMutation({
    mutationFn: (data: { title: string; description: string; category: string }) => 
      apiRequest('/api/streams', 'POST', data),
    onSuccess: (newStream) => {
      console.log('✅ تم إنشاء البث:', newStream);
      setCurrentStreamId(newStream.id);
      setIsLive(true);
    },
    onError: (error) => {
      console.error('❌ خطأ في إنشاء البث:', error);
      alert('فشل في إنشاء البث. حاول مرة أخرى.');
    }
  });

  // تشغيل الكاميرا
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في تشغيل الكاميرا:', error);
      alert('لا يمكن الوصول للكاميرا. تأكد من السماح للموقع بالوصول للكاميرا والميكروفون.');
      return false;
    }
  };

  // إيقاف البث
  const stopStreaming = async () => {
    if (currentStreamId) {
      try {
        await apiRequest(`/api/streams/${currentStreamId}`, 'DELETE', {});
        console.log('✅ تم حذف البث');
      } catch (error) {
        console.error('❌ خطأ في حذف البث:', error);
      }
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    setIsLive(false);
    setCurrentStreamId(null);
    setLocation('/');
  };

  // تبديل الكاميرا
  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
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
      }
    }
  };

  // بدء المعاينة
  const startPreview = async () => {
    if (!streamTitle.trim()) {
      alert('اكتب اسم البث أولاً');
      return;
    }
    
    const success = await startCamera();
    if (success) {
      setStep('preview');
    }
  };

  // بدء البث المباشر
  const goLive = () => {
    createStreamMutation.mutate({
      title: streamTitle.trim(),
      description: streamTitle.trim(),
      category: 'gaming'
    });
  };

  // واجهة البث المباشر
  if (isLive) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* الفيديو الرئيسي */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted={false}
        />
        
        {/* عرض "بلا كاميرا" إذا كانت متوقفة */}
        {!cameraEnabled && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg opacity-70">الكاميرا متوقفة</p>
            </div>
          </div>
        )}

        {/* شريط علوي */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
          <div className="flex items-center justify-between">
            <Button 
              onClick={stopStreaming}
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                🔴 مباشر
              </div>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 space-x-reverse z-10">
          <Button 
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full ${cameraEnabled ? 'bg-white/20' : 'bg-red-500'} text-white`}
          >
            {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          
          <Button 
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full ${micEnabled ? 'bg-white/20' : 'bg-red-500'} text-white`}
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
        </div>

        {/* معلومات البث */}
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <h3 className="text-white font-bold text-lg mb-1">{streamTitle}</h3>
            <p className="text-white/70 text-sm">المشاهدين: 0 • أنت مباشر الآن</p>
          </div>
        </div>
      </div>
    );
  }

  // واجهة المعاينة
  if (step === 'preview') {
    return (
      <div className="relative min-h-screen bg-black">
        {/* معاينة الفيديو */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* طبقة تحكم */}
        <div className="absolute inset-0 bg-black/30">
          {/* الهيدر */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <Button 
              onClick={() => {
                if (mediaStream) {
                  mediaStream.getTracks().forEach(track => track.stop());
                  setMediaStream(null);
                }
                setStep('title');
              }}
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            
            <h1 className="text-white text-lg font-bold">معاينة البث</h1>
            <div className="w-10"></div>
          </div>

          {/* أزرار التحكم */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 space-x-reverse z-10">
            <Button 
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full ${cameraEnabled ? 'bg-white/20' : 'bg-red-500'} text-white`}
            >
              {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
            
            <Button 
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full ${micEnabled ? 'bg-white/20' : 'bg-red-500'} text-white`}
            >
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
          </div>

          {/* زر البث المباشر */}
          <div className="absolute bottom-8 left-4 right-4 z-10">
            <Button 
              onClick={goLive}
              disabled={createStreamMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold text-lg"
            >
              {createStreamMutation.isPending ? 'جاري البدء...' : '🔴 بدء البث المباشر'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // واجهة كتابة العنوان
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* الهيدر */}
      <div className="flex items-center justify-between p-4">
        <Button 
          onClick={() => setLocation('/')}
          variant="ghost" 
          className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">بث مباشر جديد</h1>
        <div className="w-10"></div>
      </div>

      {/* المحتوى */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
          <Camera className="w-16 h-16 text-white" />
        </div>
        
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">ما اسم بثك؟</h2>
          <p className="text-white/70 max-w-sm">
            اختر اسماً جذاباً لبثك المباشر
          </p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <Input
            placeholder="مثال: ألعاب ممتعة مع الأصدقاء"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center py-4 text-lg rounded-xl"
            maxLength={50}
          />
          
          <Button 
            onClick={startPreview}
            disabled={!streamTitle.trim()}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}