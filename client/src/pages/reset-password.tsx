import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // Extract token and email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const emailParam = urlParams.get('email');

    if (!tokenParam || !emailParam) {
      toast({
        title: "خطأ",
        description: "رابط إعادة التعيين غير صحيح",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [navigate, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          email,
          newPassword: data.newPassword,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء تحديث كلمة المرور");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResetComplete(true);
      toast({
        title: "تم بنجاح",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  if (!token || !email) {
    return null; // Will redirect in useEffect
  }

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
              {resetComplete ? (
                <CheckCircle className="h-10 w-10 text-white" />
              ) : (
                <span className="text-3xl">🔒</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {resetComplete ? "تم تحديث كلمة المرور" : "تعيين كلمة مرور جديدة"}
            </h1>
            <p className="text-gray-300 text-sm">
              {resetComplete ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة" : "أدخل كلمة مرور جديدة وقوية"}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
            {!resetComplete ? (
              // Form to reset password
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* New Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      {...register("newPassword")}
                      placeholder="كلمة المرور الجديدة"
                      disabled={resetPasswordMutation.isPending}
                      className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-2xl text-lg backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all pl-14"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={resetPasswordMutation.isPending}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-400 text-sm px-2">{errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="تأكيد كلمة المرور"
                      disabled={resetPasswordMutation.isPending}
                      className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-2xl text-lg backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all pl-14"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={resetPasswordMutation.isPending}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm px-2">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-2xl text-lg shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>جاري التحديث...</span>
                    </div>
                  ) : (
                    "تحديث كلمة المرور"
                  )}
                </Button>
              </form>
            ) : (
              // Success message
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">تم بنجاح!</h2>
                <p className="text-gray-300 text-sm mb-4">
                  تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="w-full h-12 border-white/50 text-black hover:bg-white/20 hover:text-white rounded-2xl font-black backdrop-blur-sm shadow-lg bg-white/80"
              onClick={() => navigate("/login")}
            >
              {resetComplete ? "تسجيل الدخول" : "العودة إلى تسجيل الدخول"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}