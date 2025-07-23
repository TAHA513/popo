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
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  
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
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = false;
          videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
          streamRef.current = stream;
        }
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
        let errorMessage = "لا يمكن الوصول للكاميرا. يرجى التحقق من الصلاحيات.";
        
        if (error.name === 'NotAllowedError') {
          errorMessage = "تم رفض الإذن للكاميرا. يرجى السماح بالوصول في إعدادات المتصفح.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "لم يتم العثور على كاميرا. يرجى التأكد من توصيل الكاميرا.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "الكاميرا مستخدمة من تطبيق آخر. يرجى إغلاق التطبيقات الأخرى.";
        }
        
        toast({
          title: "خطأ في الكاميرا",
          description: errorMessage,
          variant: "destructive",
        });
        setCameraEnabled(false);
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
      return await apiRequest('/api/streams', 'POST', streamData);
    },
    onSuccess: (data) => {
      setIsStreaming(true);
      setCurrentStreamId(data.id);
      toast({
        title: "تم بدء البث!",
        description: "بثك المباشر يعمل الآن",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
      // Redirect to the stream page
      setLocation(`/stream/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Stream start error:', error);
      let errorMessage = "حدث خطأ أثناء بدء البث";
      
      if (error.message?.includes('401')) {
        errorMessage = "يجب تسجيل الدخول أولاً";
      } else if (error.message?.includes('403')) {
        errorMessage = "ليس لديك صلاحية لبدء البث";
      } else if (error.message?.includes('400')) {
        errorMessage = "بيانات البث غير صحيحة";
      }
      
      toast({
        title: "خطأ في بدء البث",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const stopStreamMutation = useMutation({
    mutationFn: async (streamId: number) => {
      await apiRequest(`/api/streams/${streamId}/end`, 'POST');
    },
    onSuccess: () => {
      setIsStreaming(false);
      setCurrentStreamId(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      toast({
        title: "تم إيقاف البث",
        description: "تم إنهاء البث المباشر وحذفه من النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
      setLocation('/');
    }
  });

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: micEnabled 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = false;
        videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
        streamRef.current = stream;
      }
      
      toast({
        title: "تم السماح بالوصول",
        description: "تم السماح بالوصول للكاميرا والمايكروفون بنجاح",
      });
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = "لا يمكن الوصول للكاميرا. يرجى التحقق من الصلاحيات.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "تم رفض الإذن للكاميرا. يرجى الضغط على 'السماح' عند ظهور الطلب في المتصفح.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا. يرجى التأكد من توصيل الكاميرا.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "الكاميرا مستخدمة من تطبيق آخر. يرجى إغلاق التطبيقات الأخرى.";
      }
      
      toast({
        title: "خطأ في الكاميرا",
        description: errorMessage,
        variant: "destructive",
      });
      setCameraEnabled(false);
    }
  };

  const handleStartStream = () => {
    if (!isAuthenticated) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول أولاً لبدء البث",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }
    
    if (!streamTitle.trim() || !selectedCategory) {
      toast({
        title: "معلومات مطلوبة",
        description: "يرجى إدخال عنوان البث واختيار فئة",
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
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
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
            <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
              بدء بث مباشر
            </h1>
            <p className="text-white/80 mt-1 sm:mt-2 text-sm sm:text-lg drop-shadow-md">
              ابدأ بثك المباشر مع فلاتر التجميل المتقدمة
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
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
                {/* Camera Permission Panel */}
                {!streamRef.current && cameraEnabled && (
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-4">
                    <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">
                          {isRTL ? 'يتطلب إذن الوصول للكاميرا' : 'Camera Access Required'}
                        </h3>
                        <p className="text-orange-200 text-xs">
                          {isRTL ? 'اضغط على "طلب الإذن" للسماح بالوصول للكاميرا والمايكروفون' : 'Click "Request Permission" to allow camera and microphone access'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={requestCameraPermission}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                      size="sm"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isRTL ? 'طلب إذن الكاميرا' : 'Request Camera Permission'}
                    </Button>
                  </div>
                )}

                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    variant={cameraEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={toggleCamera}
                    className="flex-1"
                  >
                    {cameraEnabled ? <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    <span className="text-xs sm:text-sm">
                      {cameraEnabled ? 'الكاميرا' : 'متوقفة'}
                    </span>
                  </Button>
                  <Button
                    variant={micEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={toggleMic}
                    className="flex-1"
                  >
                    {micEnabled ? <Mic className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <MicOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    <span className="text-xs sm:text-sm">
                      {micEnabled ? 'المايك' : 'متوقف'}
                    </span>
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
                    onClick={() => currentStreamId && stopStreamMutation.mutate(currentStreamId)}
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
                  
                  {cameraEnabled && !streamRef.current && (
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-900/90 to-red-900/90 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center text-white max-w-xs px-6">
                        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Camera className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-lg font-bold mb-2">
                          {isRTL ? 'يرجى السماح بالوصول للكاميرا' : 'Please Allow Camera Access'}
                        </p>
                        <p className="text-sm text-orange-200 mb-4">
                          {isRTL ? 
                            'انقر على "طلب إذن الكاميرا" في قسم التحكم بالبث' : 
                            'Click "Request Camera Permission" in the Stream Controls section'
                          }
                        </p>
                        <div className="text-xs text-orange-300 bg-orange-500/20 rounded-lg p-3 border border-orange-500/30">
                          💡 {isRTL ? 
                            'نصيحة: اضغط "السماح" عند ظهور طلب الإذن من المتصفح' : 
                            'Tip: Click "Allow" when the browser permission request appears'
                          }
                        </div>
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