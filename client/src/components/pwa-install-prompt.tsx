
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function PWAInstallPrompt() {
  const { canInstall, installApp, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // إظهار المطالبة بعد 5 ثوان إذا كان التثبيت متاحاً
    if (canInstall && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed, isInstalled]);

  const handleInstall = async () => {
    try {
      await installApp();
      setShowPrompt(false);
    } catch (error) {
      console.error('خطأ في تثبيت التطبيق:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // تذكر أن المستخدم رفض التثبيت لهذه الجلسة
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // لا تظهر المطالبة إذا كان التطبيق مثبتاً أو غير متاح للتثبيت
  if (!canInstall || isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="bg-gradient-to-r from-pink-500 to-purple-600 border-0 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">
                ثبّت LaaBoBo Live
              </h3>
              <p className="text-white/90 text-xs mb-3">
                احصل على تجربة أفضل مع التطبيق المثبت على جهازك
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-xs h-8 px-3"
                >
                  <Download className="h-3 w-3 mr-1" />
                  تثبيت
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 text-xs h-8 px-3"
                >
                  لاحقاً
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
