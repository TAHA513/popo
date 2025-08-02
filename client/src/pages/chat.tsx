import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  X,
  Phone,
  Video,
  MoreVertical,
  UserCheck,
  Gift,
  UserPlus,
  Settings,
  MessageSquare,
  Info
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GiftShop } from "@/components/gift-shop";
import { InvitePeopleModal } from "@/components/invite-people-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: number;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'voice';
  isRead: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Extract user ID from URL /messages/chat/:userId
  const otherUserId = location.split('/messages/chat/')[1];
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Message states
  const [newMessage, setNewMessage] = useState("");
  
  // Gift system states
  const [showGiftShop, setShowGiftShop] = useState(false);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Voice playback states
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Validate user ID
  if (!otherUserId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">خطأ في الرابط</h1>
          <p className="text-gray-600">لم يتم العثور على معرف المستخدم في الرابط</p>
          <Button onClick={() => setLocation('/messages')} className="mt-4">
            العودة إلى الرسائل
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Fetch other user info
  const { data: otherUser } = useQuery({
    queryKey: [`/api/users/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/messages/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    refetchInterval: 2000 // Refresh every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { recipientId: string; content: string; messageType?: string }) => {
      return await apiRequest('/api/messages/send', 'POST', messageData);
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

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/messages/${otherUserId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    }
  });

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      recipientId: otherUserId,
      content: newMessage.trim()
    });
  };

  // Handle send voice message
  const handleSendVoiceMessage = () => {
    if (!audioBlob) {
      toast({
        title: "خطأ",
        description: "لا توجد رسالة صوتية للإرسال",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (limit to 1MB to avoid server issues)
    if (audioBlob.size > 1 * 1024 * 1024) {
      toast({
        title: "ملف كبير جداً",
        description: "الرسالة الصوتية كبيرة جداً. حاول تسجيل رسالة أقصر",
        variant: "destructive"
      });
      return;
    }
    
    // Convert audio blob to base64 for transmission
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64Audio = reader.result as string;
        
        sendMessageMutation.mutate({
          recipientId: otherUserId,
          content: base64Audio, // Store base64 audio data as content
          messageType: 'voice'
        }, {
          onSuccess: () => {
            // Clear the audio blob after successful sending
            setAudioBlob(null);
            toast({
              title: "تم الإرسال",
              description: "تم إرسال الرسالة الصوتية بنجاح",
            });
          },
          onError: (error) => {
            console.error('Voice message send error:', error);
            toast({
              title: "فشل الإرسال",
              description: "حدث خطأ أثناء إرسال الرسالة الصوتية. حاول مرة أخرى",
              variant: "destructive"
            });
          }
        });
      } catch (error) {
        console.error('FileReader error:', error);
        toast({
          title: "خطأ في المعالجة",
          description: "حدث خطأ أثناء معالجة الملف الصوتي",
          variant: "destructive"
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "خطأ في القراءة",
        description: "لا يمكن قراءة الملف الصوتي",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(audioBlob);
  };

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Lower sample rate to reduce file size
          channelCount: 1,   // Mono audio
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Use lower bitrate to reduce file size
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000 // Lower bitrate for smaller files
      };
      
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback to default if the options are not supported
        recorder = new MediaRecorder(stream);
      }
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioBlob(e.data);
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 15) { // Reduced max recording time to 15 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      setRecordingInterval(interval);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "خطأ في التسجيل",
        description: "لا يمكن الوصول إلى الميكروفون أو المتصفح لا يدعم التسجيل",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream?.getTracks().forEach(track => track.stop());
    }
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setMediaRecorder(null);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
  };

  // Handle voice message playback
  const playVoiceMessage = (messageId: number, audioData: string) => {
    // If already playing this message, pause it
    if (playingMessageId === messageId && audioElement && !audioElement.paused) {
      audioElement.pause();
      setPlayingMessageId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // Create new audio element and play
    const audio = new Audio(audioData);
    audio.onplay = () => setPlayingMessageId(messageId);
    audio.onended = () => setPlayingMessageId(null);
    audio.onerror = () => {
      setPlayingMessageId(null);
      toast({
        title: "خطأ في التشغيل", 
        description: "لا يمكن تشغيل الرسالة الصوتية",
        variant: "destructive"
      });
    };

    setAudioElement(audio);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast({
        title: "خطأ في التشغيل",
        description: "لا يمكن تشغيل الرسالة الصوتية", 
        variant: "destructive"
      });
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when page loads
  useEffect(() => {
    if (messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [messages.length]);

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* No SimpleNavigation - Custom header only */}
      
      {/* Chat Header */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/messages')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <img
              src={otherUser?.profileImageUrl || '/uploads/default-avatar.png'}
              alt={otherUser?.username || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-gray-800">
                {otherUser?.firstName || otherUser?.username || 'مستخدم'}
              </h2>
              <p className="text-sm text-gray-500">@{otherUser?.username}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 text-pink-600 hover:bg-pink-50"
            onClick={() => setShowGiftShop(true)}
          >
            <Gift className="w-5 h-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 ml-2" />
                دعوة أشخاص
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "معلومات المحادثة",
                  description: "عرض معلومات تفصيلية عن المحادثة",
                });
              }}>
                <Info className="w-4 h-4 ml-2" />
                معلومات المحادثة
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "إعدادات الدردشة",
                  description: "تخصيص إعدادات المحادثة",
                });
              }}>
                <Settings className="w-4 h-4 ml-2" />
                إعدادات الدردشة
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "أرشيف الرسائل",
                  description: "عرض الرسائل المؤرشفة",
                });
              }}>
                <MessageSquare className="w-4 h-4 ml-2" />
                أرشيف الرسائل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">لا توجد رسائل بعد</div>
            <div className="text-sm text-gray-400 mt-2">ابدأ المحادثة بإرسال رسالة</div>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {message.messageType === 'voice' ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      onClick={() => playVoiceMessage(message.id, message.content)}
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${
                        message.senderId === user?.id
                          ? 'text-white hover:bg-white/20'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {playingMessageId === message.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className={`text-xs ${
                        message.senderId === user?.id ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        رسالة صوتية
                      </div>
                      <div className={`w-16 h-1 rounded-full mt-1 ${
                        message.senderId === user?.id ? 'bg-white/30' : 'bg-gray-300'
                      }`}>
                        <div className={`h-full rounded-full ${
                          message.senderId === user?.id ? 'bg-white' : 'bg-purple-600'
                        } w-0`}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${
                    message.senderId === user?.id ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('ar', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.senderId === user?.id && (
                    <UserCheck className={`w-3 h-3 ml-1 ${
                      message.isRead ? 'text-purple-200' : 'text-purple-300'
                    }`} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        {audioBlob ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="flex-1 bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-800">
                {sendMessageMutation.isPending ? "جاري الإرسال..." : "رسالة صوتية جاهزة للإرسال"}
              </div>
            </div>
            <Button 
              onClick={() => setAudioBlob(null)} 
              variant="ghost" 
              size="sm"
              disabled={sendMessageMutation.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleSendVoiceMessage} 
              className="bg-purple-600" 
              disabled={sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : isRecording ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="flex-1 bg-red-50 rounded-lg p-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-800 text-sm">جاري التسجيل... {recordingTime}s / 15s</span>
            </div>
            <Button onClick={cancelRecording} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
            <Button onClick={stopRecording} className="bg-red-600">
              <MicOff className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={startRecording} variant="ghost" size="sm">
              <Mic className="w-5 h-5" />
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Gift Shop Modal */}
      {showGiftShop && otherUser && (
        <GiftShop
          isOpen={showGiftShop}
          onClose={() => setShowGiftShop(false)}
          receiverId={otherUser.id}
          receiverName={otherUser.firstName || otherUser.username}
          onGiftSent={(gift) => {
            console.log('Gift sent:', gift);
          }}
        />
      )}

      {/* Invite People Modal */}
      <InvitePeopleModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        currentChatUserId={otherUserId}
      />

      <BottomNavigation />
    </div>
  );
}