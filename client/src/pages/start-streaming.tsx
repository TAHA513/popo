import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}

export default function StartStreamingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [streamTitle, setStreamTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [appID, setAppID] = useState(1034062164);
  const [zg, setZg] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [roomID, setRoomID] = useState("");
  const [streamID, setStreamID] = useState("");

  useEffect(() => {
    // Load ZEGO SDK
    const script = document.createElement('script');
    script.src = 'https://download.zegocloud.com/sdk/latest/zego-express-video.min.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getAuthToken = async () => {
    try {
      const response = await fetch('/api/zego/token', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const data = await response.json();
      setAuthToken(data.token);
      setAppID(data.appId);
      setCurrentUserId(data.userId);
      return true;
    } catch (error) {
      setError('يجب تسجيل الدخول أولاً');
      setTimeout(() => window.location.href = '/login', 2000);
      return false;
    }
  };

  const nextStep = () => {
    if (!streamTitle.trim()) {
      setError('يرجى إدخال عنوان للبث');
      return;
    }
    setError("");
    setCurrentStep(2);
  };

  const setupCamera = async () => {
    setLoading(true);
    setError("");

    try {
      const authSuccess = await getAuthToken();
      if (!authSuccess) return;

      if (!window.ZegoExpressEngine) {
        throw new Error('ZEGO SDK لم يتم تحميله بعد');
      }

      const zegoEngine = new window.ZegoExpressEngine(appID, "wss://webliveroom-api.zegocloud.com/ws");
      setZg(zegoEngine);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 720 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      setLocalStream(stream);
      
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      if (localVideo) {
        localVideo.srcObject = stream;
      }

      setCurrentStep(3);
    } catch (error: any) {
      console.error('خطأ في تشغيل الكاميرا:', error);
      setError('فشل في الوصول للكاميرا. تأكد من السماح بالوصول للكاميرا والميكروفون.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !cameraEnabled;
        setCameraEnabled(newState);
        videoTrack.enabled = newState;
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !micEnabled;
        setMicEnabled(newState);
        audioTrack.enabled = newState;
      }
    }
  };

  const startLiveStream = async () => {
    setLoading(true);

    try {
      const newRoomID = `room_${currentUserId}_${Date.now()}`;
      const newStreamID = `stream_${currentUserId}_${Date.now()}`;
      
      setRoomID(newRoomID);
      setStreamID(newStreamID);

      await zg.loginRoom(newRoomID, { 
        userID: currentUserId, 
        userName: currentUserId 
      }, { token: authToken });

      await zg.startPublishingStream(newStreamID, localStream);
      
      setIsStreaming(true);
      setCurrentStep(4);
      
    } catch (error: any) {
      console.error('خطأ في بدء البث:', error);
      setError('فشل في بدء البث. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const endStream = async () => {
    if (confirm('هل تريد إنهاء البث المباشر؟')) {
      try {
        if (zg && isStreaming) {
          await zg.stopPublishingStream(streamID);
          await zg.logoutRoom(roomID);
        }
        
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        
        alert('تم إنهاء البث بنجاح');
        window.location.href = '/';
        
      } catch (error) {
        console.error('خطأ في إنهاء البث:', error);
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">🎥 ابدأ البث المباشر</h1>
        
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* خطوة 1: عنوان البث */}
        {currentStep === 1 && (
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-4">أدخل عنوان البث</h2>
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="مثال: بث مباشر مع الأصدقاء"
                maxLength={50}
                className="mb-4 text-center bg-white/90"
              />
              <p className="text-white/80 text-sm mb-6">اختر عنواناً جذاباً لبثك المباشر</p>
              <Button onClick={nextStep} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                التالي
              </Button>
            </CardContent>
          </Card>
        )}

        {/* خطوة 2: تجهيز الكاميرا */}
        {currentStep === 2 && (
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-4">تجهيز الكاميرا والصوت</h2>
              <p className="text-white/80 mb-6">اضغط على "السماح" عندما يطلب المتصفح إذن الكاميرا والميكروفون</p>
              <Button 
                onClick={setupCamera} 
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {loading ? 'جاري تشغيل الكاميرا...' : 'تشغيل الكاميرا'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* خطوة 3: معاينة الكاميرا */}
        {currentStep === 3 && (
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-4">معاينة الكاميرا</h2>
              
              <div className="relative mb-6 rounded-lg overflow-hidden max-w-md mx-auto">
                <video 
                  id="localVideo" 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full rounded-lg shadow-lg"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 rtl:space-x-reverse">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleCamera}
                    className={`rounded-full w-12 h-12 ${!cameraEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/80 hover:bg-white'}`}
                  >
                    {cameraEnabled ? '📹' : '📹❌'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleMic}
                    className={`rounded-full w-12 h-12 ${!micEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/80 hover:bg-white'}`}
                  >
                    {micEnabled ? '🎤' : '🎤❌'}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={startLiveStream} 
                disabled={loading}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-lg px-8 py-3"
              >
                {loading ? 'جاري بدء البث...' : '🔴 ابدأ البث المباشر'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* خطوة 4: البث المباشر */}
        {currentStep === 4 && (
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-2">{streamTitle}</h2>
              <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-6 animate-pulse">
                🔴 مباشر الآن
              </div>
              
              <div className="relative mb-6 rounded-lg overflow-hidden max-w-md mx-auto">
                <video 
                  id="streamVideo" 
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full rounded-lg shadow-lg"
                  style={{ transform: 'scaleX(-1)' }}
                  ref={(video) => {
                    if (video && localStream) {
                      video.srcObject = localStream;
                    }
                  }}
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 rtl:space-x-reverse">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleCamera}
                    className={`rounded-full w-12 h-12 ${!cameraEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/80 hover:bg-white'}`}
                  >
                    {cameraEnabled ? '📹' : '📹❌'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleMic}
                    className={`rounded-full w-12 h-12 ${!micEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/80 hover:bg-white'}`}
                  >
                    {micEnabled ? '🎤' : '🎤❌'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={endStream}
                    className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
                  >
                    ⏹️
                  </Button>
                </div>
              </div>
              
              <p className="text-white/80 text-sm">معرف الغرفة: {roomID}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}