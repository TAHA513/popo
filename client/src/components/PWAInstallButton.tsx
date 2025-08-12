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

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    return 'Other';
  };

  const getInstallInstructions = (browser: string) => {
    const instructions: Record<string, string> = {
      Chrome: `
        1️⃣ ابحث عن أيقونة التثبيت 📥 في شريط العنوان<br/>
        2️⃣ أو: النقاط الثلاث (⋮) ← "تثبيت LaaBoBo"<br/>
        3️⃣ إذا لم تظهر: حدّث الصفحة بـ F5
      `,
      Edge: `
        1️⃣ ابحث عن أيقونة + في شريط العنوان<br/>
        2️⃣ أو: النقاط الثلاث (⋯) ← "التطبيقات" ← "تثبيت"<br/>
        3️⃣ أو: Settings ← Apps ← "Install LaaBoBo"
      `,
      Firefox: `
        1️⃣ ابحث عن أيقونة التثبيت في شريط العنوان<br/>
        2️⃣ أو: قائمة Firefox ← "Install this site as an app"<br/>
        3️⃣ أو: اضغط Alt ← Tools ← Install
      `,
      Safari: `
        📱 <strong>على الآيفون/آيباد:</strong><br/>
        1️⃣ اضغط زر المشاركة 📤 في الأسفل<br/>
        2️⃣ مرر لأسفل ← "إضافة إلى الشاشة الرئيسية"<br/><br/>
        
        💻 <strong>على Mac:</strong><br/>
        1️⃣ قائمة File ← "Add to Dock"
      `,
      Other: `
        1️⃣ ابحث عن "تثبيت" أو "Install" في قائمة المتصفح<br/>
        2️⃣ أو أيقونة + أو 📥 في شريط العنوان<br/>
        3️⃣ أو Settings ← Apps/Applications
      `
    };
    return instructions[browser];
  };

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
    
    // Show smart install modal with better instructions
    const browserName = getBrowserName();
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white;
          padding: 25px;
          border-radius: 15px;
          max-width: 85%;
          max-height: 80%;
          overflow-y: auto;
          text-align: center;
          direction: rtl;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          position: relative;
        ">
          <button onclick="this.closest('div').remove()" style="
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
          ">×</button>
          
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">
            📱 تثبيت LaaBoBo كتطبيق
          </div>
          
          <div style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; text-align: right;">
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong>لتثبيت LaaBoBo كتطبيق مستقل:</strong><br/>
              ${getInstallInstructions(browserName)}
            </div>
            
            <div style="font-size: 12px; opacity: 0.9; text-align: center;">
              بعد التثبيت ستحصل على تطبيق مستقل بدون شريط المتصفح وأداء أفضل ⚡
            </div>
          </div>
          
          <button onclick="this.closest('div').remove()" style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          ">
            حسناً
          </button>
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