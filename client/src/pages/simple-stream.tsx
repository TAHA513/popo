import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Users, Loader } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function SimpleStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chatTitle, setChatTitle] = useState("دردشة سريعة جديدة");
  const [chatDescription, setChatDescription] = useState("دردشة مباشرة نصية");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // فحص البث النشط للمستخدم
  const { data: activeStream, isLoading: checkingStream } = useQuery({
    queryKey: ['/api/streams/my-active'],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch('/api/streams/my-active', {
          credentials: 'include'
        });
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        console.log('لا يوجد بث نشط');
        return null;
      }
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    // مسح أي أخطاء سابقة عند تحميل الصفحة
    setError('');
    
    // إذا كان هناك بث نشط، توجه المستخدم إليه مباشرة
    if (activeStream && activeStream.id) {
      console.log('🎯 تم العثور على بث نشط، التوجه إليه:', activeStream.id);
      setLocation(`/stream/${activeStream.id}`);
      return;
    }
    
    // إنهاء حالة الفحص إذا لم يكن هناك بث نشط
    if (!checkingStream && !activeStream) {
      setIsChecking(false);
    }
  }, [activeStream, checkingStream, setLocation]);

  // مسح الخطأ عند تغيير النص
  useEffect(() => {
    if (error && (chatTitle !== "دردشة سريعة جديدة" || chatDescription !== "دردشة مباشرة نصية")) {
      setError('');
    }
  }, [chatTitle, chatDescription, error]);

  const createChat = async () => {
    if (!chatTitle.trim()) {
      setError("يرجى إدخال عنوان للدردشة");
      return;
    }

    if (!user) {
      alert("يجب تسجيل الدخول لبدء الدردشة");
      setLocation("/login");
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      console.log("💬 Creating new chat room...");
      
      const streamData = {
        title: chatTitle,
        description: chatDescription,
        category: "دردشة سريعة"
      };

      console.log("📨 Sending chat creation request:", streamData);
      
      const response = await apiRequest('/api/streams', 'POST', streamData);
      
      console.log("✅ Chat created successfully:", response);
      
      if (response.success && response.data) {
        const chatId = response.data.id;
        console.log("🎯 Redirecting to chat:", chatId);
        
        // التوجه مباشرة للدردشة
        setLocation(`/stream/${chatId}`);
      } else {
        throw new Error('فشل في إنشاء الدردشة');
      }
      
    } catch (error: any) {
      console.error("❌ Chat creation failed:", error);
      
      let errorMessage = "فشل في إنشاء الدردشة";
      
      if (error.status === 401) {
        errorMessage = "يجب تسجيل الدخول أولاً";
        setLocation("/login");
        return;
      } else if (error.status === 403) {
        errorMessage = "ليس لديك صلاحية لإنشاء دردشة";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-blue-900 text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-blue-500/20"></div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation('/')}
        className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5 ml-2" />
        عودة
      </Button>

      <div className="relative z-10 p-6 pt-20">
        <div className="max-w-md mx-auto">
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">💬 إنشاء دردشة جديدة</h1>
            <p className="text-gray-300">ابدأ دردشة نصية مع الأصدقاء</p>
          </div>

          {/* عرض مؤشر الفحص */}
          {(checkingStream || isChecking) && (
            <Card className="bg-black/40 backdrop-blur-lg border-white/20 shadow-2xl mb-6">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3 text-blue-300">
                  <Loader className="w-6 h-6 animate-spin" />
                  <span className="text-lg">جاري فحص البث النشط...</span>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  نتحقق من وجود بث نشط لحسابك
                </p>
              </CardContent>
            </Card>
          )}

          {/* عرض النموذج فقط إذا لم يكن هناك بث نشط */}
          {!checkingStream && !isChecking && !activeStream && (
            <Card className="bg-black/40 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">تفاصيل الدردشة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">عنوان الدردشة</label>
                <Input
                  value={chatTitle}
                  onChange={(e) => {
                    setChatTitle(e.target.value);
                    // مسح الخطأ عند بدء الكتابة
                    if (error) setError('');
                  }}
                  placeholder="أدخل عنوان الدردشة"
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">وصف الدردشة</label>
                <Textarea
                  value={chatDescription}
                  onChange={(e) => {
                    setChatDescription(e.target.value);
                    // مسح الخطأ عند بدء الكتابة
                    if (error) setError('');
                  }}
                  placeholder="وصف مختصر للدردشة"
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={createChat}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>جاري الإنشاء...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    <span>إنشاء الدردشة</span>
                  </div>
                )}
              </Button>

              <div className="text-center text-sm text-gray-400 bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">دردشة نصية فقط</span>
                </div>
                <p>
                  ستكون هذه دردشة نصية مباشرة بدون فيديو أو صوت. 
                  يمكن للمستخدمين الانضمام وإرسال الرسائل النصية.
                </p>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}