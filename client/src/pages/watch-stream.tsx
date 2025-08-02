import React, { useState, useEffect } from 'react';
import { MeetingProvider, useMeeting } from '@videosdk.live/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useParams } from 'wouter';
import { 
  ArrowLeft,
  Users,
  Volume2,
  VolumeX,
  Radio,
  Heart
} from 'lucide-react';

// مكون مشاهدة البث
function StreamViewer({ meetingId, onLeave }: { meetingId: string; onLeave: () => void }) {
  const { join, leave, participants, enableMic, disableMic, localMicOn } = useMeeting({
    onMeetingJoined: () => {
      console.log('🎧 Joined as viewer successfully');
    },
    onMeetingLeft: () => {
      console.log('👋 Left viewing session');
      onLeave();
    },
    onParticipantJoined: (participant) => {
      console.log('👤 Participant joined viewing:', participant.displayName);
    },
    onParticipantLeft: (participant) => {
      console.log('👋 Participant left viewing:', participant.displayName);
    },
  });
  
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isJoined) {
      join();
      setIsJoined(true);
    }
  }, [join, isJoined]);

  const handleLeave = () => {
    leave();
    onLeave();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const participantsList = [...participants.values()];
  const hostParticipant = participantsList.find(p => p.isLocal === false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* رأس الصفحة */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLeave}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">بث مباشر</span>
          </div>
        </div>

        {/* معلومات البث */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Radio className="w-6 h-6 text-red-500" />
              {hostParticipant?.displayName || 'مذيع البث'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {participantsList.length} مستمع
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">متصل</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* عناصر تحكم الصوت */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {isMuted ? (
                  <VolumeX className="w-10 h-10 text-white" />
                ) : (
                  <Volume2 className="w-10 h-10 text-white" />
                )}
              </div>
              
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "default"}
                className="w-full"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 ml-2" />
                    تشغيل الصوت
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 ml-2" />
                    كتم الصوت
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* قائمة المشاركين */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              المستمعون ({participantsList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participantsList.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{participant.displayName}</span>
                  <div className="flex items-center gap-2">
                    {participant.isLocal && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">أنت</span>
                    )}
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WatchStreamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const streamId = params.streamId;
  
  const [token, setToken] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (streamId) {
      joinStream();
    }
  }, [streamId]);

  const joinStream = async () => {
    setIsLoading(true);
    try {
      // الحصول على معلومات البث
      const streamResponse = await fetch(`/api/streams/${streamId}`, {
        credentials: 'include'
      });
      
      if (!streamResponse.ok) {
        throw new Error('البث غير موجود أو منتهي');
      }
      
      const stream = await streamResponse.json();
      setStreamInfo(stream);
      setMeetingId(stream.meetingId);

      // الحصول على التوكن
      const tokenResponse = await fetch('/api/videosdk/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        setToken(data.token);
        
        toast({
          title: "🎧 انضمام للبث",
          description: "تم الانضمام للبث الصوتي بنجاح",
        });
      } else {
        throw new Error('فشل في الحصول على التوكن');
      }
    } catch (error) {
      console.error('Error joining stream:', error);
      toast({
        title: "خطأ",
        description: "فشل في الانضمام للبث",
        variant: "destructive"
      });
      setLocation('/home');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveStream = () => {
    setLocation('/home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <h2 className="text-xl font-bold text-gray-800">🎧 الانضمام للبث</h2>
            <p className="text-gray-600">جاري الاتصال بالبث الصوتي...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!meetingId || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">❌ البث غير متاح</h2>
            <p className="text-gray-600">البث المطلوب غير موجود أو انتهى</p>
            <Button onClick={() => setLocation('/home')}>
              العودة للرئيسية
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: false, // المشاهد لا يحتاج مايك
        webcamEnabled: false,
        name: user?.firstName || user?.username || 'مستمع',
        multiStream: false,
        mode: 'VIEWER', // وضع المشاهدة فقط
        preferredProtocol: 'UDP_OVER_TCP',
      }}
      token={token}
      reinitialiseMeetingOnConfigChange={true}
      joinWithoutUserInteraction={true}
    >
      <StreamViewer meetingId={meetingId} onLeave={leaveStream} />
    </MeetingProvider>
  );
}