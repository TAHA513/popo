import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  X,
  MoreVertical
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  senderId: string;
  content: string;
  messageType: 'text' | 'voice';
  isRead: boolean;
  createdAt: string;
  sender?: {
    username: string;
    profileImageUrl?: string;
  };
}

interface Conversation {
  id: number;
  otherUser: {
    id: string;
    username: string;
    profileImageUrl?: string;
    isOnline?: boolean;
  };
}

export default function PrivateChatPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // استخراج معرف المستخدم من الرابط
  const otherUserId = location.split('/messages/private/')[1];
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // حالات الرسائل
  const [newMessage, setNewMessage] = useState("");
  
  // حالات التسجيل الصوتي
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // حالات تشغيل الرسائل الصوتية
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [localAudioMessages, setLocalAudioMessages] = useState<{[key: string]: Blob}>({});

  // جلب بيانات المحادثة
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: [`/api/conversations/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversation');
      return response.json();
    },
    enabled: !!otherUserId && !!user
  });

  // جلب الرسائل
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/messages/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!otherUserId && !!user,
    refetchInterval: 3000
  });

  // إرسال رسالة نصية
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      console.log('📝 Sending text message:', { content, otherUserId });
      return apiRequest(`/api/messages/${otherUserId}`, 'POST', { content });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive"
      });
    }
  });

  // إرسال رسالة صوتية
  const sendVoiceMessage = useMutation({
    mutationFn: async ({ content, audioKey }: { content: string; audioKey: string }) => {
      console.log('🎙️ Voice message mutation called:', { content, audioKey, messageType: 'voice', otherUserId });
      const response = await apiRequest(`/api/messages/${otherUserId}`, 'POST', { 
        content, 
        messageType: 'voice' 
      });
      console.log('✅ Voice message API response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('🎉 Voice message success callback:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة الصوتية بنجاح"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة الصوتية",
        variant: "destructive"
      });
    }
  });

  // التحقق من وجود معرف المستخدم
  if (!otherUserId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-600">خطأ: لم يتم العثور على المستخدم</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // بدء التسجيل الصوتي
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // عداد الوقت
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "خطأ في التسجيل",
        description: "يرجى السماح بالوصول للميكروفون لإرسال رسائل صوتية",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const sendAudioMessage = async () => {
    console.log('🎤🎤🎤 SEND AUDIO MESSAGE FUNCTION CALLED! 🎤🎤🎤');
    console.log('Current state:', { 
      audioBlob: !!audioBlob, 
      audioBlobSize: audioBlob?.size,
      user: !!user, 
      userId: user?.id,
      recordingTime,
      isPending: sendVoiceMessage.isPending 
    });
    
    if (!audioBlob || !user) {
      console.log('❌ Missing data - cannot send voice message');
      toast({
        title: "خطأ",
        description: "لا يمكن إرسال الرسالة الصوتية - بيانات مفقودة",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('📡 Starting voice message send process...');
      
      // إرسال الرسالة النصية بدلاً من البصمة الصوتية مؤقتاً للاختبار
      const content = `🎤 رسالة صوتية (${recordingTime} ثانية)`;
      console.log('📤 Sending as text message:', content);
      
      // استخدام نفس طريقة إرسال الرسائل النصية
      const response = await apiRequest('POST', '/api/messages/send', {
        receiverId: otherUserId,
        content: content
      });
      
      console.log('✅ Voice message sent as text successfully!', response);
      
      // إعادة تعيين البيانات الصوتية
      setAudioBlob(null);
      setRecordingTime(0);
      
      // تحديث قائمة الرسائل
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة الصوتية بنجاح"
      });
      
    } catch (error: any) {
      console.error('❌ Send audio error:', error);
      toast({
        title: "خطأ في الإرسال",
        description: error?.message || "فشل في إرسال الرسالة الصوتية",
        variant: "destructive"
      });
    }
  };

  // تشغيل الرسائل الصوتية
  const playVoiceMessage = async (messageId: number, duration: number, messageText: string) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    setPlayingMessageId(messageId);
    
    try {
      const audioKeyMatch = messageText.match(/\[([^\]]+)\]/);
      const audioKey = audioKeyMatch ? audioKeyMatch[1] : null;
      
      if (audioKey && localAudioMessages[audioKey]) {
        const audioBlob = localAudioMessages[audioKey];
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setPlayingMessageId(null);
          setAudioElement(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        setAudioElement(audio);
      } else {
        // محاكاة صوتية
        setTimeout(() => {
          setPlayingMessageId(null);
          setAudioElement(null);
        }, duration * 1000);
      }
    } catch (error) {
      setPlayingMessageId(null);
      setAudioElement(null);
    }
  };

  const stopVoiceMessage = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setPlayingMessageId(null);
    setAudioElement(null);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage.mutate(newMessage.trim());
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (conversationLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-600">المحادثة غير موجودة</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* No SimpleNavigation - Custom header only */}
      
      {/* رأس المحادثة */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/messages')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-10 h-10">
              {conversation?.otherUser?.profileImageUrl ? (
                <img src={conversation.otherUser.profileImageUrl} alt={conversation.otherUser.username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                  {conversation?.otherUser?.username?.slice(0, 2).toUpperCase() || 'U'}
                </div>
              )}
            </Avatar>
            
            <div>
              <h2 className="font-semibold text-gray-800">@{conversation?.otherUser?.username || 'مستخدم'}</h2>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${conversation?.otherUser?.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-500">
                  {conversation?.otherUser?.isOnline ? 'متصل الآن' : 'غير متصل'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ height: 'calc(100vh - 200px)' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">ابدأ المحادثة</h3>
            <p className="text-gray-500">أرسل أول رسالة لبدء المحادثة مع {conversation?.otherUser?.username}</p>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.senderId === user?.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                {message.messageType === 'voice' ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="text-sm">
                      {message.content.includes('🎤') ? message.content.split('[')[0] : '🎤 رسالة صوتية'}
                    </div>
                    {playingMessageId === message.id ? (
                      <Button
                        onClick={stopVoiceMessage}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
                      >
                        <Pause className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => playVoiceMessage(
                          message.id, 
                          parseInt(message.content.match(/\((\d+) ثانية\)/)?.[1] || '5'), 
                          message.content
                        )}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">{message.content}</div>
                )}
                <div className={`text-xs mt-1 ${
                  message.senderId === user?.id ? 'text-purple-100' : 'text-gray-500'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* منطقة إدخال الرسائل */}
      <div className="bg-white border-t border-gray-200 p-4">
        {audioBlob && (
          <div className="bg-green-100 border border-green-300 p-4 rounded-lg mb-4">
            <div className="text-center mb-3">
              <span className="text-green-700 font-medium">
                🎤 رسالة صوتية جاهزة ({recordingTime} ثانية)
              </span>
            </div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚀🚀🚀 VOICE SEND BUTTON CLICKED - EVENT TRIGGERED! 🚀🚀🚀');
                  console.log('Event target:', e.target);
                  console.log('Current time:', new Date().toISOString());
                  console.log('Audio blob exists:', !!audioBlob);
                  console.log('Audio blob size:', audioBlob?.size);
                  
                  if (audioBlob) {
                    console.log('📤 Calling sendAudioMessage function...');
                    sendAudioMessage();
                  } else {
                    console.log('❌ No audio blob found!');
                  }
                }}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-600 active:bg-green-700 transition-colors duration-200"
                style={{ 
                  minWidth: '120px', 
                  minHeight: '50px',
                  zIndex: 9999,
                  position: 'relative',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
                }}
                type="button"
              >
                إرسال ➤
              </button>
              
              <button 
                onClick={() => {
                  console.log('🗑️ Cancel clicked');
                  setAudioBlob(null);
                  setRecordingTime(0);
                }}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-600"
                style={{ 
                  minWidth: '120px', 
                  minHeight: '50px',
                  zIndex: 999,
                  position: 'relative'
                }}
              >
                إلغاء ✕
              </button>
            </div>
          </div>
        )}
        
        {isRecording && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-red-700 font-medium">
                  جاري التسجيل... ({recordingTime}/30 ثانية)
                </span>
              </div>
              <button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
              >
                <MicOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* إرسال الرسائل النصية فقط عندما لا توجد بصمة صوتية */}
        {!audioBlob && !isRecording && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendMessage.isPending}
            />
            
            <button
              onClick={() => {
                console.log('🎤 Starting voice recording...');
                startRecording();
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              disabled={isRecording || !!audioBlob}
            >
              🎤 صوت
            </button>
            
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}