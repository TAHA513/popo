import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { 
  Send, 
  Gift, 
  Mic, 
  Users, 
  Heart, 
  Sparkles,
  MessageCircle,
  Volume2,
  ArrowLeft,
  Crown
} from 'lucide-react';

interface Message {
  id: number;
  userId: string;
  username: string;
  text: string;
  type: 'text' | 'gift' | 'voice' | 'system';
  giftType?: string;
  voiceUrl?: string;
  timestamp: Date;
  effects?: string;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  effect: string;
}

const GIFTS: Gift[] = [
  { id: 'rose', name: 'وردة', icon: '🌹', cost: 10, effect: 'bounce' },
  { id: 'heart', name: 'قلب', icon: '❤️', cost: 5, effect: 'pulse' },
  { id: 'diamond', name: 'ماسة', icon: '💎', cost: 100, effect: 'sparkle' },
  { id: 'crown', name: 'تاج', icon: '👑', cost: 500, effect: 'rotate' },
  { id: 'fire', name: 'نار', icon: '🔥', cost: 20, effect: 'shake' },
  { id: 'star', name: 'نجمة', icon: '⭐', cost: 15, effect: 'glow' }
];

export default function LiveTextChatPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userPoints, setUserPoints] = useState(1000);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // محاكاة رسائل ترحيبية
  useEffect(() => {
    if (user) {
      const welcomeMessage: Message = {
        id: Date.now(),
        userId: 'system',
        username: 'النظام',
        text: `أهلاً بك ${user.username} في الدردشة المباشرة! 🎉`,
        type: 'system',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // محاكاة مستخدمين آخرين
      setRoomUsers(['أحمد', 'فاطمة', 'محمد', 'سارة', 'عبدالله']);
    }
  }, [user]);

  // التمرير التلقائي للأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // إرسال رسالة نصية
  const sendTextMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      text: newMessage,
      type: 'text',
      timestamp: new Date(),
      effects: 'fadeIn'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // إرسال هدية
  const sendGift = (gift: Gift) => {
    if (userPoints < gift.cost) {
      alert('ليس لديك نقاط كافية!');
      return;
    }

    const message: Message = {
      id: Date.now(),
      userId: user!.id,
      username: user!.username,
      text: `أرسل ${gift.name}`,
      type: 'gift',
      giftType: gift.icon,
      timestamp: new Date(),
      effects: gift.effect
    };

    setMessages(prev => [...prev, message]);
    setUserPoints(prev => prev - gift.cost);
    setShowGifts(false);
  };

  // بدء تسجيل الصوت
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // في الإنتاج: رفع الملف إلى الخادم والحصول على URL
        const voiceUrl = URL.createObjectURL(audioBlob);
        
        const message: Message = {
          id: Date.now(),
          userId: user!.id,
          username: user!.username,
          text: 'بصمة صوتية 🎤',
          type: 'voice',
          voiceUrl: voiceUrl,
          timestamp: new Date(),
          effects: 'pulse'
        };

        setMessages(prev => [...prev, message]);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // إيقاف التسجيل تلقائياً بعد 5 ثواني
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 5000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لا يمكن الوصول للميكروفون');
    }
  };

  // إيقاف تسجيل الصوت
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // تشغيل البصمة الصوتية
  const playVoiceMessage = (voiceUrl: string) => {
    const audio = new Audio(voiceUrl);
    audio.play();
  };

  // دعوة لغرفة ثنائية
  const inviteToPrivateRoom = (username: string) => {
    if (confirm(`هل تريد دعوة ${username} لغرفة خاصة؟ (تكلفة: 50 نقطة)`)) {
      if (userPoints >= 50) {
        setUserPoints(prev => prev - 50);
        alert(`تم إرسال دعوة لـ ${username}`);
        // في الإنتاج: إنشاء غرفة خاصة وإرسال دعوة
      } else {
        alert('ليس لديك نقاط كافية!');
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl mb-4">يجب تسجيل الدخول</h2>
          <Button onClick={() => setLocation('/login')}>تسجيل الدخول</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-black text-white">
      {/* الهيدر */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">الدردشة المباشرة</h1>
            <Badge variant="secondary" className="bg-red-500">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              مباشر
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              <Sparkles className="w-4 h-4 mr-1" />
              {userPoints} نقطة
            </Badge>
            <Badge variant="outline">
              <Users className="w-4 h-4 mr-1" />
              {roomUsers.length + 1} متصل
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* قائمة المستخدمين */}
        <div className="w-64 bg-black/20 backdrop-blur-sm p-4 border-r border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            المتصلون
          </h3>
          
          <div className="space-y-2">
            {/* المستخدم الحالي */}
            <Card className="p-3 bg-purple-500/20 border-purple-500">
              <div className="flex items-center justify-between">
                <span className="font-bold">{user.username} (أنت)</span>
                <Crown className="w-4 h-4 text-yellow-400" />
              </div>
            </Card>
            
            {/* المستخدمون الآخرون */}
            {roomUsers.map((username, index) => (
              <Card 
                key={index} 
                className="p-3 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                onClick={() => inviteToPrivateRoom(username)}
              >
                <div className="flex items-center justify-between">
                  <span>{username}</span>
                  <MessageCircle className="w-4 h-4 opacity-50" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* منطقة الرسائل */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`animate-${message.effects || 'fadeIn'} ${
                  message.userId === user.id ? 'text-right' : 'text-left'
                }`}
              >
                {/* رسالة نصية */}
                {message.type === 'text' && (
                  <div className={`inline-block max-w-xs ${
                    message.userId === user.id 
                      ? 'bg-purple-600' 
                      : 'bg-gray-700'
                  } rounded-lg px-4 py-2`}>
                    <p className="text-sm font-bold mb-1">{message.username}</p>
                    <p>{message.text}</p>
                  </div>
                )}

                {/* رسالة هدية */}
                {message.type === 'gift' && (
                  <div className="text-center my-4">
                    <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-6 py-3">
                      <p className="text-sm font-bold">{message.username}</p>
                      <p className="text-2xl my-2 animate-bounce">{message.giftType}</p>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                )}

                {/* بصمة صوتية */}
                {message.type === 'voice' && (
                  <div className={`inline-block ${
                    message.userId === user.id 
                      ? 'bg-green-600' 
                      : 'bg-blue-600'
                  } rounded-lg px-4 py-2`}>
                    <p className="text-sm font-bold mb-1">{message.username}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playVoiceMessage(message.voiceUrl!)}
                      className="text-white hover:bg-white/20"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      {message.text}
                    </Button>
                  </div>
                )}

                {/* رسالة نظام */}
                {message.type === 'system' && (
                  <div className="text-center my-4">
                    <Badge variant="secondary" className="bg-gray-700">
                      {message.text}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* منطقة الإدخال */}
          <div className="p-4 border-t border-white/10 bg-black/50">
            {/* أزرار الهدايا */}
            {showGifts && (
              <div className="mb-4 p-4 bg-black/30 rounded-lg">
                <h4 className="text-sm font-bold mb-2">اختر هدية:</h4>
                <div className="grid grid-cols-6 gap-2">
                  {GIFTS.map((gift) => (
                    <Button
                      key={gift.id}
                      variant="outline"
                      size="sm"
                      onClick={() => sendGift(gift)}
                      className="flex flex-col items-center p-2 hover:bg-white/10"
                    >
                      <span className="text-2xl">{gift.icon}</span>
                      <span className="text-xs">{gift.cost}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              
              <Button
                onClick={() => setShowGifts(!showGifts)}
                variant="outline"
                size="icon"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/20"
              >
                <Gift className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                size="icon"
                className={`${
                  isRecording 
                    ? 'border-red-500 text-red-500 animate-pulse' 
                    : 'border-green-400 text-green-400 hover:bg-green-400/20'
                }`}
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={sendTextMessage}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS للتأثيرات */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.5); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-bounce { animation: bounce 1s ease-in-out; }
        .animate-pulse { animation: pulse 1s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 2s ease-in-out; }
        .animate-rotate { animation: rotate 2s linear; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
      `}} />
    </div>
  );
}