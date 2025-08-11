import { useState, useEffect } from 'react';
import { Download, Smartphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  platforms: string[];
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setUserAgent(navigator.userAgent);

    const checkInstallStatus = () => {
      // Check if app is already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isiOSStandalone = (window.navigator as any).standalone === true;
      const isWinStandalone = window.matchMedia('(display-mode: window-controls-overlay)').matches;
      const installed = isStandalone || isiOSStandalone || isWinStandalone;
      
      // Also check URL params for PWA detection
      const urlParams = new URLSearchParams(window.location.search);
      const isLaunchedFromPWA = urlParams.get('standalone') === 'true';
      
      const actuallyInstalled = installed || isLaunchedFromPWA;
      setIsInstalled(actuallyInstalled);
      
      if (actuallyInstalled) {
        console.log('[PWA] التطبيق مثبت مسبقاً');
        setIsInstallable(false);
        return;
      }

      // Check PWA requirements
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]');
      const isSecureContext = window.isSecureContext;
      
      console.log('[PWA] PWA Requirements Check:', {
        hasServiceWorker,
        hasManifest: !!hasManifest,
        isSecureContext,
        isStandalone,
        isiOSStandalone,
        isWinStandalone,
        isHTTPS: window.location.protocol === 'https:',
        currentURL: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      });

      // Always show install option if not installed
      if (!actuallyInstalled) {
        setIsInstallable(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt حدث تم إطلاقه');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      
      toast({
        title: "يمكن تثبيت التطبيق!",
        description: "يمكنك الآن إضافة LaaBoBo إلى شاشتك الرئيسية"
      });
    };

    const handleAppInstalled = () => {
      console.log('[PWA] تم تثبيت التطبيق بنجاح');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      
      toast({
        title: "تم التثبيت بنجاح! 🎉",
        description: "تم إضافة LaaBoBo إلى شاشتك الرئيسية"
      });
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check
    checkInstallStatus();

    // Force show install option after short delay if not installed
    const timeoutId = setTimeout(() => {
      if (!isInstalled) {
        console.log('[PWA] إجبار عرض خيار التثبيت');
        setIsInstallable(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeoutId);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    console.log('PWA: تم الضغط على زر التثبيت');
    
    if (deferredPrompt) {
      try {
        console.log('PWA: عرض نافذة التثبيت...');
        // عرض نافذة التثبيت
        await deferredPrompt.prompt();
        
        // انتظار اختيار المستخدم
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA: اختيار المستخدم:', outcome);
        
        if (outcome === 'accepted') {
          console.log('PWA: تم قبول التثبيت');
          alert('✅ تم تثبيت التطبيق بنجاح!');
        } else {
          console.log('PWA: تم رفض التثبيت');
        }
        
        // تنظيف
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('PWA: خطأ في تثبيت التطبيق:', error);
        showManualInstructions();
      }
    } else {
      // إذا لم يكن هناك prompt، حاول التثبيت اليدوي
      console.log('PWA: لا يوجد prompt متاح، عرض التعليمات اليدوية');
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    const isEdge = /Edg/i.test(navigator.userAgent);
    
    let instructions = 'طرق تثبيت التطبيق كـ PWA حقيقي:\n\n';
    
    if (isMobile) {
      if (isChrome) {
        instructions += '📱 Android Chrome:\n1. اضغط على القائمة (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
      } else if (isSafari) {
        instructions += '📱 iPhone Safari:\n1. اضغط على أيقونة المشاركة (⬆️)\n2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"\n3. اضغط "إضافة"';
      } else {
        instructions += '📱 على الهاتف:\nابحث عن خيار "إضافة إلى الشاشة الرئيسية" في قائمة المتصفح';
      }
    } else {
      if (isChrome) {
        instructions += '💻 Chrome على الكمبيوتر:\n1. ابحث عن أيقونة التثبيت (⬇️) في شريط العنوان\n2. أو اضغط Ctrl+Shift+I واختر "تثبيت التطبيق"';
      } else {
        instructions += '💻 على الكمبيوتر:\nاستخدم متصفح Chrome للحصول على أفضل تجربة تثبيت';
      }
    }
    
    alert(instructions);
  };

  // Don't show if already installed
  if (isInstalled) {
    console.log('[PWA] التطبيق مثبت، إخفاء البانر');
    return null;
  }

  // Show install banner if not installed (regardless of installable state)
  if (!isInstallable && !isInstalled) {
    return (
      <div className="fixed top-4 left-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-4 z-50 animate-slide-down">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">L</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg">
              📱 تثبيت تطبيق LaaBoBo
            </h3>
            <p className="text-sm text-white/90">
              احصل على تجربة أسرع وأفضل - مجاناً تماماً!
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="bg-white/20 backdrop-blur hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border-0 animate-bounce"
            >
              <Download size={16} />
              تثبيت
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-4 z-50 animate-slide-down">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xs">L</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg">
            📱 تثبيت تطبيق LaaBoBo
          </h3>
          <p className="text-sm text-white/90">
            احصل على تجربة أسرع وأفضل - مجاناً تماماً!
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="bg-white/20 backdrop-blur hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border-0 animate-bounce"
          >
            <Download size={16} />
            تثبيت
          </Button>
          <Button
            onClick={() => {
              // Hide the banner temporarily
              const banner = document.querySelector('.fixed.top-4') as HTMLElement;
              if (banner) {
                banner.style.transform = 'translateY(-100%)';
                banner.style.opacity = '0';
                setTimeout(() => {
                  banner.style.display = 'none';
                }, 300);
              }
            }}
            className="bg-white/10 hover:bg-white/20 text-white/80 px-3 py-2 rounded-lg text-sm border-0"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}