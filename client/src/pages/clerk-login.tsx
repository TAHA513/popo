import { SignIn } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ClerkLogin() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // التحقق من حالة تسجيل الدخول وإعادة التوجيه
    const handleSignInSuccess = () => {
      setLocation('/');
    };

    // استمع لأحداث Clerk
    window.addEventListener('clerk:sign-in-success', handleSignInSuccess);
    
    return () => {
      window.removeEventListener('clerk:sign-in-success', handleSignInSuccess);
    };
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* شعار LaaBoBo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            LaaBoBo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            مرحباً بك في عالم الذكريات والمشاركة
          </p>
        </div>

        {/* مكون Clerk لتسجيل الدخول */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <SignIn 
            routing="hash"
            redirectUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "text-center text-2xl font-bold text-purple-600 dark:text-purple-400",
                headerSubtitle: "text-center text-gray-600 dark:text-gray-300 mt-2",
                socialButtonsBlockButton: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200",
                formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 w-full",
                formFieldInput: "border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:focus:border-purple-400",
                footerActionLink: "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300",
                dividerLine: "bg-gradient-to-r from-purple-200 to-pink-200",
                dividerText: "text-gray-500 dark:text-gray-400",
              }
            }}
          />
        </div>

        {/* روابط إضافية */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-300">
            ليس لديك حساب؟{' '}
            <button 
              onClick={() => setLocation('/clerk-register')}
              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-semibold"
            >
              إنشاء حساب جديد
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}