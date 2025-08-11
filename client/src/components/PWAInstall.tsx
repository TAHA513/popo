import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { PWADiagnostics } from './PWADiagnostics';

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
      console.log('🔍 PWA: التحقق الشامل من جاهزية PWA...');
      
      // 1. تحقق من service worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      console.log('📱 PWA: Service Worker دعم:', hasServiceWorker);
      
      // 2. تحقق من manifest
      const hasManifest = document.querySelector('link[rel="manifest"]');
      console.log('📋 PWA: Manifest موجود:', !!hasManifest);
      
      // 3. تحقق من HTTPS
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      console.log('🔒 PWA: اتصال آمن:', isSecure);
      
      // 4. تحقق من عدم التثبيت المسبق
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      console.log('📲 PWA: مثبت مسبقاً:', isStandalone);
      
      // 5. تحقق من service worker مثبت فعلياً
      if (hasServiceWorker) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('⚙️ PWA: Service Workers مثبتة:', registrations.length);
          registrations.forEach((reg, index) => {
            console.log(`   ${index + 1}. Scope: ${reg.scope}`);
          });
        } catch (error) {
          console.log('⚠️ PWA: فشل في فحص Service Workers:', error);
        }
      }
      
      // 6. تحقق من Manifest محتوى
      if (hasManifest) {
        try {
          const manifestHref = (hasManifest as HTMLLinkElement).href;
          console.log('📂 PWA: Manifest URL:', manifestHref);
        } catch (error) {
          console.log('⚠️ PWA: فشل في قراءة Manifest URL');
        }
      }
      
      // 7. قرار النهائي للتثبيت
      const canInstall = !isStandalone && hasServiceWorker && hasManifest && isSecure;
      console.log('🚀 PWA: قابل للتثبيت:', canInstall);
      
      if (canInstall) {
        console.log('✅ PWA: جميع المتطلبات متوفرة، عرض زر التثبيت');
        setIsInstallable(true);
      } else {
        console.log('❌ PWA: متطلبات ناقصة:', {
          'مثبت مسبقاً': isStandalone,
          'Service Worker': hasServiceWorker,
          'Manifest': !!hasManifest,
          'HTTPS': isSecure
        });
      }
    };

    // تحقق متكرر لضمان اكتشاف حالة PWA
    setTimeout(checkPWAReadiness, 1000);
    setTimeout(checkPWAReadiness, 3000);
    
    // إذا لم يتم استلام beforeinstallprompt بعد 5 ثوان، أظهر الزر للمساعدة اليدوية
    setTimeout(() => {
      if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA: لم يتم استلام beforeinstallprompt، عرض زر المساعدة');
        setIsInstallable(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    console.log('PWA: بدء عملية التثبيت...');
    
    // محاولة التثبيت التلقائي أولاً
    if (deferredPrompt) {
      try {
        console.log('PWA: محاولة التثبيت التلقائي...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA: تم قبول التثبيت');
          alert('✅ تم تثبيت التطبيق بنجاح!');
          setDeferredPrompt(null);
          setIsInstallable(false);
          return;
        } else {
          console.log('PWA: تم رفض التثبيت');
        }
      } catch (error) {
        console.log('PWA: فشل التثبيت التلقائي:', error);
      }
    } else {
      console.log('PWA: لا يوجد deferred prompt متاح');
    }
    
    // إذا لم ينجح التثبيت التلقائي، أظهر التعليمات المبسطة
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
      message = `📱 تثبيت LaaBoBo على iPhone/iPad:

🔹 الطريقة السهلة:
1. اضغط زر المشاركة ⬆️ (أسفل الشاشة)
2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"
3. اضغط "إضافة"

✅ سيصبح LaaBoBo تطبيقاً منفصلاً على هاتفك!`;
    } else if (isAndroid && isChrome) {
      message = `📱 تثبيت LaaBoBo على Android:

🔹 الطريقة المباشرة:
1. اضغط النقاط الثلاث ⋮ (أعلى يمين المتصفح)
2. ابحث عن "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"
3. اضغط "تثبيت"

✅ سيظهر LaaBoBo كتطبيق عادي في هاتفك!`;
    } else if (isChrome) {
      message = `💻 تثبيت LaaBoBo على الكمبيوتر:

🔹 الطريقة الأولى:
• ابحث عن أيقونة التثبيت ⬇️ في شريط العنوان (يمين الرابط)
• اضغط عليها واختر "تثبيت"

🔹 الطريقة الثانية:
• اضغط القائمة ⋮ ← "تثبيت LaaBoBo"

✅ سيصبح LaaBoBo برنامجاً منفصلاً على الكمبيوتر!`;
    } else {
      message = `🌐 للحصول على تجربة تثبيت مثالية:

انسخ هذا الرابط وافتحه في متصفح Chrome:
${window.location.href}

ثم اضغط زر "تثبيت مباشر" مرة أخرى`;
    }
    
    alert(message);
  };

  // أظهر الزر دائماً للأجهزة المدعومة
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return null; // التطبيق مثبت مسبقاً
  }

  return (
    <div className="flex flex-col gap-2">
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
      <PWADiagnostics />
    </div>
  );
}