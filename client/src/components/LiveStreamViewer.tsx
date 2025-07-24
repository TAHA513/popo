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
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [gifts, setGifts] = useState(0);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<Array<{id: string, type: 'like' | 'comment' | 'gift', user: string, timestamp: number}>>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // الاتصال بـ WebSocket
  useEffect(() => {
    const wsUrl = `ws://${window.location.host}/api/streams/${streamId}/ws`;
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('🔗 تم الاتصال بالبث المباشر');
      setWs(websocket);
      
      // إرسال إشارة انضمام
      websocket.send(JSON.stringify({ type: 'viewer_joined' }));
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'viewer_joined':
          setViewerCount(prev => prev + 1);
          break;
        case 'viewer_left':
          setViewerCount(prev => Math.max(0, prev - 1));
          break;
        case 'like':
          setLikes(prev => prev + 1);
          addInteraction('like', data.user);
          break;
        case 'comment':
          setComments(prev => prev + 1);
          addInteraction('comment', data.user);
          break;
        case 'gift':
          setGifts(prev => prev + 1);
          addInteraction('gift', data.user);
          break;
        case 'end-live':
          setIsStreamEnded(true);
          break;
      }
    };
    
    websocket.onclose = () => {
      console.log('❌ تم قطع الاتصال مع البث');
      setWs(null);
    };

    // تنظيف عند إغلاق المكون
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'viewer_left' }));
        websocket.close();
      }
    };
  }, [streamId]);

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
    if (ws) {
      ws.send(JSON.stringify({ type: 'like', user: 'أنت' }));
      setLikes(prev => prev + 1);
      addInteraction('like', 'أنت');
    }
  };

  // إرسال تعليق
  const sendComment = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'comment', user: 'أنت' }));
      setComments(prev => prev + 1);
      addInteraction('comment', 'أنت');
    }
  };

  // إرسال هدية
  const sendGift = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'gift', user: 'أنت' }));
      setGifts(prev => prev + 1);
      addInteraction('gift', 'أنت');
    }
  };

  // إذا انتهى البث
  if (isStreamEnded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl font-bold mb-2">انتهى البث</h2>
          <p className="text-white/70 mb-6">هذا البث انتهى. شكراً لمشاهدتك!</p>
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