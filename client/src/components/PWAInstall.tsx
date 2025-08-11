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
    // أولاً حاول التثبيت التلقائي
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          alert('✅ تم التثبيت!');
          setDeferredPrompt(null);
          setIsInstallable(false);
          return;
        }
      } catch (error) {
        console.log('فشل التثبيت التلقائي، محاولة الطريقة اليدوية');
      }
    }
    
    // إذا لم ينجح التثبيت التلقائي، أظهر التعليمات
    showSimpleInstructions();
  };

  const showSimpleInstructions = () => {
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !isChrome;
    
    let message = '';
    
    if (isIOS && isSafari) {
      message = '📱 iPhone/iPad:\n\n1. اضغط على زر المشاركة ⬆️ (أسفل الشاشة)\n2. اختر "إضافة إلى الشاشة الرئيسية" \n3. اضغط "إضافة"\n\n✅ ستجد أيقونة التطبيق على شاشتك الرئيسية!';
    } else if (isAndroid && isChrome) {
      message = '📱 Android:\n\n1. اضغط على النقاط الثلاث ⋮ (أعلى يمين المتصفح)\n2. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"\n3. اضغط "تثبيت"\n\n✅ ستجد التطبيق مثبتاً على هاتفك!';
    } else if (isChrome) {
      message = '💻 الكمبيوتر:\n\n1. ابحث عن أيقونة التثبيت ⬇️ في شريط العنوان\n2. اضغط عليها\n3. اختر "تثبيت"\n\nأو من القائمة ⋮ اختر "تثبيت LaaBoBo"\n\n✅ سيصبح التطبيق متاحاً كبرنامج منفصل!';
    } else {
      message = '🌐 للحصول على أفضل تجربة تثبيت:\n\nافتح التطبيق في متصفح Chrome ثم اضغط على زر "تثبيت الآن" مرة أخرى';
    }
    
    alert(message);
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
        <div className="text-sm font-bold leading-tight">تثبيت مباشر</div>
        <div className="text-xs opacity-90 leading-tight">ضغطة واحدة</div>
      </div>
      {isInstallable && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-bounce flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </button>
  );
}