import React, { useState, useEffect } from 'react';
import { MeetingProvider } from '@videosdk.live/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import AudioRoom from '@/components/AudioRoom';
import { 
  ArrowLeft,
  Radio
} from 'lucide-react';

export default function AudioRoomPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [meetingId, setMeetingId] = useState('');
  const [roomTitle] = useState(`بث ${user?.firstName || user?.username || 'مستخدم'} المباشر`);
  const [roomDescription] = useState('غرفة صوتية مباشرة');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // بدء البث تلقائياً عند تحميل الصفحة
  useEffect(() => {
    if (user && !isInitialized) {
      startLiveBroadcast();
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // بدء البث المباشر
  const startLiveBroadcast = async () => {
    setIsLoading(true);
    try {
      const authToken = await generateToken();
      
      // إنشاء meeting ID جديد للبث المباشر
      const response = await fetch('/api/videosdk/create-meeting', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title: roomTitle,
          description: roomDescription,
          hostId: user?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMeetingId(data.meetingId);
        setToken(authToken);
        
        toast({
          title: "🎙️ بث مباشر",
          description: "تم بدء البث الصوتي المباشر بنجاح!",
        });
      } else {
        throw new Error('فشل في بدء البث');
      }
    } catch (error) {
      console.error('Error starting live broadcast:', error);
      toast({
        title: "خطأ في البث",
        description: "فشل في بدء البث المباشر، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء token للمقابلة
  const generateToken = async () => {
    try {
      const response = await fetch('/api/videosdk/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      console.error('Error generating token:', error);
    }
    
    throw new Error('فشل في إنشاء التوكن');
  };

  // مغادرة الغرفة
  const leaveRoom = () => {
    setMeetingId('');
    setToken('');
    setLocation('/home');
  };

  // إذا كان المستخدم في الغرفة
  if (meetingId && token && !isLoading) {
    return (
      <MeetingProvider
        config={{
          meetingId,
          micEnabled: true,
          webcamEnabled: false, // البث صوتي فقط
          name: user?.firstName || user?.username || 'مشارك',
          multiStream: false,
          mode: 'CONFERENCE', // وضع المؤتمر للصوت
          preferredProtocol: 'UDP_OVER_TCP',
        }}
        token={token}
        reinitialiseMeetingOnConfigChange={true}
        joinWithoutUserInteraction={true}
      >
        <AudioRoom meetingId={meetingId} onLeave={leaveRoom} />
      </MeetingProvider>
    );
  }

  // شاشة التحميل أثناء بدء البث
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <h2 className="text-xl font-bold text-gray-800">🎙️ بدء البث المباشر</h2>
            <p className="text-gray-600">جاري إعداد الغرفة الصوتية...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* رأس الصفحة */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/home')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">🎙️ البث المباشر</h1>
        </div>

        {/* رسالة انتظار البث */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Radio className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">جاري إعداد البث المباشر</h2>
              <p className="text-gray-600">سيتم بدء البث الصوتي تلقائياً...</p>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-600">عنوان البث:</p>
                <p className="font-semibold">{roomTitle}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-600">الوصف:</p>
                <p className="font-semibold">{roomDescription}</p>
              </div>
            </div>

            <Button
              onClick={startLiveBroadcast}
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              <Radio className="w-4 h-4 ml-2" />
              {isLoading ? 'جاري البدء...' : 'بدء البث الآن'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}