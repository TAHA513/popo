import React, { useState, useEffect } from 'react';
import { useMeeting } from '@videosdk.live/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Users, 
  PhoneOff,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';

interface AudioRoomProps {
  meetingId: string;
  onLeave: () => void;
}

export default function AudioRoom({ meetingId, onLeave }: AudioRoomProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [participantsList, setParticipantsList] = useState<any[]>([]);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  const { join, leave, toggleMic, participants, localMicOn, unmuteMic, muteMic } = useMeeting({
    onMeetingJoined: () => {
      console.log('✅ Joined audio room successfully');
      // تفعيل المايك فور الانضمام
      setTimeout(() => {
        if (!localMicOn) {
          unmuteMic();
          console.log('🎤 Force unmuted microphone after joining');
        }
      }, 1000);
    },
    onMeetingLeft: () => {
      console.log('👋 Left audio room');
      onLeave();
    },
    onParticipantJoined: (participant) => {
      console.log('👤 Participant joined:', participant.displayName);
    },
    onParticipantLeft: (participant) => {
      console.log('👋 Participant left:', participant.displayName);
    },
    onMicRequested: (data) => {
      console.log('🎤 Mic requested:', data);
    },
    onWebcamRequested: (data) => {
      console.log('📹 Webcam requested:', data);
    },
    onError: (error) => {
      console.error('❌ Meeting error:', error);
    }
  });

  // طلب إذن المايك أولاً
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('🎤 Microphone permission granted');
        setMicPermissionGranted(true);
        // إغلاق الستريم المؤقت
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('❌ Microphone permission denied:', error);
        setMicPermissionGranted(false);
      }
    };
    
    requestMicPermission();
  }, []);

  // الانضمام للغرفة بعد الحصول على إذن المايك وتفعيل المايك تلقائياً
  useEffect(() => {
    if (micPermissionGranted && !isJoined) {
      join();
      setIsJoined(true);
      // تفعيل المايك تلقائياً بعد الانضمام
      setTimeout(() => {
        unmuteMic();
        console.log('🎤 Auto-unmuted microphone after joining');
      }, 2000);
    }
  }, [micPermissionGranted, isJoined, join, unmuteMic]);

  useEffect(() => {
    const participantsArray = Array.from(participants?.values() || []);
    setParticipantsList(participantsArray);
  }, [participants]);

  const handleLeaveMeeting = () => {
    leave();
  };

  const handleToggleMic = async () => {
    try {
      if (localMicOn) {
        muteMic();
        console.log('🔇 Mic disabled');
      } else {
        if (!micPermissionGranted) {
          // إعادة طلب إذن المايك
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 2
              }
            });
            console.log('🎤 New microphone permission granted');
            stream.getTracks().forEach(track => track.stop());
            setMicPermissionGranted(true);
          } catch (permError) {
            console.error('❌ Microphone permission failed:', permError);
            return;
          }
        }
        
        // تفعيل المايك مع تأخير قصير
        setTimeout(() => {
          unmuteMic();
          console.log('🎤 Mic enabled with audio configuration');
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error toggling microphone:', error);
      alert('لا يمكن الوصول للمايك. يرجى السماح للموقع باستخدام المايك من إعدادات المتصفح.');
    }
  };

  // عرض رسالة تحذيرية إذا لم يتم منح إذن المايك
  if (!micPermissionGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-red-600">
              <MicOff className="w-6 h-6" />
              مطلوب إذن المايك
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              يحتاج البث الصوتي إلى الوصول للمايك. يرجى السماح للموقع باستخدام المايك من إعدادات المتصفح.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* رأس الغرفة */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <Radio className="w-6 h-6 text-red-500" />
              بث صوتي مباشر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {participantsList.length} مشارك
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">متصل</span>
                {!localMicOn && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-orange-600">المايك مغلق</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* عناصر التحكم */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {localMicOn ? (
                  <Mic className="w-12 h-12 text-white" />
                ) : (
                  <MicOff className="w-12 h-12 text-white" />
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleToggleMic}
                  variant={localMicOn ? "default" : "destructive"}
                  size="lg"
                  className="w-full"
                >
                  {localMicOn ? (
                    <>
                      <Mic className="w-5 h-5 ml-2" />
                      المايك يعمل - اضغط لإيقافه
                    </>
                  ) : (
                    <>
                      <MicOff className="w-5 h-5 ml-2" />
                      المايك متوقف - اضغط لتشغيله
                    </>
                  )}
                </Button>
                
                {!localMicOn && (
                  <Button
                    onClick={() => {
                      console.log('🔄 Force activating microphone...');
                      unmuteMic();
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Mic className="w-5 h-5 ml-2" />
                    فرض تشغيل المايك
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleLeaveMeeting}
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                  >
                    <PhoneOff className="w-5 h-5 ml-2" />
                    إنهاء البث
                  </Button>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    إعادة تشغيل
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* قائمة المشاركين */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              المشاركون ({participantsList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participantsList.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">لا يوجد مشاركون حالياً</p>
                </div>
              ) : (
                participantsList.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {participant.displayName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{participant.displayName}</h4>
                        <div className="flex items-center gap-2">
                          {participant.isLocal && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">أنت</span>
                          )}
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">متصل</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {participant.micOn ? (
                        <Volume2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}