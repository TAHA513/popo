import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail, Globe, ChevronDown } from "lucide-react";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use the centralized schema from shared folder
import { forgotPasswordSchema } from "@/../../shared/schema";

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentLanguage, setLanguage, t, isRTL } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('auth.reset_error'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.success_title'),
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error_title'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
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
      <div className="absolute top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 transition-all px-2 py-1 h-8"
            >
              <Globe className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              <span className="text-sm">Language</span>
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
        <div className="w-full max-w-sm">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <span className="text-3xl rabbit-animated">🐰</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">LaaBoBo Live</h1>
            <p className="text-gray-300 text-sm">{t('auth.forgot_password')}</p>
          </div>

          {/* Forgot Password Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">{t('auth.forgot_password')}</h2>
              <p className="text-gray-300 text-sm">
                {isRTL ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط لاستعادة كلمة المرور' : 'Enter your email and we\'ll send you a reset link'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder={t('auth.email')}
                  disabled={forgotPasswordMutation.isPending}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs px-2">{errors.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('auth.sending_reset')}</span>
                  </div>
                ) : (
                  t('auth.send_reset_link')
                )}
              </Button>
            </form>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Button
              variant="outline"
              className="w-full h-10 border-white/50 text-black hover:bg-white/20 hover:text-white rounded-xl font-black backdrop-blur-sm shadow-lg bg-white/80"
              onClick={() => navigate("/login")}
              disabled={forgotPasswordMutation.isPending}
            >
              {t('auth.back_to_login')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}