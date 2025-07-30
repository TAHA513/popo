import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SimpleNavigation from "@/components/simple-navigation";
import {
  Play,
  Volume2,
  VolumeX,
  ArrowLeft,
  Upload,
  FileVideo
} from "lucide-react";

export default function SingleVideoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      toast({
        title: "ملف غير صالح",
        description: "يرجى اختيار ملف فيديو صالح",
        variant: "destructive"
      });
      return;
    }

    // Check file size (100MB limit for local playback)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "الملف كبير جداً",
        description: "حجم الملف يجب أن يكون أقل من 100 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    // التحقق من مدة الفيديو (حد أقصى 90 ثانية)
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 90) {
        toast({
          title: "فيديو طويل جداً ⏰",
          description: `مدة الفيديو ${Math.round(video.duration)} ثانية. الحد الأقصى 90 ثانية`,
          variant: "destructive"
        });
        return;
      }
      
      // إذا كان الفيديو مناسب، استمر في المعالجة
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setIsVideoPlaying(false);
      setVideoError(false);
      setIsVideoLoading(false);

      toast({
        title: "تم تحديد الفيديو ✅",
        description: `${file.name} - ${Math.round(video.duration)} ثانية`,
      });
    };
    video.src = URL.createObjectURL(file);
  };

  const handleVideoToggle = async () => {
    if (!videoRef.current) return;

    try {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        setIsVideoLoading(true);
        await videoRef.current.play();
        setIsVideoPlaying(true);
        setIsVideoLoading(false);
      }
    } catch (error) {
      console.error('Video toggle error:', error);
      setIsVideoLoading(false);
      setVideoError(true);
      toast({
        title: "خطأ في تشغيل الفيديو",
        description: "حدث خطأ أثناء محاولة تشغيل الفيديو",
        variant: "destructive"
      });
    }
  };

  const handleVolumeToggle = () => {
    if (!videoRef.current) return;

    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const resetVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setSelectedFile(null);
    setVideoUrl("");
    setIsVideoPlaying(false);
    setVideoError(false);
    setIsVideoLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we have a video
      if (!videoUrl) return;
      
      if (e.key === ' ') {
        e.preventDefault();
        handleVideoToggle();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleVolumeToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoUrl, isVideoPlaying, isMuted]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <SimpleNavigation />
      
      <div className="pt-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FileVideo className="w-8 h-8 text-purple-300 mr-3" />
              <h1 className="text-2xl font-bold">مشغل الفيديو المفرد</h1>
            </div>
            <p className="text-purple-200">
              اختر ملف فيديو من جهازك لتشغيله دون تصفح فيديوهات أخرى
            </p>
          </div>

          {/* File Selection */}
          {!selectedFile && (
            <div className="text-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 rounded-2xl text-lg font-medium mb-4"
              >
                <Upload className="w-6 h-6 mr-3" />
                اختيار ملف فيديو
              </Button>
              
              <div className="text-sm text-purple-200 space-y-1">
                <p>الصيغ المدعومة: MP4, WebM, MOV</p>
                <p>الحد الأقصى للحجم: 100 ميجابايت</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Video Player */}
          {selectedFile && videoUrl && (
            <div className="relative">
              {/* Video Container */}
              <div className="relative bg-black rounded-2xl overflow-hidden group" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onLoadStart={() => {
                    setIsVideoLoading(true);
                    setVideoError(false);
                  }}
                  onCanPlay={() => {
                    setIsVideoLoading(false);
                  }}
                  onError={() => {
                    setIsVideoLoading(false);
                    setIsVideoPlaying(false);
                    setVideoError(true);
                  }}
                  muted={isMuted}
                />

                {/* Loading Indicator */}
                {isVideoLoading && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center z-30">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Error Indicator */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-sm mb-3">مشكلة في تحميل الفيديو</p>
                      <Button
                        onClick={() => {
                          setVideoError(false);
                          setIsVideoLoading(true);
                          if (videoRef.current) {
                            videoRef.current.load();
                          }
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2"
                      >
                        إعادة المحاولة
                      </Button>
                    </div>
                  </div>
                )}

                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-100 transition-opacity duration-300">
                  {/* Play/Pause Button - Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleVideoToggle}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-full text-white bg-black/40 hover:bg-black/60 transition-all duration-300 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-90 hover:opacity-100'}`}
                      disabled={isVideoLoading}
                    >
                      {isVideoLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : isVideoPlaying ? (
                        <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                          <div className="w-1.5 h-5 md:w-2 md:h-6 bg-white rounded mr-1"></div>
                          <div className="w-1.5 h-5 md:w-2 md:h-6 bg-white rounded"></div>
                        </div>
                      ) : (
                        <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" fill="white" />
                      )}
                    </Button>
                  </div>

                  {/* Volume Control - Top Right */}
                  <div className="absolute top-4 right-4 z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVolumeToggle}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all duration-300 shadow-lg ${
                        isMuted 
                          ? 'bg-red-500/20 border-red-400/40 hover:bg-red-500/30 text-red-300' 
                          : 'bg-white/10 border-white/30 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
                      ) : (
                        <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl">
                <h3 className="font-medium text-lg mb-2">{selectedFile.name}</h3>
                <div className="text-sm text-purple-200 space-y-1">
                  <p>الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت</p>
                  <p>النوع: {selectedFile.type}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 text-center space-y-4">
                <div className="text-sm text-purple-200">
                  <p>اضغط مسافة للتشغيل/الإيقاف • اضغط M لكتم/إلغاء كتم الصوت</p>
                </div>
                
                <Button
                  onClick={resetVideo}
                  variant="outline"
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 rounded-2xl px-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  اختيار فيديو آخر
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}