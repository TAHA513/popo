import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Radio, Users, Heart, MessageCircle } from 'lucide-react';
import { zegoService, ZegoStreamConfig } from '@/services/zegocloud';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface ZegoLiveStreamerProps {
  userId: string;
  userName: string;
}

export default function ZegoLiveStreamer({ userId, userName }: ZegoLiveStreamerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [streamUrl, setStreamUrl] = useState('');
  const [playUrl, setPlayUrl] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  // تهيئة الكاميرا المحلية
  useEffect(() => {
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

    initializeCamera();

    return () => {
      // تنظيف البث عند إغلاق المكون
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

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

    setIsInitializing(true);

    try {
      const roomId = `room_${userId}_${Date.now()}`;
      const config: ZegoStreamConfig = {
        appId: process.env.VITE_ZEGOCLOUD_APP_ID || '',
        appSign: process.env.VITE_ZEGOCLOUD_APP_SIGN || '',
        userId,
        userName,
        roomId,
        streamTitle
      };

      const result = await zegoService.startLiveStream(config);

      if (result.success) {
        setIsStreaming(true);
        setStreamUrl(result.streamUrl || '');
        setPlayUrl(result.playUrl || '');
        
        // حفظ البث في قاعدة البيانات
        const response = await fetch('/api/streams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: streamTitle,
            description: streamTitle,
            category: 'live',
            zegoRoomId: roomId,
            zegoStreamUrl: result.streamUrl,
            zegoPlayUrl: result.playUrl
          })
        });

        if (response.ok) {
          const streamData = await response.json();
          console.log('✅ Stream saved to database:', streamData);
          
          // محاكاة إحصائيات متزايدة
          const statsInterval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 3));
            setLikes(prev => prev + Math.floor(Math.random() * 2));
            setComments(prev => prev + Math.floor(Math.random() * 1));
          }, 5000);

          // حفظ interval للتنظيف لاحقاً
          (window as any).streamStatsInterval = statsInterval;
        }

        toast({
          title: "بدأ البث المباشر!",
          description: "تم بدء البث بنجاح. يمكن للمشاهدين الآن مشاهدتك."
        });
      } else {
        toast({
          title: "فشل في بدء البث",
          description: result.error || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error starting stream:', error);
      toast({
        title: "خطأ في البث",
        description: "تعذر بدء البث المباشر",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // إيقاف البث المباشر
  const stopLiveStream = async () => {
    try {
      // إيقاف ZegoCloud stream
      const roomId = `room_${userId}_${Date.now()}`;
      const streamId = `stream_${roomId}_${userId}`;
      await zegoService.stopLiveStream(roomId, streamId);

      // حذف البث من قاعدة البيانات
      // سنحتاج streamId من قاعدة البيانات هنا
      
      setIsStreaming(false);
      setStreamUrl('');
      setPlayUrl('');
      setViewerCount(0);
      setLikes(0);
      setComments(0);

      // تنظيف intervals
      if ((window as any).streamStatsInterval) {
        clearInterval((window as any).streamStatsInterval);
      }

      toast({
        title: "انتهى البث",
        description: "تم إيقاف البث المباشر بنجاح"
      });

      // العودة للصفحة الرئيسية
      setLocation('/');
    } catch (error) {
      console.error('❌ Error stopping stream:', error);
      toast({
        title: "خطأ في إيقاف البث",
        description: "حدث خطأ أثناء إيقاف البث",
        variant: "destructive"
      });
    }
  };

  // تبديل الفيديو
  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // تبديل الصوت
  const toggleAudio = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {!isStreaming ? (
        // شاشة إعداد البث
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Radio className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">بث مباشر احترافي</h2>
                <p className="text-gray-400">مدعوم بـ ZegoCloud</p>
              </div>

              {/* معاينة الكاميرا */}
              <div className="mb-6">
                <video
                  ref={videoRef}
                  className="w-full h-48 bg-gray-800 rounded-lg object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                
                {/* أزرار التحكم */}
                <div className="flex justify-center space-x-4 mt-4">
                  <Button
                    onClick={toggleVideo}
                    className={`${isVideoEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    onClick={toggleAudio}
                    className={`${isAudioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                  >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* عنوان البث */}
              <div className="mb-6">
                <Input
                  placeholder="عنوان البث المباشر..."
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* أزرار التحكم */}
              <div className="space-y-3">
                <Button
                  onClick={startLiveStream}
                  disabled={isInitializing || !streamTitle.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                >
                  {isInitializing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      جاري البدء...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Radio className="w-5 h-5 mr-2" />
                      ابدأ البث المباشر
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={() => setLocation('/')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // شاشة البث المباشر
        <div className="relative min-h-screen">
          {/* فيديو البث */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* تراكب البث المباشر */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60">
            {/* شريط علوي */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  🔴 مباشر
                </div>
                <div className="flex items-center bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  {viewerCount}
                </div>
              </div>

              <Button
                onClick={stopLiveStream}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                إنهاء البث
              </Button>
            </div>

            {/* إحصائيات جانبية */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-center">
                <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
                <span className="text-white text-sm font-bold">{likes}</span>
              </div>
              
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 text-center">
                <MessageCircle className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <span className="text-white text-sm font-bold">{comments}</span>
              </div>
            </div>

            {/* معلومات البث أسفل */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
                <h3 className="text-white font-bold text-lg mb-1">{streamTitle}</h3>
                <p className="text-white/70 text-sm">
                  بث مباشر من {userName} • {viewerCount} مشاهد • {likes + comments} تفاعل
                </p>
                {playUrl && (
                  <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300">
                    رابط المشاهدة: {playUrl}
                  </div>
                )}
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="absolute bottom-20 left-4 flex space-x-2 rtl:space-x-reverse">
              <Button
                onClick={toggleVideo}
                className={`${isVideoEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white p-3`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                onClick={toggleAudio}
                className={`${isAudioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white p-3`}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}