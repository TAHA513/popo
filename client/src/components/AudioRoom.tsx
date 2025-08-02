import React, { useState, useEffect, useRef } from 'react';
import { useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Users, 
  Phone, 
  PhoneOff,
  Gift,
  Heart,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AudioRoomProps {
  meetingId: string;
  onLeave: () => void;
}

// مكون المشارك الفردي
function ParticipantView({ participantId }: { participantId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    displayName,
    micOn,
    isLocal,
    micStream,
    setQuality
  } = useParticipant(participantId);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && micStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      audioRef.current.srcObject = mediaStream;
      audioRef.current.play().catch(console.error);
    }
  }, [micStream]);

  const sendGift = async () => {
    try {
      // إرسال هدية للمشارك
      const response = await fetch('/api/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: participantId,
          giftId: 1, // هدية قلب صغيرة
          amount: 10
        })
      });
      
      if (response.ok) {
        toast({
          title: "تم إرسال الهدية",
          description: `تم إرسال هدية إلى ${displayName}`,
        });
      }
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  return (
    <Card className="m-2 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                micOn ? 'bg-green-500' : 'bg-red-500'
              } text-white`}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </div>
              {isLocal && (
                <Badge className="absolute -top-1 -right-1 bg-blue-500 text-xs">أنت</Badge>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{displayName || 'مشارك'}</p>
              <p className="text-sm text-gray-600">
                {micOn ? 'يتحدث الآن' : 'صامت'}
              </p>
            </div>
          </div>
          
          {!isLocal && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={sendGift}
                className="text-pink-600 border-pink-200 hover:bg-pink-50"
              >
                <Gift className="w-4 h-4 ml-1" />
                هدية
              </Button>
            </div>
          )}
        </div>
        
        {/* مشغل الصوت للمشاركين الآخرين */}
        {!isLocal && (
          <audio ref={audioRef} autoPlay playsInline />
        )}
      </CardContent>
    </Card>
  );
}

// المكون الرئيسي لغرفة البث الصوتي
export default function AudioRoom({ meetingId, onLeave }: AudioRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHost, setIsHost] = useState(false);
  const [roomTitle, setRoomTitle] = useState('غرفة صوتية');
  
  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    participants,
    localMicOn,
    localWebcamOn,
    meetingId: currentMeetingId,
    presenterId
  } = useMeeting({
    onMeetingJoined: () => {
      console.log('تم الانضمام للغرفة الصوتية');
      toast({
        title: "مرحباً بك",
        description: "تم الانضمام للغرفة الصوتية بنجاح",
      });
    },
    onMeetingLeft: () => {
      console.log('تم مغادرة الغرفة');
      onLeave();
    },
    onParticipantJoined: (participant) => {
      console.log('انضم مشارك جديد:', participant.displayName);
      toast({
        title: "مشارك جديد",
        description: `انضم ${participant.displayName} للغرفة`,
      });
    },
    onParticipantLeft: (participant) => {
      console.log('غادر مشارك:', participant.displayName);
      toast({
        title: "مشارك غادر",
        description: `غادر ${participant.displayName} الغرفة`,
      });
    }
  });

  useEffect(() => {
    // الانضمام التلقائي عند تحميل المكون
    join();
    // تحديد ما إذا كان المستخدم مضيف الغرفة
    setIsHost(user?.id === presenterId);
  }, [join, user, presenterId]);

  const handleLeaveRoom = () => {
    leave();
  };

  const participantsList = [...participants.keys()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* رأس الغرفة */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              {roomTitle}
            </CardTitle>
            <div className="flex justify-center items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-5 h-5" />
                <span>{participantsList.length} مشارك</span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                مباشر
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* أدوات التحكم */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleMic}
                variant={localMicOn ? "default" : "destructive"}
                size="lg"
                className="flex items-center gap-2"
              >
                {localMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                {localMicOn ? 'إيقاف الميكروفون' : 'تشغيل الميكروفون'}
              </Button>
              
              <Button
                onClick={handleLeaveRoom}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                مغادرة الغرفة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* قائمة المشاركين */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">المشاركين في الغرفة</CardTitle>
          </CardHeader>
          <CardContent>
            {participantsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد مشاركين في الغرفة حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participantsList.map((participantId) => (
                  <ParticipantView
                    key={participantId}
                    participantId={participantId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}