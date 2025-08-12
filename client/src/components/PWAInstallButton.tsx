import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log('📱 App already installed');
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      console.log('✅ beforeinstallprompt event captured');
      setDeferredPrompt(e);
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      console.log('🎉 App installed successfully');
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show button by default for testing
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('🔍 No install prompt detected, showing button anyway');
        setShowButton(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    console.log('🔘 Install button clicked');
    
    if (deferredPrompt) {
      // Use native install prompt if available
      try {
        console.log('🎯 Triggering native install prompt...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ تم تثبيت التطبيق بنجاح!');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Install prompt failed:', error);
      }
    }
    
    // Always hide button after click (no popups or modals)
    console.log('✅ Hiding install button after click');
    setShowButton(false);
  };

  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;

  // Don't show button if app is already installed
  if (isStandalone) {
    return null;
  }

  if (!showButton) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
        title="تثبيت تطبيق LaaBoBo كتطبيق مستقل"
      >
        <Download className="h-4 w-4" />
        ثبت التطبيق
      </button>
    </div>
  );
};