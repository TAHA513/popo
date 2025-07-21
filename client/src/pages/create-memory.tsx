import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  X
} from "lucide-react";
import NavigationHeader from "@/components/navigation-header";

export default function CreateMemoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      setFormData({
        title: "",
        caption: "",
        memoryType: "fleeting",
        visibilityLevel: "public",
        allowComments: true,
        allowSharing: true,
        allowGifts: true
      });

      // Redirect to profile after short delay
      setTimeout(() => {
        window.location.href = '/profile';
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

  const getMemoryTypeInfo = (type: string) => {
    switch (type) {
      case 'fleeting':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'عابر',
          color: 'from-blue-400 to-cyan-400',
          description: 'تختفي خلال 24 ساعة - مثالية للحظات السريعة'
        };
      case 'precious':
        return {
          icon: <Heart className="w-5 h-5" />,
          label: 'ثمين',
          color: 'from-purple-400 to-pink-400',
          description: 'تدوم أسبوع - للذكريات المهمة'
        };
      case 'legendary':
        return {
          icon: <Crown className="w-5 h-5" />,
          label: 'أسطوري',
          color: 'from-yellow-400 to-orange-400',
          description: 'تدوم شهر - للحظات الاستثنائية'
        };
      default:
        return {
          icon: <Sparkles className="w-5 h-5" />,
          label: 'عابر',
          color: 'from-gray-400 to-gray-500',
          description: 'نوع الذكرى'
        };
    }
  };

  const getVisibilityInfo = (level: string) => {
    switch (level) {
      case 'public':
        return { icon: <Globe className="w-4 h-4" />, label: 'عام - يمكن للجميع رؤيتها' };
      case 'followers':
        return { icon: <Users className="w-4 h-4" />, label: 'المتابعون - للمتابعين فقط' };
      case 'private':
        return { icon: <Lock className="w-4 h-4" />, label: 'خاص - لك فقط' };
      default:
        return { icon: <Globe className="w-4 h-4" />, label: 'عام' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              إنشاء ذكرى جديدة ✨
            </CardTitle>
            <p className="text-gray-600">شارك لحظاتك المميزة مع العالم</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* File Upload Area */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">الملفات</Label>
                
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-purple-500 mb-4" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      اختر الصور أو الفيديوهات
                    </p>
                    <p className="text-sm text-gray-500">
                      حد أقصى 5 ملفات • JPG, PNG, MP4, WebM
                    </p>
                  </label>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Video className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">العنوان (اختياري)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أضف عنواناً لذكرتك..."
                  className="text-right"
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">الوصف</Label>
                <Textarea
                  id="caption"
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="اكتب وصفاً لذكرتك... ما الذي يجعلها مميزة؟"
                  className="text-right min-h-[100px] resize-none"
                />
              </div>

              {/* Memory Type */}
              <div className="space-y-3">
                <Label>نوع الذكرى</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['fleeting', 'precious', 'legendary'] as const).map((type) => {
                    const info = getMemoryTypeInfo(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, memoryType: type }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.memoryType === type
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-white mb-2 mx-auto`}>
                          {info.icon}
                        </div>
                        <h3 className="font-semibold text-center">{info.label}</h3>
                        <p className="text-xs text-gray-600 text-center mt-1">{info.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-3">
                <Label>من يمكنه رؤية هذه الذكرى؟</Label>
                <Select 
                  value={formData.visibilityLevel} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, visibilityLevel: value }))}
                >
                  <SelectTrigger>
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
                        <span>المتابعون - للمتابعين فقط</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Lock className="w-4 h-4" />
                        <span>خاص - لك فقط</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interaction Settings */}
              <div className="space-y-4">
                <Label>إعدادات التفاعل</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span>السماح بالتعليقات</span>
                    </div>
                    <Switch
                      checked={formData.allowComments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Share2 className="w-4 h-4 text-green-500" />
                      <span>السماح بالمشاركة</span>
                    </div>
                    <Switch
                      checked={formData.allowSharing}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowSharing: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Gift className="w-4 h-4 text-purple-500" />
                      <span>السماح بالهدايا</span>
                    </div>
                    <Switch
                      checked={formData.allowGifts}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowGifts: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 rtl:space-x-reverse">
                <Button
                  type="submit"
                  disabled={isUploading || selectedFiles.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      إنشاء الذكرى
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/profile'}
                  className="px-8"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}