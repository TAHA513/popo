import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Mic, Video, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
// import { useStreamContext } from '@/contexts/StreamContext';

export default function NewStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // const { setStreamActive, setStreamInactive } = useStreamContext();
  const [step, setStep] = useState<'setup' | 'streaming'>('setup');
  const [streamTitle, setStreamTitle] = useState('');
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // إنشاء البث
  const createStreamMutation = useMutation({
    mutationFn: (data: { title: string; description: string }) => 
      apiRequest('/api/streams', 'POST', data),
    onSuccess: (newStream) => {
      console.log('✅ تم إنشاء البث:', newStream);
      setStep('streaming');
      startCamera();
      // تفعيل مؤشر البث
      // setStreamActive(newStream.id.toString(), streamTitle || 'بث مباشر');
    },
    onError: (error) => {
      console.error('❌ خطأ في إنشاء البث:', error);
    }
  });

  // تشغيل الكاميرا
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        setMediaStream(stream);
        setIsLive(true);
      }
    } catch (error) {
      console.error('❌ خطأ في تشغيل الكاميرا:', error);
    }
  };

  // إيقاف البث
  const stopStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsLive(false);
    // إيقاف مؤشر البث
    // setStreamInactive();
    setLocation('/');
  };

  // شاشة إعداد البث
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* الهيدر */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              onClick={() => setLocation('/')}
              variant="ghost" 
              className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-white">بث مباشر جديد</h1>
            <div className="w-12"></div>
          </div>

          {/* كارد إعداد البث */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            {/* أيقونة البث */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl flex items-center justify-center">
                <Video className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* عنوان البث */}
            <div className="space-y-4 mb-8">
              <label className="block text-white text-lg font-semibold">عنوان البث</label>
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="أدخل عنوان البث..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 text-lg p-4 rounded-2xl"
              />
            </div>

            {/* معلومات الإذن */}
            <div className="bg-blue-500/20 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Camera className="w-6 h-6 text-blue-300" />
                <Mic className="w-6 h-6 text-blue-300" />
                <span className="text-white font-semibold">إذن الوصول مطلوب</span>
              </div>
              <p className="text-white/80 text-sm">
                سنحتاج إذن للوصول إلى الكاميرا والمايكروفون لبدء البث المباشر
              </p>
            </div>

            {/* زر بدء البث */}
            <Button
              onClick={() => {
                if (streamTitle.trim()) {
                  createStreamMutation.mutate({
                    title: streamTitle,
                    description: 'بث مباشر'
                  });
                }
              }}
              disabled={!streamTitle.trim() || createStreamMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-2xl text-lg"
            >
              {createStreamMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري البدء...</span>
                </div>
              ) : (
                'ابدأ البث المباشر'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // شاشة البث المباشر
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* الفيديو */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* تراكب مؤشر البث */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        {/* مؤشر مباشر */}
        <div className="bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-bold">مباشر</span>
        </div>

        {/* زر الإغلاق */}
        <Button
          onClick={stopStream}
          variant="ghost"
          className="bg-black/50 hover:bg-red-600/80 text-white rounded-full w-12 h-12 p-0"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* معلومات البث في الأسفل */}
      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-4">
          <h2 className="text-white text-xl font-bold">{streamTitle}</h2>
          <p className="text-white/80 text-sm">بواسطة {user?.username}</p>
        </div>
      </div>
    </div>
  );
}