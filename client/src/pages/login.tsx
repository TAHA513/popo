import { useState } from "react";
import { useLocation, useRouter } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء تسجيل الدخول");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "تم بنجاح",
        description: data.message,
      });
      
      // Invalidate auth query to refresh user state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to home using wouter instead of window.location
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
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
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <span className="text-3xl rabbit-animated">🐰</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">LaaBoBo Live</h1>
            <p className="text-gray-300 text-sm">مرحباً بعودتك</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="اسم المستخدم"
                  disabled={loginMutation.isPending}
                  className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-2xl text-lg backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
                />
                {errors.username && (
                  <p className="text-red-400 text-sm px-2">{errors.username.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="كلمة المرور"
                    disabled={loginMutation.isPending}
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-2xl text-lg backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all pl-14"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm px-2">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-2xl text-lg shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </div>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-[#e019ca] hover:text-white text-sm p-0 h-auto"
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                >
                  نسيت كلمة المرور؟
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-gray-300 text-sm">أو</span>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>

              {/* Logto Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-semibold rounded-2xl text-lg shadow-xl transition-all backdrop-blur-sm"
                onClick={() => window.location.href = '/logto/sign-in'}
              >
                <Shield className="w-5 h-5 ml-2" />
                تسجيل الدخول الآمن مع Logto
              </Button>
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-300 text-sm mb-4">
              ليس لديك حساب؟
            </p>
            <Button
              variant="outline"
              className="w-full h-12 border-white/50 text-black hover:bg-white/20 hover:text-white rounded-2xl font-black backdrop-blur-sm shadow-lg bg-white/80"
              onClick={() => navigate("/register")}
              disabled={loginMutation.isPending}
            >
              إنشاء حساب جديد
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-xs">
              بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}