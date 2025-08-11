import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      // منع ظهور النافذة التلقائية
      e.preventDefault();
      // احفظ الحدث للاستخدام لاحقاً
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA: تم تثبيت التطبيق');
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // تحقق من حالة التثبيت الحالية
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: App is already installed');
      setIsInstallable(false);
    } else {
      console.log('PWA: App is not installed, waiting for beforeinstallprompt');
    }

    // Fallback: في بعض الأحيان، beforeinstallprompt لا يتم إطلاقه فوراً
    // إذا كان التطبيق يدعم PWA ولكن لم يتم تثبيته بعد، أظهر الزر
    setTimeout(() => {
      if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        // التحقق من دعم service worker و manifest
        if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
          console.log('PWA: Manual check - app appears installable');
          setIsInstallable(true);
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // إذا لم يكن هناك prompt محفوظ، حاول إظهار تعليمات التثبيت اليدوي
      alert('لتثبيت التطبيق:\n\n📱 على الهاتف: اضغط على القائمة في المتصفح واختر "إضافة إلى الشاشة الرئيسية"\n\n💻 على الكمبيوتر: ابحث عن أيقونة التثبيت في شريط العنوان');
      return;
    }

    try {
      // عرض نافذة التثبيت
      await deferredPrompt.prompt();
      
      // انتظار اختيار المستخدم
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA: المستخدم قبل تثبيت التطبيق');
      } else {
        console.log('PWA: المستخدم رفض تثبيت التطبيق');
      }
      
      // تنظيف
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('PWA: خطأ في تثبيت التطبيق:', error);
    }
  };

  // أظهر الزر دائماً للاختبار - يمكن إزالة هذا التعليق لاحقاً
  // if (!isInstallable) {
  //   return null;
  // }

  return (
    <button
      onClick={handleInstallClick}
      className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
      title={isInstallable ? "تثبيت التطبيق" : "تعليمات التثبيت"}
    >
      <Download className={`w-6 h-6 ${isInstallable ? 'text-green-600' : 'text-gray-600'}`} />
      {isInstallable && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
      )}
    </button>
  );
}