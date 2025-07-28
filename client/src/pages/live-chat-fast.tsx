import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Gift, 
  Mic, 
  Users, 
  ArrowLeft,
  Heart,
  Crown
} from 'lucide-react';
import BottomNavigation from '@/components/bottom-navigation';

interface Message {
  id: number;
  userId: string;
  username: string;
  text: string;
  type: 'text' | 'gift' | 'system';
  timestamp: Date;
}

const GIFTS = [
  { id: 'heart', name: 'قلب', icon: '❤️', cost: 5 },
  { id: 'rose', name: 'وردة', icon: '🌹', cost: 10 },
  { id: 'diamond', name: 'ماسة', icon: '💎', cost: 50 },
  { id: 'crown', name: 'تاج', icon: '👑', cost: 100 }
];

export default function LiveChatFast() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [userPoints, setUserPoints] = useState(1000);
  const [onlineUsers] = useState(['أحمد', 'فاطمة', 'محمد', 'سارة']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const welcomeMessage: Message = {
        id: Date.now(),
        userId: 'system',
        username: 'النظام',
        text: `مرحباً ${user.username} في الدردشة المباشرة! 🎉`,
        type: 'system',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      text: newMessage,
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const sendGift = (gift: typeof GIFTS[0]) => {
    if (!user || userPoints < gift.cost) return;

    const giftMessage: Message = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      text: `أرسل ${gift.name} ${gift.icon}`,
      type: 'gift',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, giftMessage]);
    setUserPoints(prev => prev - gift.cost);
    setShowGifts(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl mb-4">يجب تسجيل الدخول أولاً</h2>
          <Button onClick={() => setLocation('/login')}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-sm border-b border-white/30 p-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setLocation('/')}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
          
          <h1 className="text-xl font-bold text-white">الدردشة المباشرة</h1>
          
          <div className="flex items-center text-white text-sm">
            <Users className="w-4 h-4 ml-1" />
            <span>{onlineUsers.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Points Display */}
      <div className="bg-white/10 backdrop-blur-sm p-2 text-center">
        <span className="text-white text-sm">
          💰 نقاطك: {userPoints}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 200px)' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.userId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.type === 'system'
                  ? 'bg-yellow-400/80 text-black mx-auto'
                  : message.type === 'gift'
                  ? 'bg-purple-500/80 text-white'
                  : message.userId === user.id
                  ? 'bg-blue-500/80 text-white'
                  : 'bg-white/80 text-black'
              }`}
            >
              {message.type !== 'system' && (
                <div className="text-xs opacity-70 mb-1">{message.username}</div>
              )}
              <div className="text-sm">{message.text}</div>
              <div className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/20 backdrop-blur-sm border-t border-white/30 p-4">
        {showGifts && (
          <div className="mb-4 flex gap-2 justify-center">
            {GIFTS.map((gift) => (
              <Button
                key={gift.id}
                onClick={() => sendGift(gift)}
                disabled={userPoints < gift.cost}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/50 text-xs"
                size="sm"
              >
                {gift.icon} {gift.name} ({gift.cost})
              </Button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowGifts(!showGifts)}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            size="sm"
          >
            <Gift className="w-4 h-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/70"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500/80 hover:bg-blue-600/80 text-white border-0"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}