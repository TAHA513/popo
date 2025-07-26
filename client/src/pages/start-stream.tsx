import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Mic, MicOff, Radio, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";

export default function StartStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true; // Prevent feedback
      }
    } catch (error) {
      console.error("خطأ في الوصول للكاميرا:", error);
      alert("فشل في الوصول للكاميرا. يرجى التأكد من أن المتصفح لديه صلاحية الوصول للكاميرا والميكروفون.");
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      alert("يرجى إدخال عنوان للبث");
      return;
    }

    if (!user) {
      alert("يجب تسجيل الدخول لبدء البث");
      setLocation("/login");
      return;
    }

    try {
      await startCamera();
      
      const streamData = await apiRequest("/api/streams", "POST", {
        title: streamTitle,
        description: streamDescription,
        hostId: user.id
      });

      setCurrentStreamId(streamData.id);
      setIsStreaming(true);
      setViewerCount(1); // Start with the streamer as first viewer
      
      alert("تم بدء البث بنجاح!");
    } catch (error) {
      console.error("خطأ في بدء البث:", error);
      alert("فشل في بدء البث. يرجى المحاولة مرة أخرى.");
    }
  };

  const stopStream = async () => {
    try {
      if (currentStreamId) {
        await apiRequest(`/api/streams/${currentStreamId}`, "DELETE");
      }
      
      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsStreaming(false);
      setCurrentStreamId(null);
      setViewerCount(0);
      setStreamTitle("");
      setStreamDescription("");
      
      alert("تم إنهاء البث");
      setLocation("/");
    } catch (error) {
      console.error("خطأ في إنهاء البث:", error);
      alert("تم إنهاء البث");
      setLocation("/");
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-4">يجب عليك تسجيل الدخول لبدء البث المباشر</p>
            <Button onClick={() => setLocation("/login")} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Radio className="w-8 h-8" />
            البث المباشر
          </h1>
          <p className="text-purple-200">شارك لحظاتك مع الأصدقاء</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Preview */}
          <div className="order-2 lg:order-1">
            <Card className="bg-black/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  معاينة البث
                  {isStreaming && (
                    <span className="text-sm bg-red-500 px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      مباشر
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <VideoOff className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Controls overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
                    <Button
                      onClick={toggleVideo}
                      variant={isVideoEnabled ? "default" : "destructive"}
                      size="sm"
                      className="rounded-full"
                    >
                      {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={toggleAudio}
                      variant={isAudioEnabled ? "default" : "destructive"}
                      size="sm"
                      className="rounded-full"
                    >
                      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Viewer count */}
                  {isStreaming && (
                    <div className="absolute top-4 left-4 bg-black/70 rounded-full px-3 py-1 flex items-center gap-2 text-white">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{viewerCount}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stream Settings */}
          <div className="order-1 lg:order-2">
            <Card className="bg-white/10 backdrop-blur-md border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">إعدادات البث</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-purple-200 mb-2">عنوان البث</label>
                  <Input
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="أدخل عنوان البث..."
                    className="bg-white/20 border-purple-500/30 text-white placeholder:text-purple-300"
                    disabled={isStreaming}
                  />
                </div>

                <div>
                  <label className="block text-purple-200 mb-2">وصف البث (اختياري)</label>
                  <Textarea
                    value={streamDescription}
                    onChange={(e) => setStreamDescription(e.target.value)}
                    placeholder="أدخل وصف البث..."
                    className="bg-white/20 border-purple-500/30 text-white placeholder:text-purple-300 min-h-[100px]"
                    disabled={isStreaming}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  {!isStreaming ? (
                    <Button
                      onClick={startStream}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3"
                      size="lg"
                    >
                      <Radio className="w-5 h-5 mr-2" />
                      بدء البث المباشر
                    </Button>
                  ) : (
                    <Button
                      onClick={stopStream}
                      variant="destructive"
                      className="w-full font-bold py-3"
                      size="lg"
                    >
                      إنهاء البث
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setLocation("/")}
                    variant="outline"
                    className="w-full border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                  >
                    العودة للرئيسية
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}