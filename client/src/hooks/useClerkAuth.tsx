import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

// Hook مخصص للمصادقة باستخدام Clerk
export function useAuth() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      setIsLoading(false);
    }
  }, [userLoaded]);

  // دالة تسجيل الدخول
  const login = async (email: string, password: string) => {
    try {
      if (!signIn) throw new Error('Sign in not available');
      
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        return { success: true, user: result.createdSessionId };
      }

      return { success: false, error: 'فشل في تسجيل الدخول' };
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { success: false, error: error.message || 'حدث خطأ في تسجيل الدخول' };
    }
  };

  // دالة إنشاء حساب جديد
  const register = async (email: string, password: string, username: string) => {
    try {
      if (!signUp) throw new Error('Sign up not available');
      
      const result = await signUp.create({
        emailAddress: email,
        password,
        username,
      });

      if (result.status === 'complete') {
        return { success: true, user: result.createdSessionId };
      }

      // إذا كان يحتاج لتأكيد البريد الإلكتروني
      if (result.status === 'missing_requirements') {
        return { 
          success: false, 
          error: 'يرجى تأكيد البريد الإلكتروني',
          needsVerification: true,
          signUp: result
        };
      }

      return { success: false, error: 'فشل في إنشاء الحساب' };
    } catch (error: any) {
      console.error('خطأ في إنشاء الحساب:', error);
      return { success: false, error: error.message || 'حدث خطأ في إنشاء الحساب' };
    }
  };

  // دالة تسجيل الخروج
  const logout = async () => {
    try {
      await signOut();
      return { success: true };
    } catch (error: any) {
      console.error('خطأ في تسجيل الخروج:', error);
      return { success: false, error: error.message || 'حدث خطأ في تسجيل الخروج' };
    }
  };

  // دالة للحصول على رمز المصادقة
  const getAuthToken = async () => {
    try {
      const token = await getToken();
      return token;
    } catch (error) {
      console.error('خطأ في الحصول على رمز المصادقة:', error);
      return null;
    }
  };

  // دالة إعادة تعيين كلمة المرور
  const resetPassword = async (email: string) => {
    try {
      if (!signIn) throw new Error('Sign in not available');
      
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      return { success: true, message: 'تم إرسال رسالة إعادة تعيين كلمة المرور' };
    } catch (error: any) {
      console.error('خطأ في إرسال رسالة إعادة التعيين:', error);
      return { success: false, error: error.message || 'حدث خطأ في إرسال الرسالة' };
    }
  };

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.imageUrl,
      isSignedIn,
    } : null,
    isLoading,
    isSignedIn,
    login,
    register,
    logout,
    resetPassword,
    getAuthToken,
  };
}