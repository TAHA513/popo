import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [resetSent, setResetSent] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      // Try Logto reset first
      try {
        const logtoResponse = await fetch("/api/logto-forgot-password", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (logtoResponse.ok) {
          const logtoData = await logtoResponse.json();
          if (logtoData.success) {
            return { ...logtoData, method: 'logto' };
          }
        }
      } catch (logtoError) {
        console.log('Logto reset failed, trying local method');
      }

      // Fallback to local reset
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء إرسال رابط إعادة التعيين");
      }

      return { ...await response.json(), method: 'local' };
    },
    onSuccess: (data) => {
      setResetSent(true);
      toast({
        title: "تم بنجاح",
        description: data.message || "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
      });

      // If Logto provided redirect, use it after delay
      if (data.method === 'logto' && data.redirect) {
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 3000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-blue-900/50"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">نسيت كلمة المرور؟</h1>
            <p className="text-gray-300 text-sm">لا تقلق، سنرسل لك رابط إعادة التعيين</p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
            {!resetSent ? (
              // Form to enter email
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="البريد الإلكتروني"
                    disabled={forgotPasswordMutation.isPending}
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-2xl text-lg backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm px-2">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-2xl text-lg shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </div>
                  ) : (
                    "إرسال رابط إعادة التعيين"
                  )}
                </Button>
              </form>
            ) : (
              // Success message
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <Mail className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">تم إرسال الرابط بنجاح</h2>
                <p className="text-gray-300 text-sm mb-4">
                  تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور
                </p>


              </div>
            )}
          </div>

          {/* Back to Login */}
          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="w-full h-12 border-white/50 text-black hover:bg-white/20 hover:text-white rounded-2xl font-black backdrop-blur-sm shadow-lg bg-white/80"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة إلى تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}