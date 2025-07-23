import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Camera, 
  Mic, 
  MicOff, 
  VideoOff, 
  Settings,
  Play,
  Square,
  Sparkles,
  Wand2,
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import BeautyFilters from '@/components/beauty-filters';
import SimpleNavigation from '@/components/simple-navigation';
import { useLocation } from 'wouter';

interface StreamCategory {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
}

const streamCategories: StreamCategory[] = [
  { id: 'gaming', name: 'Gaming', nameAr: 'الألعاب', emoji: '🎮' },
  { id: 'music', name: 'Music', nameAr: 'الموسيقى', emoji: '🎵' },
  { id: 'art', name: 'Art & Design', nameAr: 'الفن والتصميم', emoji: '🎨' },
  { id: 'talk', name: 'Just Chatting', nameAr: 'محادثة عامة', emoji: '💬' },
  { id: 'education', name: 'Education', nameAr: 'التعليم', emoji: '📚' },
  { id: 'fitness', name: 'Fitness', nameAr: 'اللياقة البدنية', emoji: '💪' },
  { id: 'cooking', name: 'Cooking', nameAr: 'الطبخ', emoji: '👨‍🍳' },
  { id: 'lifestyle', name: 'Lifestyle', nameAr: 'أسلوب الحياة', emoji: '✨' }
];

