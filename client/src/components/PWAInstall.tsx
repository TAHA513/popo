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
      // منع ظهور النافذة التلقائية
      e.preventDefault();
      // احفظ الحدث للاستخدام لاحقاً
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA تم تثبيت التطبيق');
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // تحقق من حالة التثبيت الحالية
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // عرض نافذة التثبيت
    deferredPrompt.prompt();
    
    // انتظار اختيار المستخدم
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('المستخدم قبل تثبيت التطبيق');
    } else {
      console.log('المستخدم رفض تثبيت التطبيق');
    }
    
    // تنظيف
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // لا تظهر الزر إذا لم يكن التطبيق قابل للتثبيت
  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
      title="تثبيت التطبيق"
    >
      <Download className="w-6 h-6" />
    </button>
  );
}