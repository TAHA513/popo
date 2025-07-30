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
  UserCheck
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
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Voice playback states
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Call states
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

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
    mutationFn: async (messageData: { recipientId: string; content: string }) => {
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

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        setAudioBlob(e.data);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      setRecordingInterval(interval);
    } catch (error) {
      toast({
        title: "خطأ في التسجيل",
        description: "لا يمكن الوصول إلى الميكروفون",
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

  // Call functions
  const startAudioCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setCallType('audio');
      setIsCallActive(true);
      
      toast({
        title: "بدء المكالمة الصوتية",
        description: "جاري الاتصال...",
      });
      
      // Simulate call connection after 2 seconds
      setTimeout(() => {
        toast({
          title: "تم الاتصال",
          description: "المكالمة الصوتية نشطة الآن",
        });
      }, 2000);
      
    } catch (error) {
      toast({
        title: "خطأ في المكالمة",
        description: "لا يمكن الوصول إلى الميكروفون",
        variant: "destructive"
      });
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      setLocalStream(stream);
      setCallType('video');
      setIsCallActive(true);
      
      toast({
        title: "بدء مكالمة الفيديو",
        description: "جاري الاتصال...",
      });
      
      // Simulate call connection after 2 seconds
      setTimeout(() => {
        toast({
          title: "تم الاتصال",
          description: "مكالمة الفيديو نشطة الآن",
        });
      }, 2000);
      
    } catch (error) {
      toast({
        title: "خطأ في مكالمة الفيديو",
        description: "لا يمكن الوصول إلى الكاميرا والميكروفون",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    setIsCallActive(false);
    setCallType('audio');
    
    toast({
      title: "انتهت المكالمة",
      description: "تم قطع الاتصال",
    });
  };

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
            className="p-2 hover:bg-green-50 hover:text-green-600"
            onClick={startAudioCall}
            disabled={isCallActive}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 hover:bg-blue-50 hover:text-blue-600"
            onClick={startVideoCall}
            disabled={isCallActive}
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Active Call Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                {callType === 'video' ? (
                  <Video className="w-10 h-10 text-white" />
                ) : (
                  <Phone className="w-10 h-10 text-white" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {otherUser?.firstName || otherUser?.username || 'مستخدم'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {callType === 'video' ? 'مكالمة فيديو نشطة' : 'مكالمة صوتية نشطة'}
              </p>
              
              {/* Local Video Preview for Video Calls */}
              {callType === 'video' && localStream && (
                <div className="mb-4">
                  <video
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                  />
                  <p className="text-sm text-gray-500 mt-2">الكاميرا الخاصة بك</p>
                </div>
              )}
              
              {/* Call Controls */}
              <div className="flex justify-center space-x-4 space-x-reverse">
                <Button
                  onClick={endCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
                >
                  إنهاء المكالمة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-sm">{message.content}</p>
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
              <div className="text-sm text-purple-800">رسالة صوتية جاهزة للإرسال</div>
            </div>
            <Button onClick={() => setAudioBlob(null)} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
            <Button onClick={() => {/* TODO: Send voice message */}} className="bg-purple-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : isRecording ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="flex-1 bg-red-50 rounded-lg p-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-800 text-sm">جاري التسجيل... {recordingTime}s</span>
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

      <BottomNavigation />
    </div>
  );
}