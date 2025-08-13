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

  // Simple function to show install success message
  const showInstallSuccess = () => {
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
        <div>تم تثبيت التطبيق بنجاح!</div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Install button clicked');
    
    if (deferredPrompt) {
      // Native prompt available - use it immediately
      try {
        console.log('🎯 Using native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ تم التثبيت بنجاح');
          setShowButton(false);
        }
        
        setDeferredPrompt(null);
        return; // Exit here, don't continue
      } catch (error) {
        console.error('❌ Native install failed:', error);
      }
    }
    
    // Fallback: Show browser-specific instructions immediately
    console.log('📱 Showing install instructions');
    setShowButton(false);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white;
      padding: 25px 35px; border-radius: 20px; font-size: 16px; z-index: 10000;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4); text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 90%;
    `;
    
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      instructions = `
        <div style="direction: rtl;">
          <div style="font-size: 24px; margin-bottom: 15px;">📱</div>
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">تثبيت التطبيق</div>
          <div style="line-height: 1.6;">
            في Chrome:<br>
            ابحث عن أيقونة التحميل ⬇️ في شريط العناوين<br>
            أو اضغط القائمة ← "تثبيت التطبيق"
          </div>
        </div>
      `;
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      instructions = `
        <div style="direction: rtl;">
          <div style="font-size: 24px; margin-bottom: 15px;">📱</div>
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">تثبيت التطبيق</div>
          <div style="line-height: 1.6;">
            في Safari:<br>
            اضغط أيقونة المشاركة 📤<br>
            ← "إضافة إلى الشاشة الرئيسية"
          </div>
        </div>
      `;
    } else {
      instructions = `
        <div style="direction: rtl;">
          <div style="font-size: 24px; margin-bottom: 15px;">📱</div>
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">تثبيت التطبيق</div>
          <div style="line-height: 1.6;">
            ابحث عن خيار "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"<br>
            في قائمة المتصفح
          </div>
        </div>
      `;
    }
    
    notification.innerHTML = instructions;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    // Allow clicking to close
    notification.addEventListener('click', () => {
      notification.remove();
    });
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
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 pl-[3px] pr-[3px] text-[12px]"
        title="تثبيت تطبيق LaaBoBo كتطبيق مستقل"
      >
        <Download className="h-4 w-4" />
        تثبيت التطبيق
      </button>
    </div>
  );
};