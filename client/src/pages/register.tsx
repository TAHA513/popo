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
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  username: z.string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(20, "اسم المستخدم لا يمكن أن يزيد عن 20 حرف")
    .regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط"),
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "الاسم الأخير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيد كلمة المرور غير متطابقين",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

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
      const response = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "حدث خطأ أثناء إنشاء الحساب");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم بنجاح",
        description: data.message + " - يمكنك الآن تسجيل الدخول",
      });
      
      // Navigate to login page
      navigate("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    if (usernameCheck && !usernameCheck.available) {
      toast({
        title: "خطأ",
        description: "اسم المستخدم غير متاح",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-purple-600">
            إنشاء حساب جديد
          </CardTitle>
          <p className="text-gray-600">انضم إلى LaaBoBo Live اليوم</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="الاسم الأول"
                  disabled={registerMutation.isPending}
                />
                {errors.firstName && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.firstName.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">الاسم الأخير</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="الاسم الأخير"
                  disabled={registerMutation.isPending}
                />
                {errors.lastName && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.lastName.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="اسم المستخدم (مطلوب وفريد)"
                  disabled={registerMutation.isPending}
                />
                {usernameStatus && (
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {usernameStatus === "available" && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {usernameStatus === "unavailable" && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {errors.username && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.username.message}</AlertDescription>
                </Alert>
              )}
              {usernameStatus === "unavailable" && (
                <Alert variant="destructive">
                  <AlertDescription>اسم المستخدم غير متاح</AlertDescription>
                </Alert>
              )}
              {usernameStatus === "available" && (
                <Alert>
                  <AlertDescription className="text-green-600">
                    اسم المستخدم متاح
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="البريد الإلكتروني"
                disabled={registerMutation.isPending}
              />
              {errors.email && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.email.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  disabled={registerMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
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
                <Alert variant="destructive">
                  <AlertDescription>{errors.password.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="تأكيد كلمة المرور"
                  disabled={registerMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
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
                <Alert variant="destructive">
                  <AlertDescription>{errors.confirmPassword.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={registerMutation.isPending || usernameStatus === "unavailable"}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء حساب"
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-purple-600 hover:text-purple-700"
                  onClick={() => navigate("/login")}
                  disabled={registerMutation.isPending}
                >
                  تسجيل الدخول
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}