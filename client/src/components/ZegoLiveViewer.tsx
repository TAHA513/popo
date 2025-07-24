import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Gift, Eye, ArrowLeft, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { zegoService } from '@/services/zegocloud';

interface ZegoLiveViewerProps {
  streamId: number;
  streamTitle: string;
  hostName: string;
  zegoRoomId?: string;
  zegoPlayUrl?: string;
}

export default function ZegoLiveViewer({ 
  streamId, 
  streamTitle, 
  hostName, 
  zegoRoomId, 
  zegoPlayUrl 
}: ZegoLiveViewerProps) {
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [viewerCount, setViewerCount] = useState(1);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [gifts, setGifts] = useState(0);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentInteractions, setRecentInteractions] = useState<Array<{
    id: string;
    type: 'like' | 'comment' | 'gift';
    user: string;
    timestamp: number;
  }>>([]);

  // تحميل البث المباشر
  useEffect(() => {
    const loadStream = async () => {
      try {
        setIsLoading(true);
        
        if (zegoRoomId && zegoPlayUrl && videoRef.current) {
          // محاولة تشغيل البث باستخدام ZegoCloud
          const streamIdForZego = `stream_${zegoRoomId}_${hostName}`;
          const success = await zegoService.watchLiveStream(
            zegoRoomId, 
            streamIdForZego, 
            videoRef.current
          );
          
          if (success) {
            console.log('✅ Successfully connected to ZegoCloud stream');
            setIsStreamEnded(false);
            
            // محاكاة عدد المشاهدين
            const randomViewers = Math.floor(Math.random() * 100) + 10;
            setViewerCount(randomViewers);
          } else {
            // إذا فشل ZegoCloud، استخدم محاكاة البث
            console.log('⚠️ ZegoCloud failed, using simulation');
            setupStreamSimulation();
          }
        } else {
          // استخدام محاكاة البث إذا لم تتوفر بيانات ZegoCloud
          setupStreamSimulation();
        }
      } catch (error) {
        console.error('❌ Error loading stream:', error);
        setupStreamSimulation();
      } finally {
        setIsLoading(false);
      }
    };

    loadStream();

    // تحقق دوري من حالة البث
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/streams/${streamId}`);
        if (!response.ok || !(await response.json()).isLive) {
          setIsStreamEnded(true);
        }
      } catch (error) {
        console.error('❌ Error checking stream status:', error);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [streamId, zegoRoomId, zegoPlayUrl, hostName]);

  // إعداد محاكاة البث
  const setupStreamSimulation = () => {
    if (videoRef.current) {
      // إنشاء فيديو محاكاة بسيط
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // رسم خلفية متدرجة
        const gradient = ctx.createLinearGradient(0, 0, 640, 480);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 640, 480);
        
        // إضافة نص
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔴 بث مباشر', 320, 200);
        ctx.fillText(streamTitle, 320, 250);
        ctx.fillText(`من ${hostName}`, 320, 300);
        
        // تحويل إلى stream
        const stream = canvas.captureStream(30);
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }
    
    // محاكاة إحصائيات
    const randomViewers = Math.floor(Math.random() * 50) + 5;
    setViewerCount(randomViewers);
  };

  // محاكاة تفاعل المشاهدين
  useEffect(() => {
    if (isStreamEnded || isLoading) return;
    
    const interval = setInterval(() => {
      const randomInteraction = Math.random();
      const randomUser = `مشاهد${Math.floor(Math.random() * 100)}`;
      
      if (randomInteraction < 0.4) {
        setLikes(prev => prev + 1);
        addInteraction('like', randomUser);
      } else if (randomInteraction < 0.7) {
        setComments(prev => prev + 1);
        addInteraction('comment', randomUser);
      } else if (randomInteraction < 0.9) {
        setGifts(prev => prev + 1);
        addInteraction('gift', randomUser);
      }
      
      // تغيير عدد المشاهدين بشكل طفيف
      setViewerCount(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isStreamEnded, isLoading]);

  // إضافة تفاعل
  const addInteraction = (type: 'like' | 'comment' | 'gift', user: string) => {
    const newInteraction = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      user,
      timestamp: Date.now()
    };
    
    setRecentInteractions(prev => [...prev, newInteraction]);
    
    // إزالة التفاعل بعد 3 ثوان
    setTimeout(() => {
      setRecentInteractions(prev => prev.filter(i => i.id !== newInteraction.id));
    }, 3000);
  };

  // إرسال تفاعل من المشاهد
  const sendLike = () => {
    setLikes(prev => prev + 1);
    addInteraction('like', 'أنت');
  };

  const sendComment = () => {
    setComments(prev => prev + 1);
    addInteraction('comment', 'أنت');
  };

  const sendGift = () => {
    setGifts(prev => prev + 1);
    addInteraction('gift', 'أنت');
  };

  // إذا انتهى البث
  if (isStreamEnded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📺</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">انتهى البث المباشر</h2>
          <p className="text-gray-400 mb-6">
            شكراً لمشاهدتك بث "{streamTitle}"
          </p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-laa-pink hover:bg-laa-pink/90"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* شاشة التحميل */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p>جاري تحميل البث المباشر...</p>
          </div>
        </div>
      )}

      {/* فيديو البث */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        controls={false}
      />

      {/* تراكب البث */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60">
        {/* شريط علوي */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
          <Button
            onClick={() => setLocation('/')}
            className="bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              🔴 مباشر
            </div>
            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1 rtl:space-x-reverse">
              <Eye className="w-4 h-4" />
              <span>{viewerCount}</span>
            </div>
          </div>
        </div>

        {/* إحصائيات التفاعل */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 space-y-4">
          <Button
            onClick={sendLike}
            className="bg-black/50 backdrop-blur-sm rounded-full p-3 flex flex-col items-center hover:bg-red-500/50 transition-colors"
          >
            <Heart className="w-6 h-6 text-red-500 mb-1" />
            <span className="text-white text-sm font-bold">{likes}</span>
          </Button>
          
          <Button
            onClick={sendComment}
            className="bg-black/50 backdrop-blur-sm rounded-full p-3 flex flex-col items-center hover:bg-blue-500/50 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-blue-500 mb-1" />
            <span className="text-white text-sm font-bold">{comments}</span>
          </Button>
          
          <Button
            onClick={sendGift}
            className="bg-black/50 backdrop-blur-sm rounded-full p-3 flex flex-col items-center hover:bg-yellow-500/50 transition-colors"
          >
            <Gift className="w-6 h-6 text-yellow-500 mb-1" />
            <span className="text-white text-sm font-bold">{gifts}</span>
          </Button>
        </div>

        {/* التفاعلات المباشرة */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 space-y-2">
          {recentInteractions.map((interaction) => (
            <div
              key={interaction.id}
              className="bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-sm animate-bounce"
            >
              {interaction.type === 'like' && '❤️'} 
              {interaction.type === 'comment' && '💬'} 
              {interaction.type === 'gift' && '🎁'} 
              <span className="mr-1">{interaction.user}</span>
            </div>
          ))}
        </div>

        {/* معلومات البث أسفل */}
        <div className="absolute bottom-8 left-4 right-4 z-30">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-white font-bold text-lg mb-1">{streamTitle}</h3>
            <p className="text-white/70 text-sm">
              🔴 بث مباشر من {hostName} • {viewerCount} مشاهد • {likes + comments + gifts} تفاعل
            </p>
            {zegoPlayUrl && (
              <div className="mt-2 text-xs text-white/50">
                مدعوم بـ ZegoCloud
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}