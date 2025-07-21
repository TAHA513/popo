import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  Heart,
  Star,
  Globe,
  Users,
  Camera,
  Gift
} from "lucide-react";

type RegistrationStep = 'choose' | 'details' | 'credentials';

export default function Register() {
  const { toast } = useToast();
  const [step, setStep] = useState<RegistrationStep>('choose');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    registrationType: '' as 'email' | 'username'
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/auth/register', data);
    },
    onSuccess: () => {
      toast({
        title: "مرحباً بك في LaaBoBo Live! 🎉",
        description: "تم إنشاء حسابك بنجاح. ستتم إعادة توجيهك للصفحة الرئيسية",
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التسجيل",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast({
        title: "اسمك مطلوب",
        description: "يرجى إدخال اسمك الأول",
        variant: "destructive",
      });
      return;
    }

    if (formData.registrationType === 'email' && !formData.email.includes('@')) {
      toast({
        title: "إيميل غير صحيح",
        description: "يرجى إدخال إيميل صحيح",
        variant: "destructive",
      });
      return;
    }

    if (formData.registrationType === 'username' && formData.username.length < 3) {
      toast({
        title: "اسم المستخدم قصير",
        description: "يجب أن يكون اسم المستخدم 3 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const ChooseRegistrationMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">انضم إلى LaaBoBo Live</h1>
        <p className="text-gray-600">منصة الذكريات والبث المباشر الأولى في العالم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300 group"
          onClick={() => {
            setFormData(prev => ({ ...prev, registrationType: 'email' }));
            setStep('details');
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">التسجيل بالإيميل</h3>
            <p className="text-gray-600 text-sm">استخدم عنوان إيميلك للتسجيل بسرعة وأمان</p>
            <Badge className="mt-3 bg-blue-100 text-blue-800">الأكثر شيوعاً</Badge>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300 group"
          onClick={() => {
            setFormData(prev => ({ ...prev, registrationType: 'username' }));
            setStep('details');
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">التسجيل باسم المستخدم</h3>
            <p className="text-gray-600 text-sm">أنشئ اسم مستخدم فريد لحسابك</p>
            <Badge className="mt-3 bg-green-100 text-green-800">سريع ومباشر</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
        <div className="flex items-center">
          <Heart className="w-4 h-4 mr-1 text-red-500" />
          <span>مجاني تماماً</span>
        </div>
        <div className="flex items-center">
          <Star className="w-4 h-4 mr-1 text-yellow-500" />
          <span>بدون إعلانات</span>
        </div>
        <div className="flex items-center">
          <Globe className="w-4 h-4 mr-1 text-blue-500" />
          <span>عالمي</span>
        </div>
      </div>
    </div>
  );

  const UserDetailsForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">أخبرنا عن نفسك</h2>
        <p className="text-gray-600">هذه المعلومات ستساعد أصدقاءك في العثور عليك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الاسم الأول *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="اسمك الأول"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="pl-10 pr-4"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اسم العائلة (اختياري)
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="اسم العائلة"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="pl-10 pr-4"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep('choose')}
          className="flex items-center"
        >
          ← العودة
        </Button>
        <Button
          onClick={() => setStep('credentials')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          disabled={!formData.firstName.trim()}
        >
          التالي →
        </Button>
      </div>
    </div>
  );

  const CredentialsForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {formData.registrationType === 'email' ? 'إعداد حساب الإيميل' : 'إعداد اسم المستخدم'}
        </h2>
        <p className="text-gray-600">آخر خطوة لإنشاء حسابك</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formData.registrationType === 'email' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان الإيميل *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10 pr-4"
                required
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="اسم المستخدم الفريد"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="pl-10 pr-4"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كلمة المرور *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة مرور قوية"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="pl-10 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('details')}
          >
            ← العودة
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                إنشاء الحساب
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardContent className="p-8">
          {step === 'choose' && <ChooseRegistrationMethod />}
          {step === 'details' && <UserDetailsForm />}
          {step === 'credentials' && <CredentialsForm />}
        </CardContent>
      </Card>

      {/* Features Showcase */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80">
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20">
          <CardContent className="p-4">
            <h3 className="font-bold text-center text-gray-800 mb-3">ميزات LaaBoBo Live</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center text-gray-600">
                <Camera className="w-3 h-3 mr-1 text-blue-500" />
                بث مباشر
              </div>
              <div className="flex items-center text-gray-600">
                <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                ذكريات تفاعلية
              </div>
              <div className="flex items-center text-gray-600">
                <Gift className="w-3 h-3 mr-1 text-green-500" />
                هدايا افتراضية
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-3 h-3 mr-1 text-orange-500" />
                شبكة اجتماعية
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}