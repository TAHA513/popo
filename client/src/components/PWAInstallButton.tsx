import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('🔥 PWA Install Prompt Available!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA Successfully Installed!');
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    console.log('🔍 PWA Status Check:', {
      isStandalone,
      hasServiceWorker: 'serviceWorker' in navigator,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent
    });
    
    if (isStandalone) {
      console.log('📱 App is already running in standalone mode');
      setShowButton(false);
      return;
    }

    // Force show button after delay for manual installation
    setTimeout(() => {
      console.log('⚠️ No install prompt detected, showing manual install button');
      setShowButton(true);
    }, 2000);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    console.log('🔘 Install button clicked', { deferredPrompt: !!deferredPrompt });
    
    if (!deferredPrompt) {
      // Check if we can detect Chrome-based browsers more accurately
      const isChrome = /Chrome|Chromium|Edge/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      
      let message = '📱 لتثبيت تطبيق LaaBoBo:\n\n';
      
      if (isChrome) {
        message += '• ابحث عن أيقونة "تثبيت" 📥 في شريط العنوان\n• أو: قائمة المتصفح (⋮) ← "تثبيت LaaBoBo"\n• أو: إعدادات ← "تثبيت هذا الموقع كتطبيق"';
      } else if (isSafari) {
        message += '• اضغط على زر المشاركة 📤\n• اختر "إضافة إلى الشاشة الرئيسية" 📱\n• سيظهر التطبيق على شاشتك الرئيسية';
      } else if (isFirefox) {
        message += '• قائمة Firefox ← "تثبيت"\n• أو: اضغط على أيقونة التثبيت في شريط العنوان';
      } else {
        message += '• ابحث عن أيقونة التثبيت في شريط العنوان\n• أو: إعدادات المتصفح ← "تثبيت التطبيق"';
      }
      
      message += '\n\n💡 ملاحظة: تأكد من أن الموقع يستخدم HTTPS للتثبيت';
      alert(message);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('📊 User choice:', outcome);
      
      setDeferredPrompt(null);
      setShowButton(false);
    } catch (error) {
      console.error('❌ Install prompt failed:', error);
    }
  };

  // Always show button for easier testing and access
  if (!showButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
      title="تثبيت تطبيق LaaBoBo"
    >
      <Download className="h-4 w-4" />
      📱 تثبيت
    </button>
  );
}