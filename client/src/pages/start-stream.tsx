import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Mic, MicOff, Radio, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { zegoStreamManager, generateStreamID, generateRoomID, initializeZegoConfig, validateStreamSecurity, type ZegoStreamConfig } from "@/lib/zegocloud";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  const startZegoStream = async () => {
    // Prevent multiple simultaneous calls
    if (isLoading || isStreaming) {
      console.log("⚠️ Stream already starting or active, ignoring request");
      return;
    }

    if (!streamTitle.trim()) {
      setError("يرجى إدخال عنوان للبث");
      return;
    }

    if (!user) {
      alert("يجب تسجيل الدخول لبدء البث");
      setLocation("/login");
      return;
    }

    setIsLoading(true);
    setError('');
    console.log("🎬 Starting stream with title:", streamTitle);

    try {
      // Performance monitoring for stream start
      console.time('🏃‍♂️ Stream initialization time');
      
      // Initialize secure ZegoCloud configuration
      console.log('🔒 Initializing secure ZegoCloud configuration...');
      await initializeZegoConfig();
      
      // Generate unique IDs for this stream
      const zegoStreamId = generateStreamID(user.id);
      const zegoRoomId = generateRoomID(streamTitle);
      
      // Validate stream security with server
      console.log('🔐 Validating stream security...');
      const isSecure = await validateStreamSecurity(zegoStreamId);
      if (!isSecure) {
        throw new Error('فشل في التحقق من أمان البث');
      }
      
      // Create ZegoCloud stream configuration
      const zegoConfig: ZegoStreamConfig = {
        userID: user.id,
        userName: user.firstName || user.username || 'User',
        roomID: zegoRoomId,
        streamID: zegoStreamId
      };

      // Initialize ZegoCloud manager with security validation
      console.log('🔧 Initializing ZegoCloud manager...');
      await zegoStreamManager.initialize(zegoConfig);
      console.log('✅ ZegoCloud manager initialized');
      
      console.log('🚪 Logging into room:', zegoRoomId);
      await zegoStreamManager.loginRoom(zegoConfig);
      console.log('✅ Successfully logged into room');
      
      // Start local camera and publishing
      console.log('📹 Starting camera and publishing stream...');
      await startCamera();
      console.log('✅ Camera started successfully');
      
      console.log('📡 Starting to publish stream:', zegoStreamId);
      await zegoStreamManager.startPublishing(zegoStreamId, videoRef.current || undefined);
      console.log('✅ Stream publishing started successfully');
      
      // End performance monitoring
      console.timeEnd('🏃‍♂️ Stream initialization time');
      
      // Memory monitoring (only if supported)
      if (typeof (performance as any).memory !== 'undefined') {
        console.log('📊 Memory usage:', {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB'
        });
      } else {
        console.log('📊 Memory monitoring not available in this browser');
      }

      // Create stream record in our database
      console.log('💾 Creating stream record in database...');
      const response = await apiRequest('/api/streams', 'POST', {
        title: streamTitle,
        description: streamDescription,
        hostId: user.id,
        zegoRoomId,
        zegoStreamId
      });

      if (response.success) {
        setCurrentStreamId(response.data.id);
        setIsStreaming(true);
        setViewerCount(1);
        console.log("🎥 ZegoCloud stream started successfully!");
        console.log("📋 Stream details:", {
          streamId: response.data.id,
          zegoRoomId,
          zegoStreamId,
          title: streamTitle
        });
      } else {
        throw new Error('فشل في إنشاء سجل البث في قاعدة البيانات');
      }
    } catch (error) {
      console.error("Failed to start ZegoCloud stream:", error);
      setError("فشل في بدء البث المباشر. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopZegoStream = async () => {
    try {
      if (currentStreamId) {
        // Stop ZegoCloud publishing
        const zegoStreamId = generateStreamID(user?.id || '');
        await zegoStreamManager.stopPublishing(zegoStreamId);
        await zegoStreamManager.logoutRoom();
        await zegoStreamManager.destroy();

        // Stop local camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // End stream in database
        await apiRequest(`/api/streams/${currentStreamId}/end`, 'POST');
        
        setIsStreaming(false);
        setCurrentStreamId(null);
        setViewerCount(0);
        setStreamTitle("");
        setStreamDescription("");
        console.log("🛑 ZegoCloud stream stopped successfully!");
        
        // Redirect to streams page
        setLocation("/");
      }
    } catch (error) {
      console.error("Failed to stop ZegoCloud stream:", error);
      alert("فشل في إيقاف البث");
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
            البث المباشر مع ZegoCloud
          </h1>
          <p className="text-purple-200">شارك لحظاتك مع الأصدقاء بجودة عالية</p>
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
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
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

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {!isStreaming ? (
                    <Button
                      onClick={startZegoStream}
                      disabled={isLoading || !streamTitle.trim()}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 disabled:opacity-50"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          جاري بدء البث...
                        </>
                      ) : (
                        <>
                          <Radio className="w-5 h-5 mr-2" />
                          بدء البث المباشر
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={stopZegoStream}
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