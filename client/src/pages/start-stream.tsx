import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Mic, MicOff, Radio, Users, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { 
  initializeZegoConfig, 
  validateStreamSecurity, 
  createZegoEngine,
  loginRoom,
  startPublishing,
  stopPublishing,
  logoutRoom,
  destroyEngine,
  generateStreamID, 
  generateRoomID, 
  type ZegoStreamConfig 
} from "@/lib/zegocloud";

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
  const zegoEngineRef = useRef<any>(null);

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
      console.log("🎥 Requesting camera and microphone access...");
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // Wait for video to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          } else {
            resolve();
          }
        });
      }
      
      console.log("📹 Camera and microphone access granted successfully");
      console.log("📊 Stream details:", {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoLabel: stream.getVideoTracks()[0]?.label || 'No video',
        audioLabel: stream.getAudioTracks()[0]?.label || 'No audio'
      });
      
    } catch (error: any) {
      console.error("❌ Failed to access camera:", error);
      
      let errorMessage = "فشل في الوصول إلى الكاميرا";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "يجب السماح بالوصول إلى الكاميرا والمايكروفون من إعدادات المتصفح";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا أو مايكروفون متصل بالجهاز";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "الكاميرا أو المايكروفون قيد الاستخدام من تطبيق آخر";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "إعدادات الكاميرا المطلوبة غير مدعومة";
      }
      
      alert(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const startZegoStream = async () => {
    console.log("🎬 startZegoStream called - checking conditions...");
    
    // Prevent multiple simultaneous calls
    if (isLoading || isStreaming) {
      console.log("⚠️ Stream already starting or active, ignoring request");
      return;
    }

    if (!streamTitle.trim()) {
      console.log("❌ No stream title provided");
      setError("يرجى إدخال عنوان للبث");
      return;
    }

    if (!user) {
      console.log("❌ User not authenticated");
      alert("يجب تسجيل الدخول لبدء البث");
      setLocation("/login");
      return;
    }

    console.log("✅ All conditions met, starting stream process...");
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

      // Start camera first to ensure we have stream
      console.log('📹 Step 1: Starting camera...');
      await startCamera();
      console.log('✅ Step 1 complete: Camera started successfully');
      
      if (!streamRef.current) {
        console.error('❌ Camera stream not available after startCamera()');
        throw new Error('فشل في تشغيل الكاميرا');
      }

      // Create ZegoCloud engine
      console.log('🔧 Step 2: Creating ZegoCloud engine...');
      const engine = createZegoEngine();
      zegoEngineRef.current = engine;
      console.log('✅ Step 2 complete: ZegoCloud engine created');
      
      console.log('🚪 Step 3: Logging into room:', zegoRoomId);
      console.log('🔍 ZegoConfig being passed:', zegoConfig);
      await loginRoom(engine, zegoConfig);
      console.log('✅ Step 3 complete: Successfully logged into room');
      
      // Start publishing with existing camera stream
      console.log('📡 Step 4: Starting stream publishing...');
      if (streamRef.current) {
        console.log('📹 Stream details:', {
          streamId: zegoStreamId,
          videoTracks: streamRef.current.getVideoTracks().length,
          audioTracks: streamRef.current.getAudioTracks().length,
          streamActive: streamRef.current.active
        });
        
        await engine.startPublishingStream(zegoStreamId, streamRef.current);
        console.log('✅ Step 4 complete: Started publishing stream successfully:', zegoStreamId);
      } else {
        console.error('❌ No camera stream available for publishing');
        throw new Error('لا يوجد تدفق كاميرا متاح للبث');
      }
      
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
      console.log('💾 Step 5: Creating stream record in database...');
      const response = await apiRequest('/api/streams', 'POST', {
        title: streamTitle,
        description: streamDescription,
        zegoRoomId,
        zegoStreamId
      });

      console.log('📋 Stream creation response:', response);

      if (response && response.id) {
        setCurrentStreamId(response.id);
        setIsStreaming(true);
        setViewerCount(1);
        console.log("🎥 Step 5 complete: ZegoCloud stream started successfully!");
        console.log("📋 Final stream details:", {
          streamId: response.id,
          zegoRoomId,
          zegoStreamId,
          title: streamTitle
        });
        console.log("🎉 STREAM FULLY OPERATIONAL! All steps completed successfully.");
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('فشل في إنشاء سجل البث في قاعدة البيانات');
      }
    } catch (error) {
      console.error("❌ Failed to start ZegoCloud stream:", error);
      console.error("❌ Detailed error:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        zegoConfig,
        streamTitle,
        streamDescription
      });
      
      let errorMessage = "فشل في بدء البث المباشر. يرجى المحاولة مرة أخرى.";
      
      if (error instanceof Error) {
        if (error.message.includes('camera') || error.message.includes('Camera')) {
          errorMessage = "فشل في الوصول إلى الكاميرا. يرجى التأكد من السماح بالوصول للكاميرا والمايكروفون.";
        } else if (error.message.includes('room') || error.message.includes('Room')) {
          errorMessage = "فشل في الاتصال بغرفة البث. يرجى التحقق من الاتصال بالإنترنت.";
        } else if (error.message.includes('stream') || error.message.includes('Stream')) {
          errorMessage = "فشل في بدء البث. يرجى المحاولة مرة أخرى.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stopZegoStream = async () => {
    try {
      if (currentStreamId && zegoEngineRef.current) {
        // Stop ZegoCloud publishing
        const zegoStreamId = generateStreamID(user?.id || '');
        await stopPublishing(zegoEngineRef.current, zegoStreamId);
        await logoutRoom(zegoEngineRef.current);
        await destroyEngine(zegoEngineRef.current);
        zegoEngineRef.current = null;

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
      console.error("Failed to stop stream:", error);
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