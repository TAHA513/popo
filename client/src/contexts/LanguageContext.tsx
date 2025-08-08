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
    
    // Navigation & Pages
    'nav.home': 'الرئيسية',
    'nav.explore': 'اكتشف',
    'nav.messages': 'الرسائل',
    'nav.notifications': 'الإشعارات',
    'nav.profile': 'الملف الشخصي',
    'nav.account': 'إدارة الحساب',
    'nav.wallet': 'المحفظة',
    'nav.gifts': 'الهدايا',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Home Page
    'home.title': 'مرحباً بك في LaaBoBo Live',
    'home.subtitle': 'منصة البث المباشر الأكثر تفاعلاً',
    'home.start_streaming': 'بدء البث',
    'home.explore_content': 'استكشف المحتوى',
    'home.recent_memories': 'الذكريات الحديثة',
    'home.no_memories': 'لا توجد ذكريات حالياً',
    'home.create_memory': 'إنشاء ذكرى جديدة',
    'home.live_streams': 'البث المباشر',
    'home.trending': 'الشائع',
    
    // Explore Page
    'explore.title': 'استكشف',
    'explore.live_streams': 'البث المباشر',
    'explore.categories': 'الفئات',
    'explore.trending': 'الشائع',
    'explore.new': 'جديد',
    'explore.popular': 'الأكثر شعبية',
    'explore.no_streams': 'لا توجد بثوث مباشرة حالياً',
    
    // Messages
    'messages.title': 'الرسائل',
    'messages.conversations': 'المحادثات',
    'messages.requests': 'طلبات الرسائل',
    'messages.no_conversations': 'لا توجد محادثات',
    'messages.new_message': 'رسالة جديدة',
    'messages.type_message': 'اكتب رسالة...',
    'messages.send': 'إرسال',
    'messages.online': 'متصل',
    'messages.offline': 'غير متصل',
    'messages.typing': 'يكتب...',
    
    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.mark_all_read': 'تحديد الكل كمقروء',
    'notifications.no_notifications': 'لا توجد إشعارات',
    'notifications.new_follower': 'متابع جديد',
    'notifications.new_gift': 'هدية جديدة',
    'notifications.new_message': 'رسالة جديدة',
    'notifications.stream_started': 'بدء البث',
    
    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.edit_profile': 'تعديل الملف الشخصي',
    'profile.followers': 'المتابعون',
    'profile.following': 'يتابع',
    'profile.memories': 'الذكريات',
    'profile.albums': 'الألبومات',
    'profile.gifts_received': 'الهدايا المستلمة',
    'profile.follow': 'متابعة',
    'profile.unfollow': 'إلغاء المتابعة',
    'profile.message': 'راسل',
    'profile.send_gift': 'إرسال هدية',
    'profile.first_name': 'الاسم الأول',
    'profile.last_name': 'الاسم الأخير',
    'profile.email': 'البريد الإلكتروني',
    'profile.account_type': 'نوع الحساب',
    'profile.save_changes': 'حفظ التغييرات',
    'profile.click_camera': 'انقر على الكاميرا لتغيير الصورة',
    'profile.personal_info': 'المعلومات الشخصية',
    
    // Gifts
    'gifts.title': 'الهدايا',
    'gifts.send_gift': 'إرسال هدية',
    'gifts.received': 'المستلمة',
    'gifts.sent': 'المرسلة',
    'gifts.characters': 'الشخصيات',
    'gifts.select_character': 'اختر شخصية',
    'gifts.confirm_send': 'تأكيد الإرسال',
    'gifts.gift_sent': 'تم إرسال الهدية',
    'gifts.insufficient_points': 'نقاط غير كافية',
    
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
    'settings.theme': 'المظهر',
    'settings.dark_mode': 'الوضع المظلم',
    'settings.light_mode': 'الوضع الفاتح',
    
    // Wallet
    'wallet.title': 'المحفظة',
    'wallet.digital_wallet': 'المحفظة الرقمية',
    'wallet.current_points': 'النقاط الحالية',
    'wallet.total_earnings': 'إجمالي الأرباح',
    'wallet.gifts_sent': 'الهدايا المرسلة',
    'wallet.buy_points': 'شراء نقاط',
    'wallet.withdraw': 'سحب الأرباح',
    'wallet.transaction_history': 'تاريخ المعاملات',
    'wallet.points_packages': 'باقات النقاط',
    
    // Streaming
    'stream.start_streaming': 'بدء البث',
    'stream.stop_streaming': 'إيقاف البث',
    'stream.viewers': 'المشاهدون',
    'stream.chat': 'الدردشة',
    'stream.settings': 'إعدادات البث',
    'stream.camera': 'الكاميرا',
    'stream.microphone': 'المايكروفون',
    'stream.screen_share': 'مشاركة الشاشة',
    'stream.beauty_filters': 'فلاتر الجمال',
    
    // Security
    'security.title': 'الأمان والحماية',
    'security.current_password': 'كلمة المرور الحالية',
    'security.new_password': 'كلمة المرور الجديدة',
    'security.confirm_password': 'تأكيد كلمة المرور',
    'security.update_password': 'تحديث كلمة المرور',
    'security.two_factor': 'المصادقة الثنائية',
    'security.login_history': 'تاريخ تسجيل الدخول',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.update': 'تحديث',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.confirm': 'تأكيد',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.search': 'بحث',
    'common.filter': 'فلتر',
    'common.sort': 'ترتيب',
    'common.view_all': 'عرض الكل',
    'common.show_more': 'عرض المزيد',
    'common.show_less': 'عرض أقل',
    
    // Account Types
    'account.user': 'مستخدم',
    'account.admin': 'مدير',
    'account.super_admin': 'مدير عام',
    'account.verified': 'موثق',
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
    
    // Navigation & Pages
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    'nav.account': 'Account Management',
    'nav.wallet': 'Wallet',
    'nav.gifts': 'Gifts',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Home Page
    'home.title': 'Welcome to LaaBoBo Live',
    'home.subtitle': 'The Most Interactive Live Streaming Platform',
    'home.start_streaming': 'Start Streaming',
    'home.explore_content': 'Explore Content',
    'home.recent_memories': 'Recent Memories',
    'home.no_memories': 'No memories yet',
    'home.create_memory': 'Create New Memory',
    'home.live_streams': 'Live Streams',
    'home.trending': 'Trending',
    
    // Explore Page
    'explore.title': 'Explore',
    'explore.live_streams': 'Live Streams',
    'explore.categories': 'Categories',
    'explore.trending': 'Trending',
    'explore.new': 'New',
    'explore.popular': 'Popular',
    'explore.no_streams': 'No live streams currently',
    
    // Messages
    'messages.title': 'Messages',
    'messages.conversations': 'Conversations',
    'messages.requests': 'Message Requests',
    'messages.no_conversations': 'No conversations yet',
    'messages.new_message': 'New Message',
    'messages.type_message': 'Type a message...',
    'messages.send': 'Send',
    'messages.online': 'Online',
    'messages.offline': 'Offline',
    'messages.typing': 'Typing...',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.mark_all_read': 'Mark All as Read',
    'notifications.no_notifications': 'No notifications',
    'notifications.new_follower': 'New Follower',
    'notifications.new_gift': 'New Gift',
    'notifications.new_message': 'New Message',
    'notifications.stream_started': 'Stream Started',
    
    // Profile
    'profile.title': 'Profile',
    'profile.edit_profile': 'Edit Profile',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.memories': 'Memories',
    'profile.albums': 'Albums',
    'profile.gifts_received': 'Gifts Received',
    'profile.follow': 'Follow',
    'profile.unfollow': 'Unfollow',
    'profile.message': 'Message',
    'profile.send_gift': 'Send Gift',
    'profile.first_name': 'First Name',
    'profile.last_name': 'Last Name',
    'profile.email': 'Email',
    'profile.account_type': 'Account Type',
    'profile.save_changes': 'Save Changes',
    'profile.click_camera': 'Click camera to change picture',
    'profile.personal_info': 'Personal Information',
    
    // Gifts
    'gifts.title': 'Gifts',
    'gifts.send_gift': 'Send Gift',
    'gifts.received': 'Received',
    'gifts.sent': 'Sent',
    'gifts.characters': 'Characters',
    'gifts.select_character': 'Select Character',
    'gifts.confirm_send': 'Confirm Send',
    'gifts.gift_sent': 'Gift Sent',
    'gifts.insufficient_points': 'Insufficient Points',
    
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
    'settings.theme': 'Theme',
    'settings.dark_mode': 'Dark Mode',
    'settings.light_mode': 'Light Mode',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.digital_wallet': 'Digital Wallet',
    'wallet.current_points': 'Current Points',
    'wallet.total_earnings': 'Total Earnings',
    'wallet.gifts_sent': 'Gifts Sent',
    'wallet.buy_points': 'Buy Points',
    'wallet.withdraw': 'Withdraw Earnings',
    'wallet.transaction_history': 'Transaction History',
    'wallet.points_packages': 'Points Packages',
    
    // Streaming
    'stream.start_streaming': 'Start Streaming',
    'stream.stop_streaming': 'Stop Streaming',
    'stream.viewers': 'Viewers',
    'stream.chat': 'Chat',
    'stream.settings': 'Stream Settings',
    'stream.camera': 'Camera',
    'stream.microphone': 'Microphone',
    'stream.screen_share': 'Screen Share',
    'stream.beauty_filters': 'Beauty Filters',
    
    // Security
    'security.title': 'Security & Protection',
    'security.current_password': 'Current Password',
    'security.new_password': 'New Password',
    'security.confirm_password': 'Confirm Password',
    'security.update_password': 'Update Password',
    'security.two_factor': 'Two-Factor Authentication',
    'security.login_history': 'Login History',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view_all': 'View All',
    'common.show_more': 'Show More',
    'common.show_less': 'Show Less',
    
    // Account Types
    'account.user': 'User',
    'account.admin': 'Admin',
    'account.super_admin': 'Super Admin',
    'account.verified': 'Verified',
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