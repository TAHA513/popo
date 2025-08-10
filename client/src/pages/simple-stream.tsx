import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function SimpleStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chatTitle, setChatTitle] = useState("دردشة سريعة جديدة");
  const [chatDescription, setChatDescription] = useState("دردشة مباشرة نصية");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

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
      
      console.log("✅ Stream created successfully:", response);
      
      // استخراج معرف البث من الاستجابة المحللة JSON
      let chatId = null;
      
      if (response?.success && response?.data?.id) {
        chatId = response.data.id;
        console.log("🎯 Stream ID extracted:", chatId);
      } else {
        console.error("❌ Stream creation failed - no ID in response:", response);
      }
      
      if (chatId) {
        console.log("🎯 Redirecting to chat:", chatId);
        // التأكد من تنظيف الأخطاء قبل الانتقال
        setError('');
        setIsCreating(false);
        setLocation(`/stream/${chatId}`);
        return; // مهم جداً: الخروج من الدالة هنا
      } else {
        // إذا لم نحصل على معرف، نحاول الحصول على آخر بث تم إنشاؤه
        console.log("⚠️ No chat ID found, trying to get latest stream...");
        
        try {
          const streamsResponse = await apiRequest('/api/streams', 'GET');
          console.log("📡 Latest streams:", streamsResponse);
          
          if (streamsResponse && Array.isArray(streamsResponse) && streamsResponse.length > 0) {
            // الحصول على أحدث بث
            const latestStream = streamsResponse[0];
            if (latestStream && latestStream.id) {
              console.log("🎯 Redirecting to latest stream:", latestStream.id);
              setError('');
              setIsCreating(false);
              setLocation(`/stream/${latestStream.id}`);
              return; // مهم جداً: الخروج من الدالة هنا
            }
          }
        } catch (e) {
          console.log("Failed to get latest streams:", e);
        }
        
        console.error("❌ Could not determine stream ID to redirect to");
        throw new Error('تعذر إنشاء الدردشة، يرجى المحاولة مرة أخرى');
      }
      
    } catch (error: any) {
      console.error("❌ Chat creation failed:", error);
      console.log("🔍 Error details:", {
        status: error.status,
        message: error.message,
        responseText: error.responseText,
        stack: error.stack
      });
      
      let errorMessage = "حدث خطأ في إنشاء الدردشة";
      
      if (error.status === 401) {
        errorMessage = "يجب تسجيل الدخول أولاً";
        setLocation("/login");
        return;
      } else if (error.status === 403) {
        errorMessage = "ليس لديك صلاحية لإنشاء دردشة";
      } else if (error.message && error.message !== 'تعذر إنشاء الدردشة، يرجى المحاولة مرة أخرى') {
        errorMessage = error.message;
      } else if (error.responseText) {
        try {
          const errorData = JSON.parse(error.responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log("Could not parse error response");
        }
      }
      
      // إضافة معلومات إضافية للمطور
      console.log("📋 Final error message:", errorMessage);
      
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

          <Card className="bg-black/40 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">تفاصيل الدردشة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">عنوان الدردشة</label>
                <Input
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder="أدخل عنوان الدردشة"
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">وصف الدردشة</label>
                <Textarea
                  value={chatDescription}
                  onChange={(e) => setChatDescription(e.target.value)}
                  placeholder="وصف مختصر للدردشة"
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs mt-0.5">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">خطأ في الإنشاء</p>
                    <p>{error}</p>
                    <button 
                      onClick={() => setError('')} 
                      className="text-red-200 hover:text-white underline text-xs mt-2"
                    >
                      إغلاق الرسالة
                    </button>
                  </div>
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
        </div>
      </div>
    </div>
  );
}