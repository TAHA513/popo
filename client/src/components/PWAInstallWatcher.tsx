import { useEffect, useState } from 'react';

// Silent PWA install watcher that only logs and tracks but doesn't show any UI
export const PWAInstallWatcher = () => {
  const [, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Listen for the browser's native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 PWA Install prompt detected by browser');
      // Don't prevent the default behavior - let browser handle it
      // e.preventDefault(); // DON'T do this - we want browser to show native prompt
      
      setDeferredPrompt(e);
      setCanInstall(true);
      
      // Log that the app is installable
      console.log('✅ App is ready for installation via browser prompt');
    };

    // Listen for successful app install
    const handleAppInstalled = () => {
      console.log('🎉 PWA installed successfully!');
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      console.log('📱 App is already installed');
    } else {
      console.log('🌐 App running in browser mode - install prompt may appear');
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

  // Log current status periodically (for debugging)
  useEffect(() => {
    const interval = setInterval(() => {
      if (canInstall) {
        console.log('📊 PWA Status: Installable via browser');
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [canInstall]);

  // This component renders nothing - it's just a silent watcher
  return null;
};