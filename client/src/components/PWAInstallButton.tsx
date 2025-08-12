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

    // Try to detect if PWA is installable manually
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('⚠️ No install prompt detected after 3 seconds');
        // Force show button for testing
        setShowButton(true);
      }
    }, 3000);

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
      // Manual installation guide for browsers without beforeinstallprompt
      alert('للتثبيت:\n\n• Chrome/Edge: اضغط على أيقونة التثبيت في شريط العنوان\n• Safari: Share → Add to Home Screen\n• Firefox: Menu → Install');
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