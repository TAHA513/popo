import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstall = isInStandaloneMode || isInWebAppiOS;
    setIsInstalled(isInstall);
    
    console.log('PWA Status:', {
      isInStandaloneMode,
      isInWebAppiOS,
      isInstalled: isInstall,
      userAgent: navigator.userAgent
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Service Worker status check
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('PWA: Service Worker is ready');
        setSwReady(true);
      });

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('PWA: New service worker activated');
        setUpdateAvailable(true);
      });
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.warn('PWA: No deferred prompt available');
      return false;
    }

    try {
      console.log('PWA: Prompting user to install');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: User choice:', outcome);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA: Error installing app:', error);
      return false;
    }
  };

  const reloadApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    swReady,
    updateAvailable,
    installApp,
    reloadApp,
    // Additional info for debugging
    debug: {
      deferredPrompt: !!deferredPrompt,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      platform: navigator.platform,
      userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
    }
  };
}