export default function StartStreamPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const isRTL = language === 'ar';

  // Initialize camera
  useEffect(() => {
    if (cameraEnabled && videoRef.current && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: micEnabled 
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
        toast({
          title: "Camera Access Error",
          description: "Unable to access your camera. Please check permissions.",
          variant: "destructive",
        });
      });
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled, micEnabled, toast]);

  const startStreamMutation = useMutation({
    mutationFn: async () => {
      const streamData = {
        title: streamTitle,
        description: streamDescription,
        category: selectedCategory,
        isActive: true,
        language: language
      };
      const response = await apiRequest('POST', '/api/streams', streamData);
      return response.json();
    },
    onSuccess: (data) => {
      setIsStreaming(true);
      toast({
        title: isRTL ? "تم بدء البث!" : "Stream Started!",
        description: isRTL ? "بثك المباشر يعمل الآن" : "Your live stream is now active",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
      // Redirect to the stream page
      setLocation(`/stream/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: isRTL ? "خطأ في بدء البث" : "Stream Start Error",
        description: isRTL ? "حدث خطأ أثناء بدء البث" : "Failed to start stream",
        variant: "destructive",
      });
    }
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/streams/stop');
    },
    onSuccess: () => {
      setIsStreaming(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      toast({
        title: isRTL ? "تم إيقاف البث" : "Stream Stopped",
        description: isRTL ? "تم إنهاء البث المباشر" : "Your live stream has ended",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
    }
  });

  const handleStartStream = () => {
    if (!streamTitle.trim() || !selectedCategory) {
      toast({
        title: isRTL ? "معلومات مطلوبة" : "Required Information",
        description: isRTL ? "يرجى إدخال عنوان البث واختيار فئة" : "Please enter stream title and select category",
        variant: "destructive",
      });
      return;
    }
    startStreamMutation.mutate();
  };

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
      }
    }
  };

  const toggleMic = () => {
    setMicEnabled(!micEnabled);
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please log in to start streaming</p>
            <Button onClick={() => window.location.href = '/api/login'}>
              Login to Stream
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* TikTok-Style Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        {/* TikTok-Style Header */}
        <div className={`relative z-10 flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className={`text-white hover:bg-white/10 ${isRTL ? 'mr-auto' : ''}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isRTL ? 'الرجوع للرئيسية' : 'Back to Home'}
          </Button>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              {isRTL ? 'بدء بث مباشر' : 'Start Live Stream'}
            </h1>
            <p className="text-white/80 mt-2 text-lg drop-shadow-md">
              {isRTL 
                ? 'ابدأ بثك المباشر مع فلاتر التجميل المتقدمة' 
                : 'Start your live stream with advanced beauty filters'
              }
            </p>
          </div>

          {/* Language Toggle - TikTok Style */}
          <div className="flex bg-white/20 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/30">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}
            >
              EN
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className={language === 'ar' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}
            >
              العربية
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stream Setup */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stream Information */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Settings className="w-5 h-5 text-laa-pink" />
                  {isRTL ? 'إعدادات البث' : 'Stream Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white/90 font-semibold">
                    {isRTL ? 'عنوان البث' : 'Stream Title'}
                  </Label>
                  <Input
                    id="title"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder={isRTL ? 'اكتب عنوان البث...' : 'Enter stream title...'}
                    className="mt-2 bg-white/20 border-white/30 text-white placeholder-white/60 focus:border-laa-pink"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white/90 font-semibold">
                    {isRTL ? 'الوصف' : 'Description'}
                  </Label>
                  <Textarea
                    id="description"
                    value={streamDescription}
                    onChange={(e) => setStreamDescription(e.target.value)}
                    placeholder={isRTL ? 'اكتب وصف البث...' : 'Enter stream description...'}
                    rows={3}
                    className="mt-2 bg-white/20 border-white/30 text-white placeholder-white/60 focus:border-laa-pink"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <Label>{isRTL ? 'الفئة' : 'Category'}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {streamCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`h-auto p-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <span className="text-lg mr-2">{category.emoji}</span>
                        <span className="text-xs">
                          {isRTL ? category.nameAr : category.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stream Controls */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Video className="w-5 h-5" />
                  {isRTL ? 'التحكم بالبث' : 'Stream Controls'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant={cameraEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={toggleCamera}
                    className="flex-1"
                  >
                    {cameraEnabled ? <Camera className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                    {isRTL ? (cameraEnabled ? 'الكاميرا تعمل' : 'الكاميرا متوقفة') : (cameraEnabled ? 'Camera On' : 'Camera Off')}
                  </Button>
                  <Button
                    variant={micEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={toggleMic}
                    className="flex-1"
                  >
                    {micEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                    {isRTL ? (micEnabled ? 'المايك يعمل' : 'المايك متوقف') : (micEnabled ? 'Mic On' : 'Mic Off')}
                  </Button>
                </div>

                {!isStreaming ? (
                  <Button 
                    onClick={handleStartStream}
                    disabled={startStreamMutation.isPending || !streamTitle.trim() || !selectedCategory}
                    className="w-full bg-gradient-to-r from-laa-pink to-laa-purple hover:from-pink-600 hover:to-purple-600"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {startStreamMutation.isPending 
                      ? (isRTL ? 'جاري بدء البث...' : 'Starting Stream...') 
                      : (isRTL ? 'بدء البث المباشر' : 'Start Live Stream')
                    }
                  </Button>
                ) : (
                  <Button 
                    onClick={() => stopStreamMutation.mutate()}
                    disabled={stopStreamMutation.isPending}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    {stopStreamMutation.isPending 
                      ? (isRTL ? 'جاري إيقاف البث...' : 'Stopping Stream...') 
                      : (isRTL ? 'إيقاف البث' : 'Stop Stream')
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Video Preview & Beauty Filters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Camera className="w-5 h-5" />
                    {isRTL ? 'معاينة البث' : 'Stream Preview'}
                  </div>
                  <div className="flex gap-2">
                    {isStreaming && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        {isRTL ? 'مباشر' : 'LIVE'}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className={showFilters ? 'ring-2 ring-pink-500' : ''}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isRTL ? 'فلاتر التجميل' : 'Beauty Filters'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* TikTok-Style Stream Preview */}
                <div className="relative aspect-[9/16] max-w-sm mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* TikTok-Style Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>
                  
                  {!cameraEnabled && (
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                      <div className="text-center text-white">
                        <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-70" />
                        <p className="text-xl font-bold">
                          {isRTL ? 'الكاميرا متوقفة' : 'Camera is off'}
                        </p>
                        <p className="text-sm text-gray-300 mt-2">
                          {isRTL ? 'شغل الكاميرا لبدء البث' : 'Turn on camera to start streaming'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TikTok-Style Live Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className={`px-3 py-1.5 rounded-full font-bold text-sm border-2 border-white shadow-lg ${
                      isStreaming 
                        ? 'bg-red-600 text-white animate-pulse' 
                        : 'bg-gray-800/80 text-gray-300 backdrop-blur-sm'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isStreaming && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                        {isStreaming ? (isRTL ? 'مباشر' : 'LIVE') : (isRTL ? 'معاينة' : 'PREVIEW')}
                      </div>
                    </div>
                  </div>

                  {/* TikTok-Style Side Controls Preview */}
                  <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* TikTok-Style Stream Info */}
                  <div className="absolute bottom-4 left-4 right-20 text-white">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg drop-shadow-lg">
                        {streamTitle || (isRTL ? 'عنوان البث' : 'Stream Title')}
                      </h3>
                      <p className="text-sm text-gray-200 drop-shadow-md">
                        {streamDescription || (isRTL ? 'وصف البث المباشر' : 'Live stream description')}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-laa-pink rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">U</span>
                        </div>
                        <span className="font-semibold drop-shadow-lg">{user?.username || 'المستخدم'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beauty Filters Panel */}
            {showFilters && (
              <div className="w-full">
                <BeautyFilters
                  isStreaming={true}
                  onFilterChange={(filterId, intensity) => {
                    console.log(`Beauty filter ${filterId} applied with ${intensity}% intensity`);
                    toast({
                      title: isRTL ? 'تم تطبيق الفلتر' : 'Filter Applied',
                      description: isRTL ? `تم تطبيق فلتر بشدة ${intensity}%` : `Filter applied with ${intensity}% intensity`,
                    });
                  }}
                  language={language}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}