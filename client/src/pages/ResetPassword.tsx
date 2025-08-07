import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get token and email from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');
  const email = urlParams.get('email');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setError('رابط إعادة تعيين كلمة المرور غير صحيح');
        setIsValidating(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/validate-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.valid) {
          setIsValidToken(true);
        } else {
          setError(data.message || 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية');
        }
      } catch (error) {
        setError('حدث خطأ أثناء التحقق من الرمز');
      }
      
      setIsValidating(false);
    };
    
    validateToken();
  }, [token, email]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتان');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        toast({
          title: 'نجح تحديث كلمة المرور',
          description: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'حدث خطأ أثناء تحديث كلمة المرور');
      }
    } catch (error) {
      setError('حدث خطأ في الشبكة');
    }
    
    setIsLoading(false);
  };
  
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <CardTitle className="text-xl">جاري التحقق...</CardTitle>
            <CardDescription>
              يتم التحقق من صحة رابط إعادة تعيين كلمة المرور
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl text-red-600 dark:text-red-400">رابط غير صحيح</CardTitle>
            <CardDescription className="text-red-500 dark:text-red-400">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate('/forgot-password')} 
              variant="outline"
              className="w-full"
            >
              طلب رابط جديد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-600 dark:text-green-400">تم بنجاح!</CardTitle>
            <CardDescription className="text-green-500 dark:text-green-400">
              تم تحديث كلمة المرور بنجاح. ستتم إعادة توجيهك لصفحة تسجيل الدخول...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              انتقل لتسجيل الدخول الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            إعادة تعيين كلمة المرور
          </CardTitle>
          <CardDescription>
            أدخل كلمة المرور الجديدة لحسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                البريد الإلكتروني
              </label>
              <Input
                id="email"
                type="email"
                value={decodeURIComponent(email || '')}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                كلمة المرور الجديدة
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                تأكيد كلمة المرور
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>• كلمة المرور يجب أن تكون 8 أحرف على الأقل</p>
              <p>• استخدم مزيج من الأحرف والأرقام والرموز</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'تحديث كلمة المرور'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}