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
  ArrowLeft,
  X,
  Camera,
  Globe,
  Users,
  Lock,
  MessageCircle,
  Share2,
  Gift,
  Star,
  Flame,
  Crown,
  Zap
} from "lucide-react";

// Memory types simplified for fast loading
const QUICK_MEMORY_TYPES = [
  { id: 'star', name: 'نجم', emoji: '⭐', color: 'from-purple-500 to-indigo-500' },
  { id: 'flash', name: 'فلاش', emoji: '⚡', color: 'from-yellow-400 to-orange-500' },
  { id: 'trending', name: 'ترند', emoji: '🔥', color: 'from-red-500 to-pink-500' }
];

// Privacy options simplified
const QUICK_PRIVACY_OPTIONS = [
  { value: 'public', icon: Globe, label: 'عام', color: 'text-green-400' },
  { value: 'followers', icon: Users, label: 'المتابعون', color: 'text-blue-400' },
  { value: 'private', icon: Lock, label: 'خاص', color: 'text-gray-400' }
];

export default function CreateMemoryFast() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    caption: "",
    memoryType: "star",
    visibilityLevel: "public",
    allowComments: true,
    allowSharing: true,
    allowGifts: true
  });

  // Fast upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/memories', {
        method: 'POST',
        credentials: 'include',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في رفع الذكرى');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم رفع الذكرى بنجاح",
        description: "تمت إضافة ذكريتك وستظهر للآخرين قريباً"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "❌ خطأ في رفع الذكرى",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "❌ حجم الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 50 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "❌ يرجى اختيار ملف",
        description: "يجب عليك اختيار صورة أو فيديو لإنشاء الذكرى",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('media', selectedFile);
    formDataToSend.append('caption', formData.caption);
    formDataToSend.append('memoryType', formData.memoryType);
    formDataToSend.append('visibilityLevel', formData.visibilityLevel);
    formDataToSend.append('allowComments', formData.allowComments.toString());
    formDataToSend.append('allowSharing', formData.allowSharing.toString());
    formDataToSend.append('allowGifts', formData.allowGifts.toString());

    uploadMutation.mutate(formDataToSend);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isVideo = selectedFile?.type.startsWith('video/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              className="text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-800">إنشاء ذكرى جديدة</h1>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
          >
            {isUploading ? "جاري الرفع..." : "نشر"}
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {!selectedFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              <Camera className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">اختر صورة أو فيديو</h3>
              <p className="text-gray-600">انقر هنا لاختيار ملف من جهازك</p>
              <p className="text-sm text-gray-500 mt-2">الحد الأقصى: 50 ميجابايت</p>
            </div>
          ) : (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </Button>
              
              {isVideo ? (
                <video 
                  src={previewUrl!}
                  className="w-full h-64 object-cover rounded-lg"
                  controls
                  muted
                />
              ) : (
                <img 
                  src={previewUrl!} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Caption */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-800 mb-3">
            اكتب تعليقاً (اختياري)
          </label>
          <Textarea
            value={formData.caption}
            onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
            placeholder="شاركنا أفكارك حول هذه الذكرى..."
            className="min-h-[80px] resize-none border-gray-200 focus:border-purple-400"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1 text-left">
            {formData.caption.length}/500
          </div>
        </div>

        {/* Memory Type */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-800 mb-3">
            نوع الذكرى
          </label>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_MEMORY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setFormData(prev => ({ ...prev, memoryType: type.id }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.memoryType === type.id
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className="text-sm font-medium">{type.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-800 mb-3">
            من يمكنه رؤية هذه الذكرى؟
          </label>
          <div className="space-y-3">
            {QUICK_PRIVACY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData(prev => ({ ...prev, visibilityLevel: option.value }))}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  formData.visibilityLevel === option.value
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option.icon className={`w-5 h-5 ${option.color}`} />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-800 mb-3">
            إعدادات التفاعل
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.allowComments}
                onChange={(e) => setFormData(prev => ({ ...prev, allowComments: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm">السماح بالتعليقات</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.allowSharing}
                onChange={(e) => setFormData(prev => ({ ...prev, allowSharing: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Share2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">السماح بالمشاركة</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.allowGifts}
                onChange={(e) => setFormData(prev => ({ ...prev, allowGifts: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Gift className="w-4 h-4 text-pink-500" />
              <span className="text-sm">السماح بالهدايا</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}