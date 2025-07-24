import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Radio, Users, Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function SimpleZegoStream() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [step, setStep] = useState<'title' | 'camera' | 'streaming'>('title');

  // تهيئة الكاميرا
  useEffect(() => {
    if (step === 'camera') {
      initializeCamera();
    }
    
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('❌ Failed to access camera:', error);
      toast({
        title: "خطأ في الكاميرا",
        description: "لا يمكن الوصول إلى الكاميرا. تأكد من الأذونات.",
        variant: "destructive"
      });
    }
  };

  const handleStartCamera = () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث المباشر",
        variant: "destructive"
      });
      return;
    }
    setStep('camera');
  };

  const handleStartStream = () => {
    setIsStreaming(true);
    setStep('streaming');
    // محاكاة مشاهدين
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 3));
      setLikes(prev => prev + Math.floor(Math.random() * 2));
      setComments(prev => prev + Math.floor(Math.random() * 1));
    }, 3000);

    return () => clearInterval(viewerInterval);
  };

  const handleEndStream = () => {
    setIsStreaming(false);
    setLocation('/');
  };

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

  // مرحلة إدخال العنوان
  if (step === 'title') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl font-bold">
              بث مباشر احترافي
            </CardTitle>
            <p className="text-gray-300">
              مدعوم بـ ZegoCloud للحصول على أفضل جودة
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
                onClick={handleStartCamera}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!streamTitle.trim()}
              >
                <Video className="w-4 h-4 mr-2" />
                التالي
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // مرحلة معاينة الكاميرا
  if (step === 'camera') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => setStep('title')}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              رجوع
            </Button>
            <h1 className="text-white font-bold text-lg">{streamTitle}</h1>
            <Button
              onClick={handleStartStream}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              بدء البث
            </Button>
          </div>

          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-96 bg-black rounded-lg object-cover"
              muted
              playsInline
              autoPlay
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
              <Button
                onClick={toggleVideo}
                className={`${isVideoEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-full p-3`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              <Button
                onClick={toggleAudio}
                className={`${isAudioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-full p-3`}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // مرحلة البث المباشر
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-lg border-b border-red-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h1 className="text-white font-bold text-lg">{streamTitle}</h1>
          </div>
          
          <Button
            onClick={handleEndStream}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            إنهاء البث
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-screen bg-black object-cover"
          muted
          playsInline
          autoPlay
        />
        
        {/* Stream Stats */}
        <div className="absolute top-4 right-4 space-y-2">
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

        {/* Controls */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4">
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

        {/* Live Badge */}
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold animate-pulse">
          ● مباشر
        </div>
      </div>
    </div>
  );
}