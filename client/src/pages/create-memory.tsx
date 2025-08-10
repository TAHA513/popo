import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Heart, 
  Crown, 
  Clock,
  Globe,
  Users,
  Lock,
  MessageCircle,
  Share2,
  Gift,
  ArrowLeft,
  X,
  Camera,
  Zap,
  Smile,
  Palette,
  Filter,
  Sun,
  Moon,
  Contrast,
  Settings,
  Plus,
  Play,
  Pause,
  Music,
  Flame,
  Star,
  Trophy
} from "lucide-react";

// TikTok-inspired filters with emojis
const TIKTOK_FILTERS = [
  { id: 'none', name: 'الأصلي', emoji: '✨', style: '' },
  { id: 'vintage', name: 'كلاسيكي', emoji: '📸', style: 'sepia(0.6) brightness(1.1) contrast(1.1)' },
  { id: 'dramatic', name: 'دراماتيكي', emoji: '🎭', style: 'contrast(1.4) saturate(1.3) brightness(0.9)' },
  { id: 'warm', name: 'دافئ', emoji: '☀️', style: 'hue-rotate(15deg) saturate(1.2) brightness(1.1)' },
  { id: 'cool', name: 'بارد', emoji: '❄️', style: 'hue-rotate(-20deg) saturate(1.1) brightness(1.05)' },
  { id: 'vibrant', name: 'حيوي', emoji: '🌈', style: 'saturate(1.5) contrast(1.2) brightness(1.1)' },
  { id: 'neon', name: 'نيون', emoji: '💫', style: 'saturate(1.8) contrast(1.3) brightness(1.2) hue-rotate(45deg)' },
  { id: 'retro', name: 'ريترو', emoji: '🕺', style: 'sepia(0.3) saturate(1.4) contrast(1.2) brightness(1.1)' },
  { id: 'pink', name: 'وردي', emoji: '🌸', style: 'hue-rotate(300deg) saturate(1.3)' },
  { id: 'mono', name: 'أبيض وأسود', emoji: '⚫', style: 'grayscale(1) contrast(1.2)' }
];

// Memory types with new exciting options
const MEMORY_TYPES = [
  {
    id: 'flash',
    name: 'فلاش',
    emoji: '⚡',
    color: 'from-yellow-400 to-orange-500',
    duration: '3 ساعات',
    description: 'للحظات السريعة والمثيرة'
  },
  {
    id: 'trending',
    name: 'ترند',
    emoji: '🔥',
    color: 'from-red-500 to-pink-500',
    duration: '12 ساعة',
    description: 'للمحتوى الرائج والشائع'
  },
  {
    id: 'star',
    name: 'نجم',
    emoji: '⭐',
    color: 'from-purple-500 to-indigo-500',
    duration: '24 ساعة',
    description: 'للذكريات المميزة'
  },
  {
    id: 'legend',
    name: 'أسطورة',
    emoji: '👑',
    color: 'from-yellow-500 to-yellow-600',
    duration: 'أسبوع',
    description: 'للحظات الاستثنائية'
  },
  {
    id: 'permanent',
    name: 'كرة دائيمية',
    emoji: '🌐',
    color: 'from-blue-500 to-cyan-500',
    duration: 'دائمة',
    description: 'ذكريات تبقى للأبد'
  }
];

// Privacy options
const PRIVACY_OPTIONS = [
  { value: 'public', icon: Globe, label: 'عام', desc: 'يمكن للجميع رؤيته', color: 'text-green-400' },
  { value: 'followers', icon: Users, label: 'المتابعون', desc: 'للمتابعين فقط', color: 'text-blue-400' },
  { value: 'private', icon: Lock, label: 'خاص', desc: 'لك فقط', color: 'text-gray-400' }
];

