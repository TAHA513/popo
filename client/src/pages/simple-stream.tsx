import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Mic, MicOff, Radio } from "lucide-react";
import { useLocation } from "wouter";

export default function SimpleStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simple camera start function
  const startCamera = async () => {
    try {
      console.log('📹 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      console.log('✅ Camera started successfully');
      return true;
    } catch (error) {
      console.error('❌ Camera failed:', error);
      throw new Error('فشل في تشغيل الكاميرا - تأكد من السماح للموقع بالوصول للكاميرا');
    }
  };

  // Very simple streaming function
  const startStream = async () => {
    console.log('🚀 ===== STARTING SIMPLE STREAM =====');
    
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      setLocation("/login");
      return;
    }

    setError('');
    
    try {
      // Start camera first
      await startCamera();
      
      // Show success message
      setIsStreaming(true);
      console.log('🎉 Stream simulation started successfully!');
      
      // Simulate stream ID for display
      alert("تم بدء البث بنجاح! (محاكاة)");
      
    } catch (error) {
      console.error('❌ Stream failed:', error);
      setError(error instanceof Error ? error.message : "فشل في بدء البث");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    console.log('⏹️ Stream stopped');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">بث مبسط - تجربة سريعة</h1>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <Card className="bg-white/10 backdrop-blur-md border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">معاينة البث</CardTitle>
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
                  
                  {!isStreaming && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-white/10 backdrop-blur-md border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">التحكم في البث</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-purple-200 mb-2">عنوان البث</label>
                  <Input
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="بث تجريبي..."
                    className="bg-white/20 border-purple-500/30 text-white placeholder:text-purple-300"
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
                      onClick={() => {
                        console.log("🖱️ SIMPLE STREAM BUTTON CLICKED!");
                        startStream();
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-3"
                      size="lg"
                    >
                      <Radio className="w-5 h-5 mr-2" />
                      تجربة البث السريع
                    </Button>
                  ) : (
                    <Button
                      onClick={stopStream}
                      variant="destructive"
                      className="w-full font-bold py-3"
                      size="lg"
                    >
                      إيقاف البث
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

                {isStreaming && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
                    ✅ البث يعمل! الكاميرا تعمل بشكل صحيح
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}