import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Check, X, Globe, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import CountrySelector from "@/components/country-selector";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use the centralized schema from shared folder
import { registerSchema } from "@/../../shared/schema";

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{name: string, code: string, flag: string} | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentLanguage, setLanguage, t, isRTL } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const watchedUsername = watch("username");

  // Check username availability
  const { data: usernameCheck, isLoading: checkingUsername } = useQuery({
    queryKey: ["/api/check-username", watchedUsername],
    queryFn: async () => {
      if (!watchedUsername || watchedUsername.length < 3) return null;
      
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(watchedUsername)}`);
      if (!response.ok) return null;
      
      return response.json();
    },
    enabled: !!watchedUsername && watchedUsername.length >= 3,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const registrationData = {
        ...data,
        countryCode: selectedCountry?.code || "",
        countryName: selectedCountry?.name || "",
        countryFlag: selectedCountry?.flag || ""
      };
      
      const response = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(registrationData),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('auth.registration_error'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.success_title'),
        description: data.message + " - " + (isRTL ? "يمكنك الآن تسجيل الدخول" : "You can now log in"),
      });
      
      // Navigate to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error_title'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    if (usernameCheck && !usernameCheck.available) {
      toast({
        title: t('auth.error_title'),
        description: t('auth.username_taken'),
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate(data);
  };

  const getUsernameStatus = () => {
    if (!watchedUsername || watchedUsername.length < 3) return null;
    if (checkingUsername) return "checking";
    if (usernameCheck?.available) return "available";
    if (usernameCheck?.available === false) return "unavailable";
    return null;
  };

  const usernameStatus = getUsernameStatus();

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-blue-900/50"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/4 left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 right-1/3 w-36 h-36 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
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
      </div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-3 shadow-2xl">
              <span className="text-2xl rabbit-animated">🐰</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{isRTL ? 'انضم إلى LaaBoBo Live' : 'Join LaaBoBo Live'}</h1>
            <p className="text-gray-300 text-sm">{t('auth.register')}</p>
          </div>

          {/* Register Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder={t('auth.first_name')}
                    disabled={registerMutation.isPending}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs px-2">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder={t('auth.last_name')}
                    disabled={registerMutation.isPending}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs px-2">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    id="username"
                    {...register("username")}
                    placeholder={t('auth.username')}
                    disabled={registerMutation.isPending}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all pl-12"
                  />
                  {usernameStatus && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                      )}
                      {usernameStatus === "available" && (
                        <Check className="h-4 w-4 text-green-400" />
                      )}
                      {usernameStatus === "unavailable" && (
                        <X className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="text-red-400 text-xs px-2">{errors.username.message}</p>
                )}
                {usernameStatus === "unavailable" && !errors.username && (
                  <p className="text-red-400 text-xs px-2">{t('auth.username_taken')}</p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-green-400 text-xs px-2">{t('auth.username_available')}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder={t('auth.email')}
                  disabled={registerMutation.isPending}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs px-2">{errors.email.message}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder={t('auth.password')}
                      disabled={registerMutation.isPending}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all pl-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={registerMutation.isPending}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs px-2">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder={t('auth.confirm_password')}
                      disabled={registerMutation.isPending}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all pl-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={registerMutation.isPending}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs px-2">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth Field */}
              <div className="space-y-1">
                <div className="text-white text-sm mb-2">
                  {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'} <span className="text-red-400">*</span>
                  <span className="text-gray-400 text-xs block">{isRTL ? 'يجب أن تكون 18 سنة أو أكثر' : 'Must be 18 years or older'}</span>
                </div>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  disabled={registerMutation.isPending}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all [color-scheme:dark]"
                />
                {errors.dateOfBirth && (
                  <p className="text-red-400 text-xs px-2">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Country Selector */}
              <div className="space-y-1">
                <div className="text-white text-sm mb-2">{t('auth.select_country')}</div>
                <div className="bg-white/10 border border-white/20 rounded-xl p-3 backdrop-blur-sm">
                  <CountrySelector
                    value={selectedCountry?.code}
                    onChange={(country) => setSelectedCountry(country)}
                    placeholder={t('auth.select_country')}
                  />
                </div>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 mt-6"
                disabled={registerMutation.isPending || usernameStatus === "unavailable"}
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('auth.creating_account')}</span>
                  </div>
                ) : (
                  "{t('auth.register')}"
                )}
              </Button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-300 text-sm mb-3">
              {t('auth.already_have_account')}
            </p>
            <Button
              variant="outline"
              className="w-full h-10 border-white/50 text-black hover:bg-white/20 hover:text-white rounded-xl font-black backdrop-blur-sm shadow-lg bg-white/80"
              onClick={() => navigate("/login")}
              disabled={registerMutation.isPending}
            >
{t('auth.sign_in_here')}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-xs">
              {isRTL ? 'بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية' : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}