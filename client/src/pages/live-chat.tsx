import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users, Radio, Mic, MicOff, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message?: string;
  voiceMessage?: string;
  timestamp: Date;
  profileImageUrl?: string;
}

export default function LiveChatPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [viewers, setViewers] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Add voice message to chat
        const voiceMessage: ChatMessage = {
          id: Date.now().toString(),
          userId: user!.id,
          username: user!.username,
          voiceMessage: audioUrl,
          timestamp: new Date(),
          profileImageUrl: user!.profileImageUrl
        };
        
        setMessages(prev => [...prev, voiceMessage]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('خطأ في تسجيل الصوت:', error);
      alert('تعذر الوصول للميكروفون. تأكد من السماح بالوصول للميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendTextMessage = () => {
    if (!newMessage.trim() || !user) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      message: newMessage,
      timestamp: new Date(),
      profileImageUrl: user.profileImageUrl
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-white font-semibold">دردشة مباشرة</span>
            </div>
            <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse text-white/70 text-sm">
              <Users className="w-4 h-4" />
              <span>{viewers} مشاهد</span>
            </div>
          </div>
          
          <div className="w-20"></div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70 text-lg">أهلاً بك في الدردشة المباشرة!</p>
              <p className="text-white/50 text-sm">ابدأ المحادثة مع المشاهدين</p>
            </div>
          ) : (
            messages.map((msg) => (
              <Card key={msg.id} className="bg-white/10 backdrop-blur-sm border-white/20 p-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  {msg.profileImageUrl ? (
                    <img
                      src={msg.profileImageUrl}
                      alt={msg.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {msg.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                      <span className="text-white font-semibold text-sm">{msg.username}</span>
                      <span className="text-white/50 text-xs">
                        {msg.timestamp.toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {msg.message ? (
                      <p className="text-white/90 text-sm leading-relaxed">{msg.message}</p>
                    ) : msg.voiceMessage ? (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse bg-purple-500/30 rounded-lg p-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                        <audio controls className="flex-1 h-8">
                          <source src={msg.voiceMessage} type="audio/webm" />
                        </audio>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Voice Recording Button */}
          <Button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white p-3 rounded-full transition-all duration-200`}
            disabled={!user}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Recording Timer */}
          {isRecording && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-mono">
              {recordingTime}s / 30s
            </div>
          )}

          {/* Text Input */}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm"
            disabled={!user}
          />

          {/* Send Button */}
          <Button
            onClick={sendTextMessage}
            className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full"
            disabled={!newMessage.trim() || !user}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {!user && (
          <p className="text-white/70 text-center text-sm mt-2">
            يجب تسجيل الدخول للمشاركة في الدردشة
          </p>
        )}
      </div>
    </div>
  );
}