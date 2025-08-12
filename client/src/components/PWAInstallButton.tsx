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

    // Always show button for PWA installation
    setShowButton(true);
    
    // Check if install prompt is available after delay
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('⚠️ No install prompt detected, using manual installation guide');
      }
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

    // No native prompt available, show manual instructions
    console.log('📋 Showing manual install instructions');
    
    const isChrome = /Chrome|Chromium|Edge/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    let message = '📱 لتثبيت تطبيق LaaBoBo:\n\n';
    
    if (isChrome) {
      message += '🔍 **Chrome/Edge - طريقة سهلة:**\n';
      message += '1️⃣ ابحث عن أيقونة التثبيت 📥 في شريط العنوان\n';
      message += '   (عادة بجانب النجمة ⭐ والإعدادات)\n\n';
      message += '2️⃣ أو من القائمة:\n';
      message += '   • النقاط الثلاث (⋮) في الزاوية ←\n';
      message += '   • "تثبيت LaaBoBo..." أو "Install LaaBoBo"\n';
      message += '   • أو "More tools" ← "Create shortcut"\n\n';
      message += '💡 **إذا لم تظهر أيقونة التثبيت:**\n';
      message += '   • حدث الصفحة (F5 أو Ctrl+R)\n';
      message += '   • تأكد من HTTPS (🔒 في شريط العنوان)\n';
      message += '   • استخدم التصفح العادي (ليس الخاص/المخفي)';
    } else if (isSafari) {
      message += '🔍 **Safari - iOS/Mac:**\n';
      message += '1️⃣ **على الآيفون/آيباد:**\n';
      message += '   • اضغط زر المشاركة 📤 (في الأسفل)\n';
      message += '   • مرر لأسفل ← "إضافة إلى الشاشة الرئيسية"\n';
      message += '   • اكتب "LaaBoBo" واضغط "إضافة"\n\n';
      message += '2️⃣ **على Mac:**\n';
      message += '   • قائمة File ← "Add to Dock"\n';
      message += '   • أو Dock ← النقر بالزر الأيمن ← "Options"';
    } else if (isFirefox) {
      message += '🔍 **Firefox:**\n';
      message += '   • ابحث عن أيقونة التثبيت في شريط العنوان\n';
      message += '   • أو: قائمة Firefox ← "Install this site as an app"\n';
      message += '   • أو: Three lines (☰) ← "Install"\n';
    } else {
      message += '🔍 **تعليمات عامة:**\n';
      message += '   • ابحث عن "تثبيت" أو "Install" في قائمة المتصفح\n';
      message += '   • أو أيقونة + أو 📥 في شريط العنوان\n';
      message += '   • أو Settings ← "Apps" ← "Install"';
    }
    
    message += '\n\n✅ **مميزات بعد التثبيت:**\n';
    message += '   • تطبيق مستقل بدون شريط المتصفح 🚀\n';
    message += '   • فتح سريع من قائمة التطبيقات 📱\n';
    message += '   • أداء أفضل وتجربة أكثر سلاسة ⚡\n';
    message += '   • إشعارات مخصصة للتطبيق 🔔';
    
    // Create enhanced modal
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        backdrop-filter: blur(5px);
      ">
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 20px;
          max-width: 95%;
          max-height: 90%;
          overflow-y: auto;
          text-align: right;
          direction: rtl;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          position: relative;
        ">
          <button onclick="this.closest('div').remove()" style="
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
          ">×</button>
          
          <h2 style="
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-top: 0;
            font-size: 24px;
            text-align: center;
          ">📱 تثبيت تطبيق LaaBoBo</h2>
          
          <div style="
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.2);
          ">
            <pre style="
              white-space: pre-wrap;
              font-family: inherit;
              line-height: 1.8;
              margin: 0;
              color: #f8f8f8;
            ">${message}</pre>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <button onclick="this.closest('div').remove()" style="
              background: linear-gradient(45deg, #ff6b6b, #ffd93d);
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 25px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              فهمت، شكراً! ✨
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
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
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white px-6 py-4 rounded-2xl text-sm font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 hover:scale-105 animate-pulse hover:animate-none group"
        title="تثبيت تطبيق LaaBoBo كتطبيق مستقل"
      >
        <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
          <img 
            src="/laababo-icon.png" 
            alt="LaaBoBo" 
            className="w-6 h-6 rounded-full"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-base font-extrabold">تثبيت LaaBoBo</span>
          <span className="text-xs opacity-90">للحصول على تجربة أفضل</span>
        </div>
        <Download className="h-5 w-5 group-hover:animate-bounce" />
      </button>
    </div>
  );
}