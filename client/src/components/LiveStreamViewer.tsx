import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Gift, Eye, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface LiveStreamViewerProps {
  streamId: number;
  streamTitle: string;
  hostName: string;
}

export default function LiveStreamViewer({ streamId, streamTitle, hostName }: LiveStreamViewerProps) {
  const [, setLocation] = useLocation();
  const [viewerCount, setViewerCount] = useState(1);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [gifts, setGifts] = useState(0);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<Array<{id: string, type: 'like' | 'comment' | 'gift', user: string, timestamp: number}>>([]);
  const [streamExists, setStreamExists] = useState(true);

  // التحقق من حالة البث قبل بدء المشاهدة
  useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        console.log('🔍 Checking stream status for ID:', streamId);
        const response = await fetch(`/api/streams/${streamId}`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
          console.log('❌ API returned error:', response.status);
          setIsStreamEnded(true);
          return;
        }
        
        const stream = await response.json();
        console.log('📊 Stream data received:', stream);
        
        if (!stream || !stream.isLive) {
          console.log('❌ Stream is not live or doesn\'t exist');
          setIsStreamEnded(true);
          return;
        }
        
        console.log('✅ Stream is live, starting viewer mode');
        setStreamExists(true);
        setIsStreamEnded(false);
        
        // محاكاة عدد المشاهدين
        const randomViewers = Math.floor(Math.random() * 50) + 1;
        setViewerCount(randomViewers);
        
      } catch (error) {
        console.error('❌ Error checking stream:', error);
        setStreamExists(false);
        setIsStreamEnded(true);
      }
    };

    checkStreamStatus();
    
    // تحديث دوري لحالة البث كل 30 ثانية
    const interval = setInterval(checkStreamStatus, 30000);
    return () => clearInterval(interval);
  }, [streamId]);

  // محاكاة تفاعل المشاهدين
  useEffect(() => {
    if (!streamExists || isStreamEnded) return;
    
    const interval = setInterval(() => {
      // محاكاة تفاعلات عشوائية
      const randomInteraction = Math.random();
      const randomUser = `مشاهد${Math.floor(Math.random() * 100)}`;
      
      if (randomInteraction < 0.3) {
        setLikes(prev => prev + 1);
        addInteraction('like', randomUser);
      } else if (randomInteraction < 0.6) {
        setComments(prev => prev + 1);
        addInteraction('comment', randomUser);
      } else if (randomInteraction < 0.8) {
        setGifts(prev => prev + 1);
        addInteraction('gift', randomUser);
      }
      
      // تغيير عدد المشاهدين بشكل طفيف
      setViewerCount(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [streamExists, isStreamEnded]);

  // إضافة تفاعل جديد
  const addInteraction = (type: 'like' | 'comment' | 'gift', user: string) => {
    const newInteraction = {
      id: Date.now().toString(),
      type,
      user,
      timestamp: Date.now()
    };
    
    setRecentInteractions(prev => {
      const updated = [newInteraction, ...prev].slice(0, 5);
      return updated;
    });
    
    // إزالة التفاعل بعد 3 ثوانٍ
    setTimeout(() => {
      setRecentInteractions(prev => prev.filter(i => i.id !== newInteraction.id));
    }, 3000);
  };

  // إرسال إعجاب
  const sendLike = () => {
    setLikes(prev => prev + 1);
    addInteraction('like', 'أنت');
  };

  // إرسال تعليق
  const sendComment = () => {
    setComments(prev => prev + 1);
    addInteraction('comment', 'أنت');
  };

  // إرسال هدية
  const sendGift = () => {
    setGifts(prev => prev + 1);
    addInteraction('gift', 'أنت');
  };

  // إذا انتهى البث
  if (isStreamEnded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl font-bold mb-2">البث غير متاح</h2>
          <p className="text-white/70 mb-6">قد يكون البث انتهى أو غير متاح حالياً</p>
          <Button 
            onClick={() => setLocation('/')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-xl"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* محاكاة بث مباشر */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-pink-900/50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-4xl">🎥</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{streamTitle}</h2>
          <p className="text-xl opacity-80">بث مباشر من {hostName}</p>
        </div>
      </div>

      {/* شريط علوي */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-30">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => setLocation('/')}
            variant="ghost" 
            className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              🔴 مباشر
            </div>
            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1 space-x-reverse">
              <Eye className="w-4 h-4" />
              <span>{viewerCount}</span>
            </div>
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
        </div>
      </div>
    </div>
  );
}