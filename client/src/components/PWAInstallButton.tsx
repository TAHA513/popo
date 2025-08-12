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

    // Show button only if not installed and potentially installable
    if (isStandalone) {
      console.log('📱 App is already installed');
      setShowButton(false);
    } else {
      console.log('📱 App not installed, showing install button');
      setShowButton(true);
    }
    
    // Force browser to recognize PWA after delay
    setTimeout(() => {
      if (!deferredPrompt && !isStandalone) {
        console.log('🔄 Attempting to trigger install prompt conditions...');
        // Try to trigger the browser to show install prompt
        window.dispatchEvent(new Event('load'));
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
    
    if (deferredPrompt) {
      // We have the native install prompt - use it directly
      try {
        console.log('🎯 Triggering native install prompt...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('📊 User choice:', outcome);
        
        if (outcome === 'accepted') {
          console.log('✅ تم تثبيت التطبيق بنجاح!');
          setShowButton(false);
          
          // Show success message
          const successDiv = document.createElement('div');
          successDiv.innerHTML = `
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 20px;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
              z-index: 10000;
              font-family: Arial, sans-serif;
              text-align: right;
              direction: rtl;
            ">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="/laababo-icon.png" style="width: 32px; height: 32px; border-radius: 50%;" />
                <div>
                  <div style="font-size: 16px; font-weight: bold;">✅ تم التثبيت بنجاح!</div>
                  <div style="font-size: 14px; opacity: 0.9;">يمكنك الآن فتح LaaBoBo من قائمة التطبيقات</div>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(successDiv);
          
          setTimeout(() => {
            successDiv.remove();
          }, 4000);
          
        } else {
          console.log('❌ User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Install prompt failed:', error);
      }
      return;
    }

    // No native prompt available - show simple message to install from browser
    console.log('💡 No install prompt, showing browser install message');
    
    // Simple alert telling user to install from browser
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: right;
        direction: rtl;
        max-width: 300px;
      ">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">
          🔍 للتثبيت من المتصفح:
        </div>
        <div style="font-size: 12px; line-height: 1.4;">
          Chrome: النقاط الثلاث ← "تثبيت"<br/>
          Edge: أيقونة + في شريط العنوان<br/>
          Firefox: أيقونة التثبيت بجانب العنوان
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.remove();
    }, 4000);
  };

  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;

  // Show smart install button only when app is not installed
  if (isStandalone) {
    console.log('📱 App already installed, hiding button');
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
        تثبيت
      </button>
    </div>
  );
}