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

    // Force show button after delay for manual installation
    setTimeout(() => {
      console.log('⚠️ No install prompt detected, showing manual install button');
      setShowButton(true);
    }, 2000);

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
      // Check if we can detect Chrome-based browsers more accurately
      const isChrome = /Chrome|Chromium|Edge/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      
      let message = '📱 لتثبيت تطبيق LaaBoBo:\n\n';
      
      if (isChrome) {
        message += '🔍 **في Chrome/Edge:**\n';
        message += '• ابحث عن أيقونة التثبيت 📥 في شريط العنوان (بجانب ⭐)\n';
        message += '• أو: النقاط الثلاث (⋮) ← "تثبيت LaaBoBo"\n';
        message += '• أو: الإعدادات ← "تثبيت هذا الموقع كتطبيق"\n\n';
        message += '💡 **إذا لم تظهر أيقونة التثبيت:**\n';
        message += '• قم بتحديث الصفحة (F5)\n';
        message += '• تأكد من أن الموقع آمن (HTTPS)\n';
        message += '• جرب في وضع التصفح العادي (ليس الخاص)';
      } else if (isSafari) {
        message += '🔍 **في Safari:**\n';
        message += '• اضغط على زر المشاركة 📤 (في الشريط السفلي)\n';
        message += '• مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية" 📱\n';
        message += '• اكتب اسم التطبيق واضغط "إضافة"\n';
        message += '• سيظهر التطبيق على شاشتك الرئيسية كتطبيق مستقل';
      } else if (isFirefox) {
        message += '🔍 **في Firefox:**\n';
        message += '• ابحث عن أيقونة التثبيت في شريط العنوان\n';
        message += '• أو: قائمة Firefox ← "تثبيت"\n';
        message += '• أو: أدوات ← "تثبيت هذا الموقع كتطبيق"';
      } else {
        message += '🔍 **تعليمات عامة:**\n';
        message += '• ابحث عن أيقونة التثبيت في شريط العنوان\n';
        message += '• أو: قائمة المتصفح ← "تثبيت التطبيق"\n';
        message += '• أو: إعدادات المتصفح ← "تطبيقات الويب"';
      }
      
      message += '\n\n✅ **بعد التثبيت:**\n';
      message += '• ستحصل على تطبيق مستقل بدون شريط المتصفح\n';
      message += '• يمكنك فتحه من قائمة التطبيقات\n';
      message += '• سيعمل بسرعة أكبر مع تجربة أفضل';
      
      // Create a custom modal instead of alert for better UX
      const modalDiv = document.createElement('div');
      modalDiv.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: Arial, sans-serif;
        ">
          <div style="
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            text-align: right;
            direction: rtl;
          ">
            <h3 style="color: #8b5cf6; margin-top: 0;">📱 تثبيت تطبيق LaaBoBo</h3>
            <pre style="
              white-space: pre-wrap;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 15px 0;
            ">${message}</pre>
            <button onclick="this.closest('div').remove()" style="
              background: #8b5cf6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 10px;
            ">حسناً</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv);
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
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 animate-bounce"
        title="تثبيت تطبيق LaaBoBo كتطبيق مستقل"
      >
        <Download className="h-4 w-4" />
        تثبيت التطبيق
      </button>
      <div className="text-xs text-center mt-1 text-gray-600">
        للحصول على تجربة أفضل
      </div>
    </div>
  );
}