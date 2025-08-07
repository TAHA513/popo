import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LogtoLogin() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/logto/user');
        const data = await response.json();
        
        if (data.isAuthenticated) {
          setLocation('/');
        }
      } catch (error) {
        console.log('Not authenticated yet');
      }
    };

    checkAuthStatus();
  }, [setLocation]);

  const handleLogtoSignIn = () => {
    setIsLoading(true);
    // Redirect to Logto sign-in
    window.location.href = '/logto/sign-in';
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "البريد الإلكتروني مطلوب",
        description: "يرجى إدخال بريدك الإلكتروني لإعادة تعيين كلمة المرور",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/logto-forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "تم الإرسال بنجاح",
          description: data.message,
          variant: "default"
        });
        
        if (data.redirect) {
          setTimeout(() => {
            window.location.href = data.redirect;
          }, 2000);
        }
      } else {
        toast({
          title: "خطأ",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء معالجة طلبك",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            تسجيل الدخول - LaaBoBo
          </CardTitle>
          <CardDescription>
            {isPasswordReset 
              ? "أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور"
              : "سجل دخولك بأمان باستخدام Logto"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isPasswordReset ? (
            <>
              {/* Logto Sign In Button */}
              <Button
                onClick={handleLogtoSignIn}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 ml-2" />
                    تسجيل الدخول مع Logto
                  </div>
                )}
              </Button>

              <Separator className="my-6" />

              {/* Password Reset Link */}
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setLocation('/logto-forgot-password')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  نسيت كلمة المرور؟
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Password Reset Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-right">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 text-right"
                      placeholder="أدخل بريدك الإلكتروني"
                      dir="rtl"
                    />
                  </div>
                </div>

                <Button
                  onClick={handlePasswordReset}
                  disabled={isLoading || !email}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </div>
                  ) : (
                    "إرسال رابط إعادة التعيين"
                  )}
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Back to Login */}
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setIsPasswordReset(false)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  العودة لتسجيل الدخول
                </Button>
              </div>
            </>
          )}

          {/* Additional Options */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ليس لديك حساب؟{' '}
              <Button
                variant="link"
                onClick={() => setLocation('/register')}
                className="text-purple-600 hover:text-purple-700 font-medium p-0"
              >
                إنشاء حساب جديد
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}