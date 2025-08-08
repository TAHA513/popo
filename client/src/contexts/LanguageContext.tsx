import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LanguageOption {
  code: 'en' | 'ar';
  name: string;
  localName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const languages: LanguageOption[] = [
  {
    code: 'ar',
    name: 'Arabic',
    localName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦'
  },
  {
    code: 'en',
    name: 'English',
    localName: 'English',
    direction: 'ltr',
    flag: '🇺🇸'
  }
];

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  ar: {
    // Login Page
    'login.welcome': 'مرحباً بعودتك',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.button': 'تسجيل الدخول',
    'login.signing_in': 'جاري تسجيل الدخول...',
    'login.forgot_password': 'نسيت كلمة المرور؟',
    'login.error': 'خطأ',
    'login.success': 'تم بنجاح',
    
    // Settings
    'settings.app_settings': 'إعدادات التطبيق',
    'settings.language': 'اللغة',
    'settings.language_desc': 'اختر لغة التطبيق',
    'settings.notifications': 'الإشعارات',
    'settings.notifications_desc': 'تلقي إشعارات الهدايا والرسائل',
    'settings.privacy': 'الخصوصية',
    'settings.privacy_desc': 'إدارة إعدادات الخصوصية',
    'settings.enable': 'تفعيل',
    'settings.manage': 'إدارة',
    
    // Profile
    'profile.first_name': 'الاسم الأول',
    'profile.last_name': 'الاسم الأخير',
    'profile.email': 'البريد الإلكتروني',
    'profile.account_type': 'نوع الحساب',
    'profile.save_changes': 'حفظ التغييرات',
    'profile.click_camera': 'انقر على الكاميرا لتغيير الصورة',
    
    // Wallet
    'wallet.digital_wallet': 'المحفظة الرقمية',
    'wallet.current_points': 'النقاط الحالية',
    'wallet.total_earnings': 'إجمالي الأرباح',
    'wallet.gifts_sent': 'الهدايا المرسلة',
    'wallet.buy_points': 'شراء نقاط',
    'wallet.withdraw': 'سحب الأرباح',
    
    // Security
    'security.title': 'الأمان والحماية',
    'security.current_password': 'كلمة المرور الحالية',
    'security.new_password': 'كلمة المرور الجديدة',
    'security.update_password': 'تحديث كلمة المرور',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
  },
  en: {
    // Login Page
    'login.welcome': 'Welcome back',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.button': 'Sign In',
    'login.signing_in': 'Signing in...',
    'login.forgot_password': 'Forgot password?',
    'login.error': 'Error',
    'login.success': 'Success',
    
    // Settings
    'settings.app_settings': 'App Settings',
    'settings.language': 'Language',
    'settings.language_desc': 'Choose your app language',
    'settings.notifications': 'Notifications',
    'settings.notifications_desc': 'Receive gift and message notifications',
    'settings.privacy': 'Privacy',
    'settings.privacy_desc': 'Manage privacy settings',
    'settings.enable': 'Enable',
    'settings.manage': 'Manage',
    
    // Profile
    'profile.first_name': 'First Name',
    'profile.last_name': 'Last Name',
    'profile.email': 'Email',
    'profile.account_type': 'Account Type',
    'profile.save_changes': 'Save Changes',
    'profile.click_camera': 'Click camera to change picture',
    
    // Wallet
    'wallet.digital_wallet': 'Digital Wallet',
    'wallet.current_points': 'Current Points',
    'wallet.total_earnings': 'Total Earnings',
    'wallet.gifts_sent': 'Gifts Sent',
    'wallet.buy_points': 'Buy Points',
    'wallet.withdraw': 'Withdraw Earnings',
    
    // Security
    'security.title': 'Security & Protection',
    'security.current_password': 'Current Password',
    'security.new_password': 'New Password',
    'security.update_password': 'Update Password',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(() => {
    // Get saved language from localStorage or default to Arabic
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      return languages.find(lang => lang.code === savedLanguage) || languages[0];
    }
    return languages[0]; // Default to Arabic
  });

  const setLanguage = (language: LanguageOption) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language.code);
    
    // Update document direction
    document.documentElement.dir = language.direction;
    document.documentElement.lang = language.code;
  };

  const t = (key: string): string => {
    return (translations[currentLanguage.code] as any)[key] || key;
  };

  // Set initial direction on mount
  useEffect(() => {
    document.documentElement.dir = currentLanguage.direction;
    document.documentElement.lang = currentLanguage.code;
  }, [currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isRTL: currentLanguage.direction === 'rtl',
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Provide fallback values if context is not available
    return {
      currentLanguage: languages[0], // Default to Arabic
      setLanguage: () => {},
      isRTL: true,
      t: (key: string) => key, // Return key as fallback
    };
  }
  return context;
}