import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Video, 
  Image as ImageIcon, 
  X, 
  ArrowLeft,
  Music,
  Sparkles,
  Palette,
  Filter,
  Settings,
  Globe,
  Users,
  Lock,
  MessageCircle,
  Share2,
  Heart,
  Plus,
  Upload,
  Play,
  Pause
} from "lucide-react";

// TikTok-inspired filters
const TIKTOK_FILTERS = [
  { id: 'none', name: 'الأصلي', icon: '✨', style: '' },
  { id: 'vintage', name: 'كلاسيكي', icon: '📸', style: 'sepia(0.6) brightness(1.1) contrast(1.1)' },
  { id: 'dramatic', name: 'دراماتيكي', icon: '🎭', style: 'contrast(1.4) saturate(1.3) brightness(0.9)' },
  { id: 'warm', name: 'دافئ', icon: '☀️', style: 'hue-rotate(15deg) saturate(1.2) brightness(1.1)' },
  { id: 'cool', name: 'بارد', icon: '❄️', style: 'hue-rotate(-20deg) saturate(1.1) brightness(1.05)' },
  { id: 'vibrant', name: 'حيوي', icon: '🌈', style: 'saturate(1.5) contrast(1.2) brightness(1.1)' },
  { id: 'mono', name: 'أبيض وأسود', icon: '⚫', style: 'grayscale(1) contrast(1.2)' },
  { id: 'pink', name: 'وردي', icon: '🌸', style: 'hue-rotate(300deg) saturate(1.3)' }
];

const PRIVACY_OPTIONS = [
  { value: 'public', icon: Globe, label: 'عام', desc: 'يمكن للجميع رؤيته' },
  { value: 'followers', icon: Users, label: 'المتابعون', desc: 'للمتابعين فقط' },
  { value: 'private', icon: Lock, label: 'خاص', desc: 'لك فقط' }
];

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'filter' | 'details'>('upload');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const [formData, setFormData] = useState({
    caption: "",
    privacy: "public",
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

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCurrentStep('filter');
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
      privacy: "public",
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

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('media', selectedFile);
      formDataToSend.append('caption', formData.caption);
      formDataToSend.append('visibilityLevel', formData.privacy);
      formDataToSend.append('allowComments', formData.allowComments.toString());
      formDataToSend.append('allowSharing', formData.allowSharing.toString());
      formDataToSend.append('allowGifts', formData.allowGifts.toString());
      formDataToSend.append('filter', selectedFilter);

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('فشل في نشر المحتوى');
      }

      toast({
        title: "تم النشر بنجاح! 🎉",
        description: "تم نشر محتواك وهو متاح الآن للآخرين",
      });

      resetUpload();
      
      // Navigate to feed
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في النشر",
        description: "حدث خطأ أثناء نشر المحتوى. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
      
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
            <h1 className="text-xl font-bold text-white">إنشاء منشور</h1>
          </div>
          
          <div className="w-10"></div>
        </div>

        {/* Content Area */}
        <div className="px-4 pb-20">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
                  <span className="text-2xl">🐰</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">شارك لحظتك</h2>
                <p className="text-gray-300">اختر صورة أو فيديو لمشاركته مع الآخرين</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 text-center hover:bg-white/20 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white font-medium">صورة</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 text-center hover:bg-white/20 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white font-medium">فيديو</span>
                </button>
              </div>

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
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 mx-auto" style={{ aspectRatio: '9/16', maxWidth: '300px' }}>
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
                        <Pause className="h-12 w-12 text-white" />
                      ) : (
                        <Play className="h-12 w-12 text-white" />
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
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  الفلاتر
                </h3>
                <div className="flex overflow-x-auto space-x-3 pb-2">
                  {TIKTOK_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 transition-all ${
                        selectedFilter === filter.id
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-white/30 bg-white/10'
                      }`}
                    >
                      <div className="text-2xl">{filter.icon}</div>
                      <div className="text-xs text-white mt-1">{filter.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  className="border-white/30 text-white hover:bg-white/10 rounded-2xl"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => setCurrentStep('details')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl px-8"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              {/* Small Preview */}
              <div className="flex items-start space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden bg-gray-900">
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
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                    <Textarea
                      value={formData.caption}
                      onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="اكتب وصفاً لمنشورك..."
                      className="bg-transparent border-none text-white placeholder:text-gray-300 resize-none p-0 focus:ring-0 text-right"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  من يمكنه رؤية هذا المنشور؟
                </h3>
                <div className="space-y-3">
                  {PRIVACY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, privacy: option.value }))}
                        className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl transition-all ${
                          formData.privacy === option.value
                            ? 'bg-pink-500/20 border border-pink-500/50'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                        <div className="flex-1 text-right">
                          <div className="text-white font-medium">{option.label}</div>
                          <div className="text-gray-300 text-sm">{option.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.privacy === option.value
                            ? 'border-pink-500 bg-pink-500'
                            : 'border-white/30'
                        }`}>
                          {formData.privacy === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interaction Settings */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-4">إعدادات التفاعل</h3>
                <div className="space-y-3">
                  {[
                    { key: 'allowComments', icon: MessageCircle, label: 'السماح بالتعليقات' },
                    { key: 'allowSharing', icon: Share2, label: 'السماح بالمشاركة' },
                    { key: 'allowGifts', icon: Heart, label: 'السماح بالهدايا' }
                  ].map((setting) => {
                    const Icon = setting.icon;
                    return (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Icon className="h-5 w-5 text-white" />
                          <span className="text-white">{setting.label}</span>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            [setting.key]: !prev[setting.key as keyof typeof prev] 
                          }))}
                          className={`w-12 h-6 rounded-full transition-all ${
                            formData[setting.key as keyof typeof formData]
                              ? 'bg-pink-500'
                              : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            formData[setting.key as keyof typeof formData]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between space-x-4 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('filter')}
                  className="border-white/30 text-white hover:bg-white/10 rounded-2xl flex-1"
                >
                  رجوع
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl flex-1"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      جاري النشر...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      نشر
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}