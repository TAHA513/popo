import { useState, useEffect } from "react";
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
import { Loader2, Eye, EyeOff, Globe, ChevronDown, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLanguage, setLanguage, t, isRTL } = useLanguage();

  // PWA Install functionality
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Check if this is after a reload for install
  useEffect(() => {
    const wasClickedForInstall = sessionStorage.getItem('pwa-install-ready');
    if (wasClickedForInstall === 'true') {
      setClickCount(1);
      sessionStorage.removeItem('pwa-install-ready');
    }
  }, []);

  // Install button click handler
  const handleInstallClick = () => {
    if (clickCount === 0) {
      // First click - prepare for install and reload
      sessionStorage.setItem('pwa-install-ready', 'true');
      setClickCount(1);
      window.location.reload();
    } else {
      // Second click - try to install
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
          }
          setDeferredPrompt(null);
          setClickCount(0);
        });
      } else {
        // Force trigger PWA detection
        const event = new Event('beforeinstallprompt');
        window.dispatchEvent(event);
        
        // Reset click count
        setClickCount(0);
      }
    }
  };

  const loginSchema = z.object({
    username: z.string().min(1, t('auth.username')),
    password: z.string().min(1, t('auth.password')),
  });

  type LoginForm = z.infer<typeof loginSchema>;

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
        throw new Error(error.message || t('auth.error_title'));
      }

      return response.json();
    },
    onSuccess: async (data) => {
      // No welcome message - direct login
      
      // Invalidate auth query to refresh user state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Navigate to home using wouter instead of window.location
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error_title'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-blue-900/50"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex flex-col items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 transition-all px-2 py-1 h-8"
            >
              <Globe className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              <span className="text-sm">{currentLanguage.flag}</span>
              <ChevronDown className={`w-2 h-2 ${isRTL ? 'mr-1' : 'ml-1'}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-lg border border-white/20">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang)}
                className="cursor-pointer text-white hover:bg-white/10 focus:bg-white/10 text-sm"
              >
                <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>{lang.flag}</span>
                {lang.localName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-white/70 text-xs mt-1">Language</span>
      </div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <span className="text-3xl rabbit-animated">🐰</span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">LaaBoBo Live</h1>
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleInstallClick}
                  variant="ghost"
                  size="sm"
                  className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-lg border border-pink-400/30 text-white hover:from-pink-500/30 hover:to-purple-600/30 rounded-full w-8 h-8 p-0 shadow-lg group transition-all duration-300 hover:scale-110"
                  title="تثبيت التطبيق"
                >
                  <Download className="h-4 w-4 group-hover:animate-bounce" />
                </Button>
                <span className="text-white/70 text-xs mt-1">تثبيت</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{isRTL ? 'أهلاً وسهلاً' : 'Welcome back'}</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Input
                  id="username"
                  {...register("username")}
                  placeholder={t('auth.username')}
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
                    placeholder={t('auth.password')}
                    disabled={loginMutation.isPending}
                    className={`h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-2xl text-lg backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all ${isRTL ? 'pr-14' : 'pl-14'}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg`}
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
                    <span>{t('auth.logging_in')}</span>
                  </div>
                ) : (
                  t('auth.login')
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
                  {t('auth.forgot_password')}
                </Button>
              </div>
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-300 text-sm mb-4">
              {t('auth.dont_have_account')}
            </p>
            <Button
              variant="outline"
              className="w-full h-12 border-white/50 text-black hover:bg-white/20 hover:text-white rounded-2xl font-black backdrop-blur-sm shadow-lg bg-white/80"
              onClick={() => navigate("/register")}
              disabled={loginMutation.isPending}
            >
{t('auth.register_now')}
            </Button>
          </div>



          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-xs">
              {isRTL ? 'بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية' : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}