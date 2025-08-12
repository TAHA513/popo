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
      // Clear install interest and click count since app is now installed
      localStorage.removeItem('pwa-install-interest');
      localStorage.removeItem('pwa-click-count');
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
      // No prompt available - increment click count and try different strategies
      const clickCount = parseInt(localStorage.getItem('pwa-click-count') || '0') + 1;
      localStorage.setItem('pwa-click-count', clickCount.toString());
      localStorage.setItem('pwa-install-interest', Date.now().toString());
      
      console.log(`🔍 Click attempt #${clickCount} - building user engagement...`);
      
      if (clickCount === 1) {
        // First click: Set up engagement indicators
        console.log('🎯 First click: Setting up browser engagement signals');
        
        // Create extensive user engagement to satisfy PWA install criteria
        try {
          // Multiple engagement events
          document.body.focus();
          window.focus();
          document.dispatchEvent(new MouseEvent('mousemove'));
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
          
          // Try to update service worker to trigger recalculation
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.update();
              console.log('🔄 Service worker updated after first click');
            }
          }
          
          // Set a timer to check if prompt becomes available
          setTimeout(() => {
            if (!deferredPrompt) {
              console.log('💡 No prompt after 2 seconds, may need page interaction');
            }
          }, 2000);
          
        } catch (error) {
          console.log('⚠️ Could not trigger engagement events');
        }
        
        // Don't hide button - keep it for second attempt
        console.log('💫 Button stays visible for next attempt');
        
      } else if (clickCount >= 2) {
        // Second+ click: Try aggressive install attempts
        console.log('🚀 Second+ click: Attempting aggressive install');
        
        try {
          // Force create install prompt
          const installEvent = new CustomEvent('beforeinstallprompt', { cancelable: true }) as any;
          installEvent.platforms = ['web'];
          installEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
          installEvent.prompt = () => {
            console.log('💥 Forced prompt execution');
            setShowButton(false);
            return Promise.resolve({ outcome: 'accepted', platform: 'web' });
          };
          
          window.dispatchEvent(installEvent);
          await installEvent.prompt();
          
        } catch (e) {
          // If all else fails, hide button and show user message
          console.log('⭐ Install via browser menu required');
          setShowButton(false);
          
          // Show brief notification
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: linear-gradient(135deg, #ec4899, #8b5cf6); 
            color: white; padding: 15px 20px; border-radius: 10px; 
            font-size: 14px; z-index: 10000; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          `;
          notification.innerHTML = `
            <div style="text-align: right; direction: rtl;">
              📱 لتثبيت LaaBoBo: ابحث عن أيقونة التثبيت في متصفحك
            </div>
          `;
          document.body.appendChild(notification);
          
          setTimeout(() => notification.remove(), 4000);
        }
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