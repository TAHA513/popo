import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';
import { ReactNode } from 'react';

// إعداد متغيرات البيئة لـ Clerk
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Z3Jvd2luZy1tYWdwaWUtMjIuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!clerkPublishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY مطلوب');
}

interface ClerkProviderProps {
  children: ReactNode;
}

// مكون Clerk Provider الرئيسي
export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkReactProvider 
      publishableKey={clerkPublishableKey}
      appearance={{
        elements: {
          // تخصيص مظهر Clerk ليتماشى مع تصميم LaaBoBo
          card: "bg-white dark:bg-gray-800 shadow-lg rounded-lg",
          headerTitle: "text-xl font-semibold text-purple-600 dark:text-purple-400",
          headerSubtitle: "text-gray-600 dark:text-gray-300",
          socialButtonsBlockButton: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
          formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
          formFieldInput: "border-purple-200 focus:border-purple-500 focus:ring-purple-500",
          footerActionLink: "text-purple-600 hover:text-purple-800",
        },
        layout: {
          // تخصيص تخطيط Clerk
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton',
        },
        variables: {
          // ألوان LaaBoBo المخصصة
          colorPrimary: '#8B5CF6',
          colorBackground: '#FFFFFF',
          colorText: '#374151',
          colorTextSecondary: '#6B7280',
          colorNeutral: '#F3F4F6',
        }
      }}
      localization={{
        // تخصيص النصوص باللغة العربية
        signIn: {
          start: {
            title: 'تسجيل الدخول إلى LaaBoBo',
            subtitle: 'مرحباً بك مرة أخرى!'
          }
        },
        signUp: {
          start: {
            title: 'إنشاء حساب LaaBoBo',
            subtitle: 'انضم إلى مجتمع LaaBoBo'
          }
        },
        userProfile: {
          navbar: {
            title: 'الملف الشخصي',
            description: 'إدارة معلومات حسابك'
          }
        }
      }}
    >
      {children}
    </ClerkReactProvider>
  );
}