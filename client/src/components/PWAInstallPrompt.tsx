import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface PWAInstallPromptProps {}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone app
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after a delay if not dismissed
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed && !isStandalone) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('✅ LaaBoBo PWA installed successfully');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show manual install prompt
    if (iOS && !isStandalone) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('ios-install-dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
      } else {
        console.log('❌ User dismissed PWA installation');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    
    if (isIOS) {
      localStorage.setItem('ios-install-dismissed', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if already installed or dismissed
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-xl shadow-2xl text-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-lg p-2 mr-3">
              <img 
                src="/rabbit-icon-192.svg" 
                alt="LaaBoBo"
                className="w-full h-full"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm">تثبيت LaaBoBo</h3>
              <p className="text-xs opacity-90">للوصول السريع</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>

        {isIOS ? (
          <div className="text-xs space-y-2 mb-3">
            <p className="flex items-center">
              <Smartphone size={14} className="mr-2" />
              اضغط على زر المشاركة
            </p>
            <p className="mr-6">ثم اختر "إضافة إلى الشاشة الرئيسية"</p>
          </div>
        ) : (
          <p className="text-xs mb-3">
            احصل على تجربة تطبيق كاملة مع إشعارات فورية وعمل دون اتصال
          </p>
        )}

        <div className="flex space-x-2 space-x-reverse">
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-pink-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
            >
              <Download size={16} className="ml-2" />
              تثبيت الآن
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-white/80 text-sm"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;