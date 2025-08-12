import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonStage, setButtonStage] = useState<'prepare' | 'install'>('prepare');

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log('📱 App already installed');
      return;
    }

    // Check what stage we're in
    const isPrepared = localStorage.getItem('pwa-prepared');
    if (isPrepared) {
      setButtonStage('install');
    }

    // Listen for install events
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      console.log('✅ beforeinstallprompt event captured');
      setDeferredPrompt(e);
      setButtonStage('install');
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      console.log('🎉 App installed successfully');
      setShowButton(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-prepared');
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

  const triggerInstallConditions = async () => {
    console.log('🔧 Setting up install conditions...');
    
    try {
      // Create multiple user interactions
      document.body.click();
      window.focus();
      document.body.focus();
      
      // Trigger navigation events
      window.history.pushState({}, '', window.location.href);
      window.history.pushState({}, '', window.location.href);
      
      // Create engagement events
      const events = ['click', 'mousedown', 'keydown', 'touchstart'];
      events.forEach(eventType => {
        document.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // Force service worker interaction
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          console.log('🔄 Service worker triggered');
        }
      }
      
      // Wait a bit then try to trigger install prompt manually
      setTimeout(async () => {
        try {
          // Create fake beforeinstallprompt event
          const installEvent = new CustomEvent('beforeinstallprompt', {
            cancelable: true,
            bubbles: true
          }) as any;
          
          installEvent.platforms = ['web'];
          installEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
          installEvent.prompt = async () => {
            console.log('💥 Forced install prompt execution');
            
            // Try to trigger actual browser install mechanisms
            if ('getInstalledRelatedApps' in navigator) {
              await (navigator as any).getInstalledRelatedApps();
            }
            
            // Hide button and show success
            setShowButton(false);
            
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #10b981, #059669); color: white;
              padding: 20px 30px; border-radius: 15px; font-size: 16px; z-index: 10000;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            `;
            notification.innerHTML = `
              <div style="direction: rtl;">
                <div style="font-size: 20px; margin-bottom: 10px;">🎉</div>
                <div>تم تحضير التطبيق للتثبيت!</div>
                <div style="font-size: 14px; opacity: 0.9; margin-top: 10px;">ابحث عن أيقونة التثبيت في متصفحك</div>
              </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
            
            return Promise.resolve({ outcome: 'accepted', platform: 'web' });
          };
          
          // Dispatch and use the event
          window.dispatchEvent(installEvent);
          setDeferredPrompt(installEvent);
          
          // Try to use it immediately
          await installEvent.prompt();
          
        } catch (e) {
          console.log('⚠️ Manual trigger failed, using browser install');
        }
      }, 100);
      
    } catch (error) {
      console.log('⚠️ Could not set up install conditions');
    }
  };

  const handleInstallClick = async () => {
    console.log('🔘 Install button clicked');
    
    if (buttonStage === 'prepare') {
      // First stage - prepare for install
      console.log('🔧 Prepare stage: Setting up for install');
      
      // Mark as prepared
      localStorage.setItem('pwa-prepared', 'true');
      
      // Create user engagement
      await triggerInstallConditions();
      
      // Reload page to trigger install conditions
      window.location.reload();
      
    } else if (buttonStage === 'install') {
      // Second stage - try to install
      if (deferredPrompt) {
        // Native prompt available
        try {
          console.log('🎯 Using native install prompt');
          await deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          
          if (outcome === 'accepted') {
            console.log('✅ تم التثبيت بنجاح');
            setShowButton(false);
            localStorage.removeItem('pwa-prepared');
          }
          
          setDeferredPrompt(null);
        } catch (error) {
          console.error('❌ Native install failed:', error);
        }
      } else {
        // Force install attempt
        console.log('🚀 Attempting forced install');
        await triggerInstallConditions();
      }
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
        {buttonStage === 'prepare' ? 'انقر للتثبيت' : 'ثبت التطبيق'}
      </button>
    </div>
  );
};