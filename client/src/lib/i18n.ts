// Internationalization system for LaaBoBo platform
import { useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

// Translation object type
export interface Translations {
  [key: string]: string | Translations;
}

// Arabic translations
const arTranslations: Translations = {
  common: {
    search: "البحث",
    create: "إنشاء",
    home: "الرئيسية",
    profile: "الملف الشخصي",
    messages: "الرسائل",
    notifications: "الإشعارات",
    settings: "الإعدادات",
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    share: "مشاركة",
    like: "إعجاب",
    comment: "تعليق",
    follow: "متابعة",
    unfollow: "إلغاء المتابعة",
    points: "النقاط",
    gift: "هدية",
    send: "إرسال"
  },
  auth: {
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    username: "اسم المستخدم",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة"
  },
  memory: {
    createMemory: "إنشاء ذكرى",
    memories: "الذكريات",
    uploadImage: "رفع صورة",
    uploadVideo: "رفع فيديو",
    caption: "التعليق",
    visibility: "الخصوصية",
    public: "عام",
    private: "خاص",
    flash: "فلاش",
    trending: "رائج",
    star: "نجمة",
    legend: "أسطوري",
    permanent: "دائم"
  },
  chat: {
    chat: "محادثة",
    typeMessage: "اكتب رسالة...",
    sendGift: "إرسال هدية",
    onlineNow: "متصل الآن",
    lastSeen: "آخر ظهور"
  },
  search: {
    searchPlaceholder: "ابحث عن مستخدمين، ذكريات، أو بث مباشر...",
    searchResults: "نتائج البحث",
    users: "المستخدمين",
    videos: "الفيديوهات",
    liveStreams: "البث المباشر",
    noResults: "لا توجد نتائج"
  }
};

// English translations
const enTranslations: Translations = {
  common: {
    search: "Search",
    create: "Create",
    home: "Home",
    profile: "Profile",
    messages: "Messages",
    notifications: "Notifications",
    settings: "Settings",
    loading: "Loading...",
    error: "An error occurred",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    share: "Share",
    like: "Like",
    comment: "Comment",
    follow: "Follow",
    unfollow: "Unfollow",
    points: "Points",
    gift: "Gift",
    send: "Send"
  },
  auth: {
    login: "Login",
    logout: "Logout",
    register: "Sign Up",
    email: "Email",
    password: "Password",
    username: "Username",
    firstName: "First Name",
    lastName: "Last Name"
  },
  memory: {
    createMemory: "Create Memory",
    memories: "Memories",
    uploadImage: "Upload Image",
    uploadVideo: "Upload Video",
    caption: "Caption",
    visibility: "Visibility",
    public: "Public",
    private: "Private",
    flash: "Flash",
    trending: "Trending",
    star: "Star",
    legend: "Legend",
    permanent: "Permanent"
  },
  chat: {
    chat: "Chat",
    typeMessage: "Type a message...",
    sendGift: "Send Gift",
    onlineNow: "Online now",
    lastSeen: "Last seen"
  },
  search: {
    searchPlaceholder: "Search for users, memories, or live streams...",
    searchResults: "Search Results",
    users: "Users",
    videos: "Videos",
    liveStreams: "Live Streams",
    noResults: "No results found"
  }
};

const translations = {
  ar: arTranslations,
  en: enTranslations
};

// Language context
export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or default to Arabic
    const saved = localStorage.getItem('laabo-language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('laabo-language', language);
    
    // Update document direction and language
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Update body class for styling
    document.body.className = document.body.className.replace(/\b(rtl|ltr)\b/g, '');
    document.body.classList.add(language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  const isRTL = language === 'ar';

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL
  };
};

// Hook to get translation function
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};