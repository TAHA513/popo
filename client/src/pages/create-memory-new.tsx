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

          {/* Step 1: Media Capture */}
          {currentStep === 'capture' && (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  اختر الوسائط
                </CardTitle>
                <p className="text-gray-600">التقط صورة أو فيديو أو اختر من المعرض</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera Options - Enhanced with more options */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    className="h-20 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex-col space-y-1 text-white shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-7 h-7" />
                    <span className="text-xs font-medium">التقط صورة</span>
                  </Button>
                  
                  <Button
                    size="lg"
                    className="h-20 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 flex-col space-y-1 text-white shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Video className="w-7 h-7" />
                    <span className="text-xs font-medium">سجل فيديو</span>
                  </Button>
                </div>

                {/* Additional Quick Options */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-16 border-2 border-green-200 hover:bg-green-50 flex-col space-y-1 text-green-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-xs">المعرض</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-16 border-2 border-orange-200 hover:bg-orange-50 flex-col space-y-1 text-orange-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs">إبداعي</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-16 border-2 border-pink-200 hover:bg-pink-50 flex-col space-y-1 text-pink-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-xs">شخصي</span>
                  </Button>
                </div>

                {/* Upload Zone - Enhanced */}
                <div 
                  className="border-2 border-dashed border-purple-300 rounded-2xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="relative">
                    <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3 group-hover:text-purple-600 transition-colors" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-700 mb-1 font-medium">اسحب ملفاتك هنا</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    📸 صور: JPG, PNG, WEBP<br />
                    🎬 فيديو: MP4, MOV, WEBM<br />
                    ⚡ حد أقصى: 5 ملفات
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
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