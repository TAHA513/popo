import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Image, 
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
  ArrowRight,
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
  Stars,
  Flame,
  Snowflake,
  Cherry,
  Sunset,
  Mountain,
  Waves,
  Coffee,
  Flower2,
  Rainbow,
  Gem,
  Leaf
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";

// Enhanced filter presets with unique concepts
const FILTERS = [
  { id: 'none', name: 'طبيعي', icon: Sun, style: '', color: 'bg-yellow-100' },
  { id: 'vintage', name: 'تراثي', icon: Clock, style: 'sepia(0.6) brightness(1.1) contrast(1.1)', color: 'bg-amber-100' },
  { id: 'dramatic', name: 'مسرحي', icon: Contrast, style: 'contrast(1.4) saturate(1.3) brightness(0.9)', color: 'bg-gray-100' },
  { id: 'warm', name: 'غروب', icon: Sunset, style: 'hue-rotate(15deg) saturate(1.2) brightness(1.1)', color: 'bg-orange-100' },
  { id: 'cool', name: 'جليدي', icon: Snowflake, style: 'hue-rotate(-15deg) brightness(1.1) saturate(1.1)', color: 'bg-blue-100' },
  { id: 'bright', name: 'مشع', icon: Stars, style: 'brightness(1.3) saturate(1.4) contrast(1.1)', color: 'bg-cyan-100' },
  { id: 'mono', name: 'كلاسيك', icon: Palette, style: 'grayscale(1) contrast(1.2) brightness(1.1)', color: 'bg-slate-100' },
  { id: 'cherry', name: 'وردي حالم', icon: Cherry, style: 'hue-rotate(300deg) saturate(1.3) brightness(1.1)', color: 'bg-pink-100' },
  { id: 'forest', name: 'طبيعة', icon: Leaf, style: 'hue-rotate(90deg) saturate(1.2) contrast(1.1)', color: 'bg-green-100' },
  { id: 'ocean', name: 'محيطي', icon: Waves, style: 'hue-rotate(180deg) saturate(1.3) brightness(1.1)', color: 'bg-teal-100' },
  { id: 'fire', name: 'نار', icon: Flame, style: 'hue-rotate(20deg) saturate(1.5) contrast(1.2) brightness(1.1)', color: 'bg-red-100' },
  { id: 'coffee', name: 'قهوة', icon: Coffee, style: 'sepia(0.3) saturate(1.1) brightness(0.9) contrast(1.2)', color: 'bg-amber-100' },
  { id: 'dream', name: 'حلمي', icon: Sparkles, style: 'blur(0.3px) saturate(1.4) brightness(1.2)', color: 'bg-purple-100' },
  { id: 'gem', name: 'جوهري', icon: Gem, style: 'saturate(1.6) contrast(1.3) brightness(1.1)', color: 'bg-indigo-100' },
  { id: 'rainbow', name: 'قوس قزح', icon: Rainbow, style: 'hue-rotate(45deg) saturate(1.5) brightness(1.2)', color: 'bg-gradient-to-r from-red-100 to-purple-100' }
];

