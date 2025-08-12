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

  const showSuccessMessage = () => {
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
  };

  const showForcedInstallModal = () => {
    const browserName = getBrowserName();
    const installUrl = window.location.href;
    
    // Create a more aggressive install prompt
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white;
          padding: 30px;
          border-radius: 20px;
          max-width: 90%;
          text-align: center;
          direction: rtl;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          position: relative;
          animation: slideIn 0.3s ease-out;
        ">
          <style>
            @keyframes slideIn {
              from { transform: scale(0.8); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          </style>
          
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
          ">×</button>
          
          <div style="font-size: 22px; font-weight: bold; margin-bottom: 20px;">
            🚀 تثبيت LaaBoBo الآن
          </div>
          
          <div style="font-size: 16px; margin-bottom: 25px; line-height: 1.5;">
            <strong>طرق التثبيت حسب متصفحك:</strong>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: right;">
            ${getDetailedInstallInstructions(browserName)}
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.open('${installUrl}', '_blank'); this.closest('div').remove();" style="
              background: rgba(255,255,255,0.2);
              color: white;
              border: 1px solid rgba(255,255,255,0.3);
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
            ">
              فتح في نافذة جديدة
            </button>
            <button onclick="this.closest('div').remove()" style="
              background: rgba(255,255,255,0.2);
              color: white;
              border: 1px solid rgba(255,255,255,0.3);
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
            ">
              حسناً
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  };

  const getDetailedInstallInstructions = (browser: string) => {
    const instructions: Record<string, string> = {
      Chrome: `
        <strong>Chrome:</strong><br/>
        1️⃣ ابحث عن أيقونة 📥 أو ➕ في شريط العنوان<br/>
        2️⃣ اضغط النقاط الثلاث ⋮ ← "تثبيت LaaBoBo"<br/>
        3️⃣ أو: المزيد من الأدوات ← "إنشاء اختصار"<br/>
        4️⃣ إذا لم تجدها: حدث الصفحة بـ F5 أو Ctrl+R
      `,
      Edge: `
        <strong>Edge:</strong><br/>
        1️⃣ ابحث عن أيقونة ➕ في شريط العنوان<br/>
        2️⃣ أو: النقاط الثلاث ⋯ ← "التطبيقات" ← "تثبيت"<br/>
        3️⃣ أو: Settings ← Apps ← "Install LaaBoBo as an app"<br/>
        4️⃣ أو: إعدادات ← التطبيقات ← تثبيت الموقع
      `,
      Firefox: `
        <strong>Firefox:</strong><br/>
        1️⃣ ابحث عن أيقونة التثبيت في شريط العنوان<br/>
        2️⃣ قائمة Firefox ← "Install this site as an app"<br/>
        3️⃣ اضغط Alt ← Tools ← Install<br/>
        4️⃣ أو: ⋮ ← "Install as app"
      `,
      Safari: `
        <strong>Safari:</strong><br/>
        📱 <strong>على الآيفون/آيباد:</strong><br/>
        1️⃣ اضغط زر المشاركة 📤 (في الأسفل)<br/>
        2️⃣ مرر للأسفل ← "إضافة إلى الشاشة الرئيسية"<br/>
        3️⃣ اكتب "LaaBoBo" كاسم واضغط "إضافة"<br/><br/>
        
        💻 <strong>على Mac:</strong><br/>
        1️⃣ قائمة File ← "Add to Dock"<br/>
        2️⃣ أو Dock ← Right click ← "Keep in Dock"
      `,
      Other: `
        <strong>تعليمات عامة:</strong><br/>
        1️⃣ ابحث عن "تثبيت" أو "Install" في قائمة المتصفح<br/>
        2️⃣ أو أيقونة ➕ أو 📥 في شريط العنوان<br/>
        3️⃣ أو Settings ← Apps ← Install<br/>
        4️⃣ أو إعدادات ← التطبيقات ← تثبيت
      `
    };
    return instructions[browser] || instructions.Other;
  };

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
    
    // Try multiple installation methods
    if (deferredPrompt) {
      // Method 1: Native install prompt
      try {
        console.log('🎯 Triggering native install prompt...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ تم تثبيت التطبيق بنجاح!');
          setShowButton(false);
          showSuccessMessage();
        }
        
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error('❌ Native install failed:', error);
      }
    }
    
    // Method 2: Force trigger beforeinstallprompt
    try {
      const event = new Event('beforeinstallprompt') as any;
      event.platforms = ['web'];
      event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      event.prompt = async () => {
        console.log('🚀 Forcing install...');
        // Try to trigger browser install
        if ('getInstalledRelatedApps' in navigator) {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps.length === 0) {
            showForcedInstallModal();
          }
        } else {
          showForcedInstallModal();
        }
      };
      
      window.dispatchEvent(event);
      await event.prompt();
      return;
    } catch (error) {
      console.error('❌ Force install failed:', error);
    }

    // Method 3: Show enhanced install modal
    console.log('💡 No native install available, showing enhanced install modal');
    showForcedInstallModal();
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