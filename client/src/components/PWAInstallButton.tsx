import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log('📱 App already installed');
      return;
    }

    // Check if we're in the second stage (after page reload)
    const installReady = localStorage.getItem('pwa-install-ready');
    if (installReady) {
      setIsReadyToInstall(true);
    }

    // Listen for install events
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
      localStorage.removeItem('pwa-install-ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Always show button
    setShowButton(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('🔘 Install button clicked');
    
    if (isReadyToInstall && deferredPrompt) {
      // Second stage: Try to install
      try {
        console.log('🎯 Attempting installation...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ تم التثبيت بنجاح');
          setShowButton(false);
          localStorage.removeItem('pwa-install-ready');
        } else {
          console.log('❌ User cancelled installation');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Install failed:', error);
      }
    } else {
      // First stage: Prepare for installation
      console.log('🔧 First click: Preparing for installation');
      localStorage.setItem('pwa-install-ready', 'true');
      
      // Simple page reload as requested by user
      window.location.reload();
    }
  };

  // Don't show if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
  if (isStandalone) return null;
  if (!showButton) return null;

  return (
    <div className="fixed top-24 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
        title="تثبيت تطبيق LaaBoBo كتطبيق مستقل"
      >
        <Download className="h-4 w-4" />
        {isReadyToInstall ? 'ثبت التطبيق' : 'انقر لتثبيت'}
      </button>
    </div>
  );
};