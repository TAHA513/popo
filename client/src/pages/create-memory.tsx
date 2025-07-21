import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  Heart, 
  Zap, 
  Clock,
  MapPin,
  Cloud,
  Sun,
  Moon,
  Star,
  Upload,
  X
} from "lucide-react";
import NavigationHeader from "@/components/navigation-header";

type MediaFile = {
  file: File;
  url: string;
  type: 'image' | 'video';
};

type MemoryMood = 'happy' | 'nostalgic' | 'creative' | 'mysterious' | 'dreamy' | 'energetic';
type MemoryType = 'fleeting' | 'precious' | 'legendary';

const moods: { value: MemoryMood; label: string; emoji: string; color: string }[] = [
  { value: 'happy', label: 'سعيد', emoji: '😊', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'nostalgic', label: 'حنين', emoji: '🌅', color: 'bg-orange-100 text-orange-800' },
  { value: 'creative', label: 'إبداعي', emoji: '🎨', color: 'bg-purple-100 text-purple-800' },
  { value: 'mysterious', label: 'غامض', emoji: '🌙', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'dreamy', label: 'حالم', emoji: '✨', color: 'bg-pink-100 text-pink-800' },
  { value: 'energetic', label: 'نشيط', emoji: '⚡', color: 'bg-green-100 text-green-800' },
];

const memoryTypes: { value: MemoryType; label: string; description: string; icon: any }[] = [
  { 
    value: 'fleeting', 
    label: 'عابر', 
    description: 'يختفي بسرعة، مثل نسمة عابرة',
    icon: Clock
  },
  { 
    value: 'precious', 
    label: 'ثمين', 
    description: 'يدوم أكثر، ذكرى قيمة',
    icon: Heart
  },
  { 
    value: 'legendary', 
    label: 'أسطوري', 
    description: 'خالد، لحظة تاريخية',
    icon: Star
  },
];

export default function CreateMemoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mood, setMood] = useState<MemoryMood>('happy');
  const [memoryType, setMemoryType] = useState<MemoryType>('fleeting');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const createMemoryMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إنشاء الذكرى');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الذكرى! ✨",
        description: "شظية ذكراك الجديدة تم نشرها بنجاح",
      });
      // Reset form
      setMediaFiles([]);
      setTitle('');
      setCaption('');
      setTags([]);
      setLocation('');
      
      // Navigate to profile
      setTimeout(() => {
        location.href = '/profile';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "حدث خطأ أثناء إنشاء الذكرى",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (mediaFiles.length >= 5) {
        toast({
          title: "حد أقصى 5 ملفات",
          description: "يمكنك رفع 5 ملفات كحد أقصى",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      setMediaFiles(prev => [...prev, { file, url, type }]);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleCameraCapture = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      // Create a simple camera interface
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.srcObject = stream;
      video.play();
      
      // Add camera overlay to page
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black z-50 flex items-center justify-center';
      overlay.innerHTML = `
        <div class="relative">
          <video autoplay class="w-full max-w-md rounded-lg"></video>
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <button id="capture-btn" class="bg-white w-16 h-16 rounded-full flex items-center justify-center">
              <div class="w-12 h-12 bg-red-500 rounded-full"></div>
            </button>
            <button id="close-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg">إغلاق</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      const overlayVideo = overlay.querySelector('video') as HTMLVideoElement;
      overlayVideo.srcObject = stream;
      
      // Handle capture
      overlay.querySelector('#capture-btn')?.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const url = URL.createObjectURL(file);
            setMediaFiles(prev => [...prev, { file, url, type: 'image' }]);
          }
        });
        
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
        setIsCapturing(false);
      });
      
      // Handle close
      overlay.querySelector('#close-btn')?.addEventListener('click', () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
        setIsCapturing(false);
      });
      
    } catch (error) {
      toast({
        title: "خطأ في الكاميرا",
        description: "لا يمكن الوصول للكاميرا",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      toast({
        title: "أضف محتوى",
        description: "يجب إضافة صورة أو فيديو واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    // Upload files and create memory fragment
    const formData = new FormData();
    formData.append('title', title);
    formData.append('caption', caption);
    formData.append('mood', mood);
    formData.append('memoryType', memoryType);
    formData.append('location', location);
    formData.append('tags', JSON.stringify(tags));
    
    mediaFiles.forEach((media) => {
      formData.append('media', media.file);
    });

    createMemoryMutation.mutate(formData);
  };

  const currentTime = new Date().getHours();
  const timeOfDay = currentTime < 6 ? 'night' : currentTime < 12 ? 'morning' : currentTime < 18 ? 'afternoon' : 'evening';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ✨ أنشئ شظية ذكرى جديدة
          </h1>
          <p className="text-gray-600 mt-2">
            احتفظ باللحظات الثمينة في شكل شظايا ذكريات خالدة
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>محتوى الذكرى</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Media Upload Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium">الصور والفيديوهات</label>
              
              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.type === 'image' ? (
                        <img 
                          src={media.url} 
                          alt={`Memory ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <video 
                          src={media.url} 
                          className="w-full h-24 object-cover rounded-lg"
                          muted
                        />
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 5}
                  className="flex items-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>صور</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={mediaFiles.length >= 5}
                  className="flex items-center space-x-2"
                >
                  <Video className="w-4 h-4" />
                  <span>فيديو</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCameraCapture}
                  disabled={isCapturing || mediaFiles.length >= 5}
                  className="flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>كاميرا</span>
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'image')}
              />
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'video')}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الذكرى</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أضف عنواناً مميزاً لذكراك..."
                className="text-right"
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-medium">وصف الذكرى</label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="احك قصة هذه اللحظة..."
                className="text-right min-h-[100px]"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-left">
                {caption.length}/500
              </div>
            </div>

            {/* Memory Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">نوع الذكرى</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {memoryTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-all ${
                        memoryType === type.value 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setMemoryType(type.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${
                          memoryType === type.value ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <h3 className="font-medium">{type.label}</h3>
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <label className="text-sm font-medium">مزاج الذكرى</label>
              <div className="flex flex-wrap gap-2">
                {moods.map(moodOption => (
                  <Badge
                    key={moodOption.value}
                    variant={mood === moodOption.value ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 ${
                      mood === moodOption.value ? moodOption.color : ''
                    }`}
                    onClick={() => setMood(moodOption.value)}
                  >
                    <span className="mr-1">{moodOption.emoji}</span>
                    {moodOption.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-4 h-4" />
                <span>الموقع (اختياري)</span>
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="أين تم التقاط هذه الذكرى؟"
                className="text-right"
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium">الكلمات المفتاحية</label>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="أضف كلمة مفتاحية..."
                  className="text-right"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  maxLength={20}
                />
                <Button 
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                  size="sm"
                >
                  إضافة
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {tags.length}/10 كلمات مفتاحية
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={createMemoryMutation.isPending || mediaFiles.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {createMemoryMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري النشر...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>نشر شظية الذكرى ✨</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}