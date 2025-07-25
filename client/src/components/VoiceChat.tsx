import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Users } from "lucide-react";

interface VoiceChatProps {
  gameRoomId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VoiceChatParticipant {
  id: string;
  userId: string;
  isMuted: boolean;
  isDeafened: boolean;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

export default function VoiceChat({ gameRoomId, isOpen, onClose }: VoiceChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [voiceChatRoomId, setVoiceChatRoomId] = useState<string | null>(null);
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Join voice chat mutation
  const joinVoiceChatMutation = useMutation({
    mutationFn: () => apiRequest(`/api/voice-chat/${gameRoomId}/join`, 'POST', {}),
    onSuccess: (data) => {
      setVoiceChatRoomId(data.id);
      setIsConnected(true);
      initializeVoiceChat();
      toast({
        title: "🎤 انضممت للمحادثة الصوتية",
        description: "يمكنك الآن التحدث مع اللاعبين الآخرين",
      });
    },
    onError: (error: any) => {
      console.error('Failed to join voice chat:', error);
      toast({
        title: "خطأ في المحادثة الصوتية",
        description: error.message || "فشل في الانضمام للمحادثة الصوتية",
        variant: "destructive",
      });
    },
  });

  // Leave voice chat mutation
  const leaveVoiceChatMutation = useMutation({
    mutationFn: () => apiRequest(`/api/voice-chat/${voiceChatRoomId}/leave`, 'POST', {}),
    onSuccess: () => {
      cleanupVoiceChat();
      onClose();
      toast({
        title: "📱 غادرت المحادثة الصوتية",
        description: "تم قطع الاتصال بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('Failed to leave voice chat:', error);
    },
  });

  // Toggle mute mutation
  const toggleMuteMutation = useMutation({
    mutationFn: (muted: boolean) => 
      apiRequest(`/api/voice-chat/${voiceChatRoomId}/mute`, 'POST', { isMuted: muted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/voice-chat/${voiceChatRoomId}/participants`] });
    },
  });

  // Get voice chat participants
  const { data: participants = [] } = useQuery<VoiceChatParticipant[]>({
    queryKey: [`/api/voice-chat/${voiceChatRoomId}/participants`],
    enabled: !!voiceChatRoomId && isConnected,
    refetchInterval: 3000,
  });

  const initializeVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      setLocalStream(stream);
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Don't play back our own audio
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "خطأ في الميكروفون",
        description: "لا يمكن الوصول إلى الميكروفون. تأكد من إعطاء الإذن.",
        variant: "destructive",
      });
    }
  };

  const cleanupVoiceChat = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    remoteAudiosRef.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudiosRef.current.clear();
    
    setIsConnected(false);
    setVoiceChatRoomId(null);
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    
    if (voiceChatRoomId) {
      toggleMuteMutation.mutate(newMutedState);
    }
  };

  const handleToggleDeafen = () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    
    // Mute all remote audio elements
    remoteAudiosRef.current.forEach(audio => {
      audio.muted = newDeafenedState;
    });
  };

  const handleLeaveVoiceChat = () => {
    if (voiceChatRoomId) {
      leaveVoiceChatMutation.mutate();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && !isConnected) {
      joinVoiceChatMutation.mutate();
    }
    
    return () => {
      cleanupVoiceChat();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-purple-600 mb-2">🎤 المحادثة الصوتية</h3>
          <p className="text-gray-600">تحدث مع اللاعبين الآخرين أثناء اللعب</p>
        </div>

        {/* Connection Status */}
        <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium">
              {isConnected ? "متصل" : "غير متصل"}
            </span>
          </div>
        </div>

        {/* Participants List */}
        <div className="mb-6">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center space-x-2 space-x-reverse">
            <Users className="w-4 h-4" />
            <span>المشاركون ({participants.length})</span>
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {participants.map((participant) => {
              const displayName = participant.user?.firstName || participant.user?.username || 'مستخدم';
              const isCurrentUser = participant.userId === user?.id;
              
              return (
                <div 
                  key={participant.id}
                  className={`flex items-center space-x-3 space-x-reverse p-2 rounded-lg ${
                    isCurrentUser ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {displayName} {isCurrentUser && '(أنت)'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {participant.isMuted && (
                      <MicOff className="w-4 h-4 text-red-500" />
                    )}
                    {participant.isDeafened && (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Controls */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            onClick={handleToggleMute}
            variant={isMuted ? "destructive" : "outline"}
            className="flex flex-col items-center space-y-1 h-16"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            <span className="text-xs">{isMuted ? "مكتوم" : "ميكروفون"}</span>
          </Button>
          
          <Button
            onClick={handleToggleDeafen}
            variant={isDeafened ? "destructive" : "outline"}
            className="flex flex-col items-center space-y-1 h-16"
          >
            {isDeafened ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            <span className="text-xs">{isDeafened ? "صامت" : "صوت"}</span>
          </Button>
          
          <Button
            onClick={handleLeaveVoiceChat}
            variant="destructive"
            className="flex flex-col items-center space-y-1 h-16"
            disabled={leaveVoiceChatMutation.isPending}
          >
            <PhoneOff className="w-6 h-6" />
            <span className="text-xs">مغادرة</span>
          </Button>
        </div>

        {/* Audio Elements */}
        <audio ref={localAudioRef} autoPlay muted />
        
        {/* Instructions */}
        <div className="text-center text-xs text-gray-500">
          <p>اضغط على الميكروفون لكتم/إلغاء كتم الصوت</p>
          <p>اضغط على السماعة لكتم/إلغاء كتم الأصوات الأخرى</p>
        </div>
      </div>
    </div>
  );
}