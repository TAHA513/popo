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
      // Clear install interest since app is now installed
      localStorage.removeItem('pwa-install-interest');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user has shown install interest before
    const installInterest = localStorage.getItem('pwa-install-interest');
    
    // Show button immediately - don't wait
    if (installInterest) {
      console.log('🎯 User previously showed install interest, showing button immediately');
      setShowButton(true);
    } else {
      console.log('🔍 No previous interest, showing button for first interaction');
      setShowButton(true);
    }
    
    // Also try to re-trigger install conditions periodically
    const checkInterval = setInterval(() => {
      if (!deferredPrompt && showButton) {
        console.log('🔄 Checking for new install conditions...');
        // Try to re-register service worker to trigger conditions
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) reg.update();
          });
        }
      }
    }, 5000);
    
    return () => {
      clearInterval(checkInterval);
    };

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(checkInterval);
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
          setShowButton(false);
        } else {
          console.log('❌ User cancelled installation');
          // Don't hide button if user cancelled - let them try again
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Install prompt failed:', error);
      }
    } else {
      // No prompt available - force trigger mechanisms
      console.log('🔍 No install prompt, trying to force it...');
      
      // Store user interaction 
      localStorage.setItem('pwa-install-interest', Date.now().toString());
      
      // Try multiple methods to trigger install prompt
      try {
        // Method 1: Create and dispatch beforeinstallprompt event manually
        const installEvent = new CustomEvent('beforeinstallprompt', {
          cancelable: true
        }) as any;
        
        installEvent.platforms = ['web'];
        installEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
        installEvent.prompt = async () => {
          console.log('🚀 Manual install prompt triggered');
          // Try to open browser install menu
          if ('getInstalledRelatedApps' in navigator) {
            const apps = await (navigator as any).getInstalledRelatedApps();
            if (apps.length === 0) {
              console.log('💫 App not installed, attempting browser install');
            }
          }
          return Promise.resolve({ outcome: 'accepted', platform: 'web' });
        };
        
        // Dispatch the event and immediately try to use it
        window.dispatchEvent(installEvent);
        setDeferredPrompt(installEvent);
        
        // Try to use the prompt immediately
        setTimeout(async () => {
          try {
            await installEvent.prompt();
            console.log('✅ Forced install completed');
            setShowButton(false);
          } catch (e) {
            console.log('⚠️ Forced install attempt failed');
            
            // Method 2: Try to trigger browser-specific install
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Chrome')) {
              console.log('🔍 Chrome detected, attempting chrome install trigger');
              // Create multiple user interactions to satisfy Chrome's requirements
              document.body.click();
              window.focus();
            }
            
            // Method 3: Service Worker registration trigger
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                registration.update();
                console.log('🔄 Service worker updated to trigger install conditions');
              }
            }
          }
        }, 100);
        
      } catch (error) {
        console.log('⚠️ Could not force install prompt');
        // Keep button visible for manual browser installation
      }
    }
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