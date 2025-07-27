import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Image, Video, Upload, X, ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import SimpleNavigation from "@/components/simple-navigation";

export default function CreateMemoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [memoryType, setMemoryType] = useState<'public' | 'private' | 'friends'>('public');
  const [category, setCategory] = useState('عام');

  const categories = [
    'عام', 'طبيعة', 'سفر', 'طعام', 'رياضة', 'تقنية', 
    'فن', 'موسيقى', 'تعليم', 'صحة', 'عائلة', 'أصدقاء'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: "حد أقصى 5 ملفات",
        description: "يمكنك رفع 5 ملفات كحد أقصى",
        variant: "destructive"
      });
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createMemory = async () => {
    if (!title.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للذكرى",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // رفع الملفات أولاً
      const mediaUrls: string[] = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          mediaUrls.push(result.url);
        }
      }

      // إنشاء الذكرى
      const memoryData = {
        title,
        content: description,
        mediaUrls,
        memoryType,
        category,
        type: selectedFiles.some(f => f.type.startsWith('video/')) ? 'video' : 'image'
      };

      const response = await apiRequest('/api/memories', 'POST', memoryData);
      
      if (response?.success) {
        toast({
          title: "تم إنشاء الذكرى!",
          description: "تمت إضافة ذكرتك بنجاح",
        });
        setLocation('/');
      } else {
        throw new Error('فشل في إنشاء الذكرى');
      }
    } catch (error) {
      console.error('Error creating memory:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: "حدث خطأ أثناء إنشاء الذكرى",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">تسجيل الدخول مطلوب</h2>
            <p className="text-white/80 mb-6">يجب تسجيل الدخول لإنشاء ذكرى جديدة</p>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <SimpleNavigation />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-lg border-white/40 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-between mb-4">
                <Button
                  onClick={() => setLocation('/')}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-5 h-5 ml-2" />
                  رجوع
                </Button>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                  <Plus className="w-6 h-6 ml-2 text-purple-600" />
                  إنشاء ذكرى جديدة
                </CardTitle>
                <div></div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* عنوان الذكرى */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">عنوان الذكرى *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="أدخل عنوان جذاب لذكرتك..."
                  className="text-lg p-4"
                  maxLength={100}
                />
              </div>

              {/* وصف الذكرى */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">وصف الذكرى (اختياري)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصف أو قصة عن هذه الذكرى..."
                  className="min-h-24 text-lg p-4"
                  maxLength={500}
                />
              </div>

              {/* نوع الذكرى */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">نوع الذكرى</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'public', label: 'عامة', desc: 'يراها الجميع', color: 'bg-green-100 text-green-700 border-green-300' },
                    { value: 'friends', label: 'أصدقاء', desc: 'الأصدقاء فقط', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                    { value: 'private', label: 'خاصة', desc: 'أنت فقط', color: 'bg-gray-100 text-gray-700 border-gray-300' }
                  ].map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setMemoryType(type.value as any)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        memoryType === type.value 
                          ? type.color + ' shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* فئة الذكرى */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">فئة الذكرى</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`p-3 text-center cursor-pointer transition-all ${
                        category === cat 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* رفع الملفات */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">الصور والفيديوهات</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">اضغط لرفع الصور والفيديوهات</p>
                  <p className="text-sm text-gray-500">حد أقصى 5 ملفات • JPG, PNG, MP4, MOV</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* معاينة الملفات المحددة */}
              {selectedFiles.length > 0 && (
                <div>
                  <label className="block text-gray-700 font-medium mb-3">الملفات المحددة ({selectedFiles.length})</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={getFilePreview(file) || ''}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Video className="w-8 h-8 text-gray-500" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Image className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => removeFile(index)}
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* أزرار الإجراء */}
              <div className="flex space-x-4 rtl:space-x-reverse pt-4">
                <Button
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="flex-1 py-3 text-lg"
                >
                  إلغاء
                </Button>
                
                <Button
                  onClick={createMemory}
                  disabled={isUploading || !title.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-bold disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>جاري الإنشاء...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <Check className="w-5 h-5" />
                      <span>إنشاء الذكرى</span>
                    </div>
                  )}
                </Button>
              </div>

              <div className="text-center text-gray-600 text-sm">
                💡 تلميح: اختر صور وفيديوهات واضحة وذات جودة عالية للحصول على أفضل تفاعل
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}