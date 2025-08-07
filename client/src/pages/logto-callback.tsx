import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Shield, CheckCircle } from 'lucide-react';

export default function LogtoCallback() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Wait a bit for the authentication to complete
    const timer = setTimeout(async () => {
      try {
        // Check if authentication was successful
        const response = await fetch('/api/logto/user');
        const data = await response.json();
        
        if (data.isAuthenticated) {
          // Authentication successful, redirect to home
          setLocation('/');
        } else {
          // Authentication failed, redirect to login
          setLocation('/logto-login');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setLocation('/logto-login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
          <Shield className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            جاري تسجيل الدخول
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            يرجى الانتظار، جاري التحقق من المصادقة...
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">تم التحقق من هويتك بنجاح</span>
        </div>
      </div>
    </div>
  );
}