export default function CreateMemoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<'capture' | 'filter' | 'details'>('capture');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    memoryType: "fleeting" as "fleeting" | "precious" | "legendary",
    visibilityLevel: "public" as "public" | "followers" | "private",
    allowComments: true,
    allowSharing: true,
    allowGifts: true
  });
  const [showYinYang, setShowYinYang] = useState(false);
  const [selectedContentFilter, setSelectedContentFilter] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({
        title: "حد أقصى 5 ملفات",
        description: "يمكنك رفع حد أقصى 5 ملفات في الذكرى الواحدة",
        variant: "destructive"
      });
      return;
    }
    setSelectedFiles(files);
    if (files.length > 0) {
      setCurrentStep('filter');
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setCurrentStep('capture');
    }
  };

  const getFilePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast({
        title: "يجب اختيار ملف",
        description: "يرجى اختيار صورة أو فيديو لإنشاء الذكرى",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add files
      selectedFiles.forEach(file => {
        formDataToSend.append('media', file);
      });
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      // Add filter
      formDataToSend.append('filter', selectedFilter);

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('فشل في رفع الذكرى');
      }

      const result = await response.json();
      
      toast({
        title: "تم إنشاء الذكرى بنجاح! ✨",
        description: "تم رفع ذكرتك وهي الآن متاحة للآخرين",
      });

      // Reset form
      setSelectedFiles([]);
      setCurrentStep('capture');
      setSelectedFilter('none');
      setFormData({
        title: "",
        caption: "",
        memoryType: "fleeting",
        visibilityLevel: "public",
        allowComments: true,
        allowSharing: true,
        allowGifts: true
      });

      // Redirect to feed after short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في الرفع",
        description: "حدث خطأ أثناء رفع الذكرى. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto md:max-w-2xl">
          {/* Progress Steps */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {['capture', 'filter', 'details'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    currentStep === step 
                      ? 'bg-purple-600 text-white' 
                      : index < ['capture', 'filter', 'details'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      index < ['capture', 'filter', 'details'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Innovative Pop-up Design */}
          {currentStep === 'capture' && (
            <div className="relative">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 backdrop-blur-3xl rounded-3xl"></div>
              
              <Card className="relative shadow-2xl border-0 bg-white/10 backdrop-blur-xl overflow-hidden">
                {/* Header Section */}
                <CardHeader className="text-center pb-8 pt-12">
                  <div className="relative mb-8">
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                      🎥 ابدأ إبداعك الآن
                    </CardTitle>
                    
                    {/* Animated Pulse Button */}
                    <div className="relative flex justify-center mb-8">
                      <div className="absolute w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
                      <div className="absolute w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-40"></div>
                      <Button
                        className="relative w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl hover:scale-110 transition-all duration-300"
                        onClick={() => setShowYinYang(!showYinYang)}
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      </Button>
                    </div>
                    
                    <p className="text-white/80 text-lg">انقر لبدء التصوير أو اختيار وسائط</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 px-8 pb-12">
                  {/* Yin-Yang Circles */}
                  {showYinYang && (
                    <div className="flex justify-center items-center mb-8">
                      <div className="relative w-80 h-40 flex items-center justify-center">
                        {/* Camera Circle (Left) */}
                        <Button
                          className="absolute left-0 w-32 h-32 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-full shadow-2xl hover:scale-110 transition-all duration-500 flex-col space-y-2 text-white transform hover:rotate-12"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-8 h-8" />
                          <span className="text-xs font-bold">صوّر الآن</span>
                        </Button>
                        
                        {/* Gallery Circle (Right) */}
                        <Button
                          className="absolute right-0 w-32 h-32 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-800 rounded-full shadow-2xl hover:scale-110 transition-all duration-500 flex-col space-y-2 text-white transform hover:-rotate-12"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Image className="w-8 h-8" />
                          <span className="text-xs font-bold">من معرضك</span>
                        </Button>
                        
                        {/* Center Connection */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-spin"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content Filters */}
                  <div className="space-y-4">
                    <h3 className="text-white/90 text-lg font-semibold text-center">🔲 فلاتر المحتوى</h3>
                    <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                      {[
                        { id: 'creative', name: 'إبداعي', icon: '✨', color: 'from-yellow-500 to-orange-500' },
                        { id: 'personal', name: 'شخصي', icon: '❤️', color: 'from-pink-500 to-red-500' },
                        { id: 'fun', name: 'ترفيهي', icon: '🎭', color: 'from-green-500 to-teal-500' },
                        { id: 'art', name: 'فنّي', icon: '🎨', color: 'from-purple-500 to-indigo-500' },
                        { id: 'story', name: 'حكاية', icon: '💬', color: 'from-blue-500 to-cyan-500' }
                      ].map((filter) => (
                        <Button
                          key={filter.id}
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${filter.color} shadow-lg hover:scale-110 transition-all duration-300 flex-col space-y-1 text-white text-xs font-bold hover:shadow-2xl ${
                            selectedContentFilter === filter.id ? 'ring-4 ring-white/50 scale-110' : ''
                          }`}
                          onClick={() => {
                            setSelectedContentFilter(filter.id);
                          }}
                        >
                          <span className="text-lg">{filter.icon}</span>
                          <span>{filter.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Wave-shaped Drag & Drop Zone */}
                  <div className="relative">
                    <div 
                      className="relative bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border-2 border-dashed border-white/30 cursor-pointer hover:border-white/50 hover:bg-white/20 transition-all duration-300 group overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {/* Wave Pattern Background */}
                      <div className="absolute inset-0 opacity-20">
                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <path d="M0,50 Q100,20 200,50 T400,50 L400,100 L0,100 Z" fill="url(#wave-gradient)" />
                          <defs>
                            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8B5CF6" />
                              <stop offset="50%" stopColor="#EC4899" />
                              <stop offset="100%" stopColor="#3B82F6" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      
                      {/* Content */}
                      <div className="relative text-center">
                        <div className="mb-4">
                          <Upload className="w-12 h-12 text-white/80 mx-auto mb-2 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto animate-bounce opacity-60"></div>
                        </div>
                        
                        <p className="text-white font-semibold text-lg mb-2">🗂️ اسحب ملفاتك هنا</p>
                        <div className="text-white/70 text-sm space-y-1">
                          <p>📸 JPG / PNG / WEBP</p>
                          <p>🎥 MP4 / MOV / WEBM</p>
                          <p>⚡ حتى 5 ملفات</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Filters */}
          {currentStep === 'filter' && selectedFiles.length > 0 && (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                  <Filter className="w-6 h-6" />
                  اختر الفلتر السحري
                  <Sparkles className="w-6 h-6" />
                </CardTitle>
                <p className="text-gray-600">اجعل صورتك تتألق بلمسة فنية مميزة</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Preview with Frame */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl border-4 border-white">
                  {selectedFiles[0] && (
                    selectedFiles[0].type.startsWith('image/') ? (
                      <img
                        src={getFilePreview(selectedFiles[0])}
                        alt="Preview"
                        className="w-full h-72 object-cover transition-all duration-500"
                        style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style }}
                      />
                    ) : (
                      <video
                        src={getFilePreview(selectedFiles[0])}
                        className="w-full h-72 object-cover transition-all duration-500"
                        style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style }}
                        muted
                        autoPlay
                        loop
                      />
                    )
                  )}
                  
                  {/* Filter Name Overlay */}
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {FILTERS.find(f => f.id === selectedFilter)?.name || 'طبيعي'}
                  </div>
                  
                  {/* Decorative corners */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-white/50 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-white/50 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
                </div>

                {/* Filter Options - Enhanced Grid */}
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2">
                  {FILTERS.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`p-2 rounded-2xl border-2 transition-all text-center relative overflow-hidden ${
                          selectedFilter === filter.id
                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-lg transform scale-105'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 hover:scale-102'
                        }`}
                      >
                        {/* Background Color */}
                        <div className={`absolute inset-0 ${filter.color} opacity-20`} />
                        
                        {/* Icon with gradient background */}
                        <div className={`relative w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                          selectedFilter === filter.id 
                            ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                            : 'bg-white shadow-sm text-gray-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <p className={`text-xs font-medium relative ${
                          selectedFilter === filter.id ? 'text-purple-800' : 'text-gray-700'
                        }`}>
                          {filter.name}
                        </p>
                        
                        {/* Selection indicator */}
                        {selectedFilter === filter.id && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Enhanced Navigation */}
                <div className="flex justify-between items-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('capture')}
                    className="border-purple-200 hover:bg-purple-50 px-6 py-3 rounded-2xl"
                  >
                    <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                    رجوع
                  </Button>
                  
                  {/* Filter Count Indicator */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="flex space-x-1 rtl:space-x-reverse">
                      {FILTERS.slice(0, 5).map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-purple-200 rounded-full" />
                      ))}
                      <span className="text-xs text-gray-500 mr-1">+{FILTERS.length - 5}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setCurrentStep('details')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl shadow-lg"
                  >
                    التالي
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Details */}
          {currentStep === 'details' && (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  إضافة التفاصيل
                </CardTitle>
                <p className="text-gray-600">أضف وصف وإعدادات للمنشور</p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Final Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-4">
                      {selectedFiles[0].type.startsWith('image/') ? (
                        <img
                          src={getFilePreview(selectedFiles[0])}
                          alt="Final Preview"
                          className="w-full h-48 object-cover"
                          style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style }}
                        />
                      ) : (
                        <video
                          src={getFilePreview(selectedFiles[0])}
                          className="w-full h-48 object-cover"
                          style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style }}
                          muted
                        />
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-gray-700">
                          {FILTERS.find(f => f.id === selectedFilter)?.name}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('filter')}
                        className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Caption */}
                  <div className="space-y-2">
                    <Label htmlFor="caption">اكتب تعليقاً...</Label>
                    <Textarea
                      id="caption"
                      value={formData.caption}
                      onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="شارك أفكارك أو اكتب وصفاً لهذا المنشور..."
                      className="text-right min-h-[100px] resize-none border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  {/* Memory Type - Simplified */}
                  <div className="space-y-3">
                    <Label>مدة العرض</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: 'fleeting', label: '24 ساعة', icon: Clock, color: 'from-blue-400 to-cyan-400' },
                        { type: 'precious', label: 'أسبوع', icon: Heart, color: 'from-purple-400 to-pink-400' },
                        { type: 'legendary', label: 'شهر', icon: Crown, color: 'from-yellow-400 to-orange-400' }
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, memoryType: option.type as any }))}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              formData.memoryType === option.type
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white mb-2 mx-auto`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-medium">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-3">
                    <Label>من يستطيع المشاهدة؟</Label>
                    <Select 
                      value={formData.visibilityLevel} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, visibilityLevel: value }))}
                    >
                      <SelectTrigger className="border-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Globe className="w-4 h-4" />
                            <span>عام - يمكن للجميع رؤيتها</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="followers">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Users className="w-4 h-4" />
                            <span>المتابعون فقط</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Lock className="w-4 h-4" />
                            <span>خاص - لي فقط</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interaction Settings - Simplified */}
                  <div className="space-y-4">
                    <Label>إعدادات التفاعل</Label>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-2">
                        <MessageCircle className="w-6 h-6 text-blue-500 mx-auto" />
                        <p className="text-sm">تعليقات</p>
                        <Switch
                          checked={formData.allowComments}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Share2 className="w-6 h-6 text-green-500 mx-auto" />
                        <p className="text-sm">مشاركة</p>
                        <Switch
                          checked={formData.allowSharing}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowSharing: checked }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Gift className="w-6 h-6 text-purple-500 mx-auto" />
                        <p className="text-sm">هدايا</p>
                        <Switch
                          checked={formData.allowGifts}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowGifts: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('filter')}
                      className="border-purple-200 hover:bg-purple-50"
                    >
                      رجوع
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUploading || selectedFiles.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 flex-1 mr-4"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          جاري النشر...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          نشر الذكرى
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}