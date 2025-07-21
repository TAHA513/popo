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
  Plus
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";

// Filter presets like Instagram/TikTok
const FILTERS = [
  { id: 'none', name: 'الأصلي', icon: Sun, style: '' },
  { id: 'vintage', name: 'كلاسيكي', icon: Clock, style: 'sepia(0.5) brightness(1.1)' },
  { id: 'dramatic', name: 'دراماتيكي', icon: Contrast, style: 'contrast(1.3) saturate(1.2)' },
  { id: 'warm', name: 'دافئ', icon: Sun, style: 'hue-rotate(15deg) saturate(1.1)' },
  { id: 'cool', name: 'بارد', icon: Moon, style: 'hue-rotate(-15deg) brightness(1.1)' },
  { id: 'bright', name: 'مشرق', icon: Settings, style: 'brightness(1.2) saturate(1.3)' },
  { id: 'mono', name: 'أبيض وأسود', icon: Palette, style: 'grayscale(1) contrast(1.1)' }
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
                {/* Camera Options */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="h-24 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 flex-col space-y-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm">التقط صورة</span>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 border-2 border-purple-200 hover:bg-purple-50 flex-col space-y-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-8 h-8" />
                    <span className="text-sm">من المعرض</span>
                  </Button>
                </div>

                {/* Upload Zone */}
                <div 
                  className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">اسحب الملفات هنا أو انقر للاختيار</p>
                  <p className="text-sm text-gray-500">يدعم: JPG, PNG, MP4, MOV (حد أقصى 5 ملفات)</p>
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
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  اختر الفلتر
                </CardTitle>
                <p className="text-gray-600">أضف لمسة جمالية لصورتك</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  {selectedFiles[0] && (
                    selectedFiles[0].type.startsWith('image/') ? (
                      <img
                        src={getFilePreview(selectedFiles[0])}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                        style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style }}
                      />
                    ) : (
                      <video
                        src={getFilePreview(selectedFiles[0])}
                        className="w-full h-64 object-cover"
                        style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.style }}
                        muted
                        autoPlay
                        loop
                      />
                    )
                  )}
                </div>

                {/* Filter Options */}
                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                  {FILTERS.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          selectedFilter === filter.id
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-xs font-medium">{filter.name}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('capture')}
                    className="border-purple-200 hover:bg-purple-50"
                  >
                    رجوع
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('details')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
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