export default function CreateMemoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'filter' | 'details'>('upload');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const [formData, setFormData] = useState({
    caption: "",
    memoryType: "star" as "flash" | "trending" | "star" | "legend" | "permanent",
    visibilityLevel: "public" as "public" | "followers" | "private",
    allowComments: true,
    allowSharing: true,
    allowGifts: true
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "الملف كبير جداً",
        description: "حجم الملف يجب أن يكون أقل من 50 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    // التحقق من مدة الفيديو إذا كان ملف فيديو
    if (file.type.startsWith('video/')) {
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
        setPreviewUrl(url);
        setCurrentStep('filter');
      };
      video.src = URL.createObjectURL(file);
    } else {
      // للصور، استمر مباشرة
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentStep('filter');
    }
  };

  const resetUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentStep('upload');
    setSelectedFilter('none');
    setFormData({
      caption: "",
      memoryType: "star",
      visibilityLevel: "public",
      allowComments: true,
      allowSharing: true,
      allowGifts: true
    });
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Create mutation for uploading memory
  const uploadMutation = useMutation({
    mutationFn: async (formDataToSend: FormData) => {
      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('فشل في نشر المحتوى');
      }

      return response.json();
    },
    onSuccess: async (newMemory) => {
      // أضف المنشور الجديد للـ cache بدلاً من إعادة تحميل كل شيء
      queryClient.setQueryData(['/api/memories/public'], (oldData: any) => {
        if (!oldData) return [newMemory];
        return [newMemory, ...oldData];
      });
      
      toast({
        title: "تم النشر بنجاح! 🎉",
        description: "تم نشر محتواك وهو متاح الآن للآخرين",
      });

      // Wait a bit to show success then navigate
      setTimeout(() => {
        resetUpload();
        setUploadProgress(0);
        setIsUploading(false);
        // Use router navigation instead of window.location
        setLocation('/');
      }, 1000);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadProgress(0);
      setIsUploading(false);
      toast({
        title: "خطأ في النشر",
        description: "حدث خطأ أثناء نشر المحتوى. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async () => {
    if (!selectedFile || uploadMutation.isPending) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    const formDataToSend = new FormData();
    formDataToSend.append('media', selectedFile);
    formDataToSend.append('caption', formData.caption);
    formDataToSend.append('memoryType', formData.memoryType);
    formDataToSend.append('visibilityLevel', formData.visibilityLevel);
    formDataToSend.append('allowComments', formData.allowComments.toString());
    formDataToSend.append('allowSharing', formData.allowSharing.toString());
    formDataToSend.append('allowGifts', formData.allowGifts.toString());
    formDataToSend.append('filter', selectedFilter);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return Math.min(prev + Math.random() * 10 + 5, 90);
      });
    }, 200);

    // Execute mutation
    uploadMutation.mutate(formDataToSend);
    
    // Clear progress interval and set to 100% when done
    clearInterval(progressInterval);
    setUploadProgress(100);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-36 h-36 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10 rounded-full p-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-1 shadow-2xl">
              <span className="text-xl">🐰</span>
            </div>
            <h1 className="text-lg font-bold text-white">إنشاء ذكرى</h1>
          </div>
          
          <div className="w-10"></div>
        </div>

        {/* Content Area */}
        <div className="px-4 pb-20">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">شارك ذكرتك</h2>
                <p className="text-gray-300">اختر صورة أو فيديو لإنشاء ذكرى مميزة</p>
              </div>

              <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
                {/* Upload Options */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 text-center hover:bg-white/20 transition-all group tiktok-button"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white font-medium">صورة</span>
                    <p className="text-gray-300 text-xs mt-1">JPG, PNG, WebP</p>
                  </button>

                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 text-center hover:bg-white/20 transition-all group tiktok-button"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white font-medium">فيديو</span>
                    <p className="text-gray-300 text-xs mt-1">MP4, WebM</p>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 glass-effect">
                  <h3 className="text-white font-medium mb-3 text-center gradient-text">أو جرب هذه</h3>
                  <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                    <button className="text-white hover:text-pink-400 transition-colors animate-float">
                      <Camera className="h-6 w-6" />
                      <span className="text-xs block mt-1">كاميرا</span>
                    </button>
                    <button className="text-white hover:text-purple-400 transition-colors animate-float" style={{ animationDelay: '0.5s' }}>
                      <Music className="h-6 w-6" />
                      <span className="text-xs block mt-1">موسيقى</span>
                    </button>
                    <button className="text-white hover:text-blue-400 transition-colors animate-float" style={{ animationDelay: '1s' }}>
                      <Sparkles className="h-6 w-6" />
                      <span className="text-xs block mt-1">مؤثرات</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Separate inputs for images and videos */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Step 2: Filter */}
          {currentStep === 'filter' && previewUrl && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 mx-auto" style={{ aspectRatio: '9/16', maxWidth: '280px' }}>
                {selectedFile?.type.startsWith('video/') ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      style={{ filter: TIKTOK_FILTERS.find(f => f.id === selectedFilter)?.style }}
                      loop
                      muted
                    />
                    <button
                      onClick={handleVideoToggle}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
                    >
                      {isVideoPlaying ? (
                        <Pause className="h-12 w-12 text-white drop-shadow-lg" />
                      ) : (
                        <Play className="h-12 w-12 text-white drop-shadow-lg" />
                      )}
                    </button>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ filter: TIKTOK_FILTERS.find(f => f.id === selectedFilter)?.style }}
                  />
                )}
                
                {/* Current Filter Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center">
                    <span className="mr-2">{TIKTOK_FILTERS.find(f => f.id === selectedFilter)?.emoji}</span>
                    {TIKTOK_FILTERS.find(f => f.id === selectedFilter)?.name}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gradient-text">
                  <Palette className="h-5 w-5 ml-2" />
                  الفلاتر السحرية
                </h3>
                <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                  {TIKTOK_FILTERS.map((filter, index) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex-shrink-0 w-20 p-3 rounded-2xl border-2 transition-all tiktok-button ${
                        selectedFilter === filter.id
                          ? 'border-pink-500 bg-pink-500/20 scale-105'
                          : 'border-white/30 bg-white/10 hover:bg-white/20'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-2xl mb-1">{filter.emoji}</div>
                      <div className="text-xs text-white font-medium">{filter.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between space-x-4 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  className="border-white/30 text-black hover:bg-white/10 rounded-2xl flex-1 tiktok-button"
                >
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
                <Button
                  onClick={() => setCurrentStep('details')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl flex-1 tiktok-button"
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  التالي
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              {/* Small Preview with Caption */}
              <div className="flex items-start space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0 w-16 h-20 rounded-2xl overflow-hidden bg-gray-900">
                  {selectedFile?.type.startsWith('video/') ? (
                    <video
                      src={previewUrl!}
                      className="w-full h-full object-cover"
                      style={{ filter: TIKTOK_FILTERS.find(f => f.id === selectedFilter)?.style }}
                      muted
                    />
                  ) : (
                    <img
                      src={previewUrl!}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      style={{ filter: TIKTOK_FILTERS.find(f => f.id === selectedFilter)?.style }}
                    />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 glass-effect">
                    <Textarea
                      value={formData.caption}
                      onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="اكتب وصفاً مميزاً لذكرتك... 🌟"
                      className="bg-transparent border-none text-white placeholder:text-gray-300 resize-none p-0 focus:ring-0 text-right"
                      rows={4}
                      maxLength={150}
                    />
                    <div className="text-gray-400 text-xs mt-2 text-left">
                      {formData.caption.length}/150
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Type */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 glass-effect">
                <h3 className="text-white font-semibold mb-4 flex items-center gradient-text">
                  <Zap className="h-5 w-5 ml-2" />
                  نوع الذكرى
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {MEMORY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, memoryType: type.id as any }))}
                      className={`p-4 rounded-2xl border-2 transition-all tiktok-button ${
                        formData.memoryType === type.id
                          ? 'border-pink-500 bg-pink-500/20 scale-105'
                          : 'border-white/30 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center text-2xl mb-2 mx-auto`}>
                        {type.emoji}
                      </div>
                      <h4 className="text-white font-semibold text-center">{type.name}</h4>
                      <p className="text-gray-300 text-xs text-center mt-1">{type.duration}</p>
                      <p className="text-gray-400 text-xs text-center mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 glass-effect">
                <h3 className="text-white font-semibold mb-4 flex items-center gradient-text">
                  <Globe className="h-5 w-5 ml-2" />
                  من يمكنه رؤية ذكرتك؟
                </h3>
                <div className="space-y-3">
                  {PRIVACY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, visibilityLevel: option.value as any }))}
                        className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl transition-all tiktok-button ${
                          formData.visibilityLevel === option.value
                            ? 'bg-pink-500/20 border border-pink-500/50'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${option.color}`} />
                        <div className="flex-1 text-right">
                          <div className="text-white font-medium">{option.label}</div>
                          <div className="text-gray-300 text-sm">{option.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.visibilityLevel === option.value
                            ? 'border-pink-500 bg-pink-500'
                            : 'border-white/30'
                        }`}>
                          {formData.visibilityLevel === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interaction Settings */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 glass-effect">
                <h3 className="text-white font-semibold mb-4 gradient-text">إعدادات التفاعل</h3>
                <div className="space-y-4">
                  {[
                    { key: 'allowComments', icon: MessageCircle, label: 'السماح بالتعليقات', color: 'text-blue-400' },
                    { key: 'allowSharing', icon: Share2, label: 'السماح بالمشاركة', color: 'text-green-400' },
                    { key: 'allowGifts', icon: Gift, label: 'السماح بالهدايا', color: 'text-purple-400' }
                  ].map((setting) => {
                    const Icon = setting.icon;
                    return (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Icon className={`h-5 w-5 ${setting.color}`} />
                          <span className="text-white font-medium">{setting.label}</span>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            [setting.key]: !prev[setting.key as keyof typeof prev] 
                          }))}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            formData[setting.key as keyof typeof formData]
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                              : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                            formData[setting.key as keyof typeof formData]
                              ? 'translate-x-6 rtl:-translate-x-6'
                              : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between space-x-4 rtl:space-x-reverse pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('filter')}
                  className="border-white/30 text-black hover:bg-white/10 rounded-2xl flex-1 tiktok-button"
                >
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  رجوع
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl flex-1 shadow-lg tiktok-button relative overflow-hidden"
                >
                  {/* Progress bar background */}
                  {isUploading && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    {isUploading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                        <span>جاري النشر... {Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Sparkles className="h-5 w-5 ml-2" />
                        نشر الذكرى
                      </div>
                    )}
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}