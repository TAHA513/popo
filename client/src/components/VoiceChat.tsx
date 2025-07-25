import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Users } from "lucide-react";

interface VoiceChatProps {
  isActive: boolean;
  playerCount: number;
  onToggle: () => void;
}

export default function VoiceChat({ isActive, playerCount, onToggle }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isActive) {
      startVoiceChat();
      // Simulate connected users
      setConnectedUsers(['أحمد', 'فاطمة', 'محمد']);
    } else {
      stopVoiceChat();
      setConnectedUsers([]);
    }

    return () => {
      stopVoiceChat();
    };
  }, [isActive]);

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setAudioStream(stream);
      console.log('تم تفعيل الدردشة الصوتية بنجاح');
    } catch (error) {
      console.error('خطأ في الوصول للميكروفون:', error);
      alert('لا يمكن الوصول للميكروفون. تأكد من السماح بالوصول للميكروفون.');
    }
  };

  const stopVoiceChat = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  const toggleMute = () => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    if (audioRef.current) {
      audioRef.current.muted = !isDeafened;
    }
  };

  if (!isActive) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <MicOff className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">الدردشة الصوتية غير مفعلة</span>
          </div>
          <Button
            onClick={onToggle}
            size="sm"
            className="bg-green-500 hover:bg-green-600"
          >
            تفعيل الصوت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-semibold">الدردشة الصوتية مفعلة</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 space-x-reverse text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{playerCount} لاعبين</span>
        </div>
      </div>

      {/* Connected Users */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-2">المتصلون:</div>
        <div className="flex flex-wrap gap-2">
          {connectedUsers.map((user, index) => (
            <div key={index} className="flex items-center space-x-1 space-x-reverse bg-white px-2 py-1 rounded-full text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{user}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex space-x-2 space-x-reverse">
        <Button
          onClick={toggleMute}
          size="sm"
          variant={isMuted ? "destructive" : "default"}
          className="flex-1"
        >
          <div className="flex items-center space-x-1 space-x-reverse">
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'كتم الصوت' : 'الميكروفون'}</span>
          </div>
        </Button>

        <Button
          onClick={toggleDeafen}
          size="sm"
          variant={isDeafened ? "destructive" : "default"}
          className="flex-1"
        >
          <div className="flex items-center space-x-1 space-x-reverse">
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isDeafened ? 'كتم السماع' : 'السماعات'}</span>
          </div>
        </Button>

        <Button
          onClick={onToggle}
          size="sm"
          variant="outline"
        >
          إنهاء
        </Button>
      </div>

      {/* Audio visualization */}
      <div className="mt-3 flex items-center justify-center space-x-1 space-x-reverse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-green-500 rounded-full transition-all duration-300 ${
              !isMuted && audioStream ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${Math.random() * 20 + 8}px`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      <audio ref={audioRef} autoPlay />
    </div>
  );
}