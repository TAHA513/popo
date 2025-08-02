import React, { useState, useEffect } from 'react';
import { MeetingProvider } from '@videosdk.live/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import AudioRoom from '@/components/AudioRoom';
import { 
  Mic, 
  Users, 
  ArrowLeft,
  Plus,
  Radio
} from 'lucide-react';

// إعدادات VideoSDK - سيتم الحصول على التوكن من الخادم
const API_BASE_URL = 'https://api.videosdk.live/v2';

export default function AudioRoomPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<'join' | 'create' | 'room'>('join');
  const [meetingId, setMeetingId] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

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
    
    // استخدام token تجريبي في حالة الفشل
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiJmOTc5YTQ5YS1jMTIzLTQ0NTYtOTExZC1lNGNmYjc3YWJiY2YiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTcwNjg3NDE2NywiZXhwIjoxNzM4NDEwMTY3fQ.example';
  };

  // إنشاء غرفة جديدة
  const createRoom = async () => {
    if (!roomTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان للغرفة",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const authToken = await generateToken();
      
      // إنشاء meeting ID جديد
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
        setStep('room');
        
        toast({
          title: "تم إنشاء الغرفة",
          description: "تم إنشاء غرفة البث الصوتي بنجاح",
        });
      } else {
        throw new Error('فشل في إنشاء الغرفة');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الغرفة، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // الانضمام لغرفة موجودة
  const joinRoom = async () => {
    if (!meetingId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الغرفة",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const authToken = await generateToken();
      setToken(authToken);
      setStep('room');
      
      toast({
        title: "تم الانضمام",
        description: "جاري الانضمام للغرفة الصوتية",
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "خطأ",
        description: "فشل في الانضمام للغرفة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // مغادرة الغرفة
  const leaveRoom = () => {
    setStep('join');
    setMeetingId('');
    setToken('');
  };

  // إذا كان المستخدم في الغرفة
  if (step === 'room' && meetingId && token) {
    return (
      <MeetingProvider
        config={{
          meetingId,
          micEnabled: true,
          webcamEnabled: false, // البث صوتي فقط
          name: user?.firstName || user?.username || 'مشارك',
          multiStream: false,
        }}
        token={token}
      >
        <AudioRoom meetingId={meetingId} onLeave={leaveRoom} />
      </MeetingProvider>
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
          <h1 className="text-2xl font-bold text-gray-800">البث الصوتي</h1>
        </div>

        {step === 'join' && (
          <div className="space-y-6">
            {/* انضمام لغرفة موجودة */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Radio className="w-6 h-6 text-purple-600" />
                  انضمام لغرفة موجودة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="أدخل رقم الغرفة"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="text-center tracking-wider"
                />
                <Button
                  onClick={joinRoom}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Mic className="w-4 h-4 ml-2" />
                  {isLoading ? 'جاري الانضمام...' : 'انضمام للغرفة'}
                </Button>
              </CardContent>
            </Card>

            {/* إنشاء غرفة جديدة */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plus className="w-6 h-6 text-green-600" />
                  إنشاء غرفة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setStep('create')}
                  variant="outline"
                  className="w-full border-green-200 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء غرفة صوتية
                </Button>
              </CardContent>
            </Card>

            {/* معلومات */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">كيف يعمل البث الصوتي؟</p>
                    <ul className="space-y-1">
                      <li>• انضم أو أنشئ غرفة صوتية</li>
                      <li>• تحدث مع المشاركين الآخرين</li>
                      <li>• أرسل هدايا للمتحدثين</li>
                      <li>• استمتع بالمحادثات المباشرة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'create' && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setStep('join')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-xl">إنشاء غرفة صوتية</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الغرفة *
                </label>
                <Input
                  placeholder="مثال: غرفة الدردشة العامة"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف الغرفة
                </label>
                <Textarea
                  placeholder="اكتب وصفاً مختصراً للغرفة..."
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={createRoom}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Radio className="w-4 h-4 ml-2" />
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء والانضمام'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}