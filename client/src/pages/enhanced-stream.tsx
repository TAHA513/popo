import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Mic, MicOff, Plus, Users, Eye, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import EnhancedStreamInterface from "@/components/EnhancedStreamInterface";

export default function EnhancedStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const startEnhancedStream = async () => {
    if (!streamTitle.trim()) {
      setError("يرجى إدخال عنوان للبث");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Starting Enhanced Live Stream...');

      // إنشاء البث في قاعدة البيانات
      const streamData = {
        title: streamTitle,
        description: streamDescription || 'بث مباشر محدث',
        category: 'بث محدث',
        zegoRoomId: `room_${user?.id}_${Date.now()}`,
        zegoStreamId: `stream_${user?.id}_${Date.now()}`
      };

      const response = await apiRequest('/api/streams', 'POST', streamData);

      if (response?.data) {
        setCurrentStreamId(response.data.id);
        setCurrentStream(response.data);
        setIsStreaming(true);
        console.log("✅ Enhanced Stream Created Successfully!");
      } else {
        throw new Error('فشل في إنشاء البث');
      }
    } catch (error) {
      console.error("❌ Enhanced stream failed:", error);
      setError(error instanceof Error ? error.message : "فشل في بدء البث");
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    try {
      if (currentStreamId) {
        await apiRequest('/api/streams/end-all', 'POST');
        cleanup();
        setLocation('/');
      }
    } catch (error) {
      console.error("Failed to stop stream:", error);
      cleanup();
      setLocation('/');
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCurrentStreamId(null);
    setCurrentStream(null);
    setStreamTitle("");
    setStreamDescription("");
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">تسجيل الدخول مطلوب</h2>
            <p className="text-white/80 mb-6">يجب تسجيل الدخول لبدء البث المباشر</p>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isStreaming && currentStream) {
    return <EnhancedStreamInterface stream={currentStream} isStreamer={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            🎥 بث مباشر محدث
          </CardTitle>
          <p className="text-white/80 text-lg">
            ابدأ بثك المباشر بواجهة احترافية مع عداد الوقت الحقيقي
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-100 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">عنوان البث *</label>
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="أدخل عنوان جذاب لبثك..."
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-lg p-4"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">وصف البث (اختياري)</label>
              <Textarea
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                placeholder="اكتب وصف قصير عن محتوى البث..."
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 min-h-24 text-lg p-4"
                maxLength={300}
              />
            </div>
          </div>

          {/* معاينة إعدادات البث */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <Eye className="w-5 h-5 ml-2" />
              معاينة إعدادات البث
            </h3>
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 bg-black/50 rounded-lg object-cover mb-4"
            />

            <div className="flex justify-center space-x-4 rtl:space-x-reverse">
              <Button
                onClick={toggleVideo}
                variant="ghost"
                className={`flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-full ${
                  isVideoEnabled 
                    ? 'bg-green-600/20 text-green-300 border border-green-500/50' 
                    : 'bg-red-600/20 text-red-300 border border-red-500/50'
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
                <span>{isVideoEnabled ? 'الكاميرا مُفعلة' : 'الكاميرا مُغلقة'}</span>
              </Button>

              <Button
                onClick={toggleAudio}
                variant="ghost"
                className={`flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-full ${
                  isAudioEnabled 
                    ? 'bg-green-600/20 text-green-300 border border-green-500/50' 
                    : 'bg-red-600/20 text-red-300 border border-red-500/50'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
                <span>{isAudioEnabled ? 'المايك مُفعل' : 'المايك مُغلق'}</span>
              </Button>
            </div>
          </div>

          {/* مميزات البث المحدث */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-white font-bold text-lg mb-3">✨ مميزات البث المحدث</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/90 text-sm">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>عداد وقت حقيقي دقيق</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>واجهة كاملة الشاشة</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>أزرار تفاعلية متقدمة</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>إخفاء تلقائي للأزرار</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>تصميم احترافي مثل Instagram</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>إحصائيات مباشرة متحركة</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 rtl:space-x-reverse">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/30 py-4 text-lg"
            >
              إلغاء
            </Button>
            
            <Button
              onClick={startEnhancedStream}
              disabled={isLoading || !streamTitle.trim()}
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-4 text-lg font-bold disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري البدء...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <Plus className="w-5 h-5" />
                  <span>ابدأ البث المحدث</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </div>

          <div className="text-center text-white/60 text-sm">
            💡 تلميح: تأكد من إعطاء الإذن للكاميرا والمايكروفون عند البدء
          </div>
        </CardContent>
      </Card>
    </div>
  );
}