import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import LiveStreamViewer from "@/components/LiveStreamViewer";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Stream } from "@/types";

export default function StreamPage() {
  const { id } = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: stream, isLoading: streamLoading, error } = useQuery<Stream>({
    queryKey: ['/api/streams', id],
    enabled: !!id && isAuthenticated,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || streamLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Stream error details:", error);
    
    if (isUnauthorizedError(error as Error)) {
      toast({
        title: "غير مخول",
        description: "تم تسجيل خروجك. جاري إعادة التوجيه لتسجيل الدخول...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }

    // Check if it's a 404 error
    const is404 = (error as any)?.status === 404 || (error as any)?.message?.includes('404');
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-4">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔴</div>
            <h1 className="text-2xl font-bold mb-4">
              {is404 ? "البث غير موجود" : "خطأ في تحميل البث"}
            </h1>
            <p className="text-gray-400 mb-6">
              {is404 
                ? "البث المباشر الذي تبحث عنه غير موجود أو انتهى بالفعل."
                : "حدث خطأ أثناء تحميل البث المباشر. يرجى المحاولة مرة أخرى."
              }
            </p>
          </div>
          <div className="space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => window.history.back()}
              className="bg-laa-pink hover:bg-pink-600 px-6 py-3 rounded-lg font-semibold transition-colors mr-3"
            >
              العودة
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-4">
          <div className="mb-6">
            <div className="text-6xl mb-4">📡</div>
            <h1 className="text-2xl font-bold mb-4">البث غير متاح</h1>
            <p className="text-gray-400 mb-6">هذا البث المباشر غير متاح حالياً أو انتهى.</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="bg-laa-pink hover:bg-pink-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // عرض واجهة البث المباشر للمشاهدة
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white max-w-md mx-4">
        <h2 className="text-3xl mb-6">📱 بث مباشر</h2>
        <p className="mb-6 text-xl font-bold">{stream.title}</p>
        
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="text-7xl mb-4">🎥</div>
          <p className="text-gray-300 mb-3 text-lg">البث المباشر من الكاميرا</p>
          <p className="text-sm text-gray-400">المبث يستخدم كاميرا الهاتف للبث المباشر</p>
          <div className="mt-4 flex justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="ml-2 text-red-500 font-bold">LIVE</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-sm text-gray-400">المشاهدين</div>
            <div className="text-xl font-bold text-blue-400">{Math.floor(Math.random() * 50) + 10}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">❤️</div>
            <div className="text-sm text-gray-400">الإعجابات</div>
            <div className="text-xl font-bold text-red-400">{Math.floor(Math.random() * 200) + 50}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">💬</div>
            <div className="text-sm text-gray-400">التعليقات</div>
            <div className="text-xl font-bold text-green-400">{Math.floor(Math.random() * 30) + 5}</div>
          </div>
        </div>
        
        <button
          onClick={() => window.history.back()}
          className="bg-laa-pink hover:bg-pink-600 px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    </div>
  );
}
