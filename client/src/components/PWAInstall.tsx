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

    // تحقق متقدم من PWA readiness
    const checkPWAReadiness = async () => {
      console.log('PWA: التحقق من جاهزية PWA...');
      
      // تحقق من service worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      console.log('PWA: Service Worker دعم:', hasServiceWorker);
      
      // تحقق من manifest
      const hasManifest = document.querySelector('link[rel="manifest"]');
      console.log('PWA: Manifest موجود:', !!hasManifest);
      
      // تحقق من عدم التثبيت المسبق
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      console.log('PWA: مثبت مسبقاً:', isStandalone);
      
      // إذا لم يكن مثبتاً، أظهر الزر
      if (!isStandalone && hasServiceWorker && hasManifest) {
        console.log('PWA: التطبيق قابل للتثبيت، عرض الزر');
        setIsInstallable(true);
      }
    };

    setTimeout(checkPWAReadiness, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    console.log('PWA: تم الضغط على زر التثبيت');
    
    if (deferredPrompt) {
      try {
        console.log('PWA: عرض نافذة التثبيت...');
        // عرض نافذة التثبيت
        await deferredPrompt.prompt();
        
        // انتظار اختيار المستخدم
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA: اختيار المستخدم:', outcome);
        
        if (outcome === 'accepted') {
          console.log('PWA: تم قبول التثبيت');
          alert('✅ تم تثبيت التطبيق بنجاح!');
        } else {
          console.log('PWA: تم رفض التثبيت');
        }
        
        // تنظيف
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('PWA: خطأ في تثبيت التطبيق:', error);
        showManualInstructions();
      }
    } else {
      // إذا لم يكن هناك prompt، حاول التثبيت اليدوي
      console.log('PWA: لا يوجد prompt متاح، عرض التعليمات اليدوية');
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    
    let instructions = 'لتثبيت التطبيق:\n\n';
    
    if (isMobile) {
      if (isChrome) {
        instructions += '📱 Android Chrome:\n1. اضغط على القائمة (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
      } else if (isSafari) {
        instructions += '📱 iPhone Safari:\n1. اضغط على أيقونة المشاركة (⬆️)\n2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
      } else {
        instructions += '📱 على الهاتف:\nابحث عن خيار "إضافة إلى الشاشة الرئيسية" في قائمة المتصفح';
      }
    } else {
      if (isChrome) {
        instructions += '💻 Chrome على الكمبيوتر:\n1. ابحث عن أيقونة التثبيت (⬇️) في شريط العنوان\n2. أو اضغط Ctrl+Shift+I واختر "تثبيت التطبيق"';
      } else {
        instructions += '💻 على الكمبيوتر:\nاستخدم متصفح Chrome للحصول على أفضل تجربة تثبيت';
      }
    }
    
    alert(instructions);
  };

  // أظهر الزر دائماً للاختبار - يمكن إزالة هذا التعليق لاحقاً
  // if (!isInstallable) {
  //   return null;
  // }

  return (
    <button
      onClick={handleInstallClick}
      className="relative flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
      title={isInstallable ? "تثبيت التطبيق مجاناً" : "تعليمات التثبيت"}
    >
      <Download className="w-6 h-6" />
      <div className="text-right">
        <div className="text-sm font-bold leading-tight">تثبيت الآن</div>
        <div className="text-xs opacity-90 leading-tight">مجاناً</div>
      </div>
      {isInstallable && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-bounce flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </button>
  );
}