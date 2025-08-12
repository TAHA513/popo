import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  onClose?: () => void;
  className?: string;
}

export function PWAInstallPrompt({ onClose, className }: PWAInstallPromptProps) {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show after 10 seconds if user can install and hasn't dismissed
    const timer = setTimeout(() => {
      if (canInstall && !isDismissed) {
        setIsVisible(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [canInstall, isDismissed]);

  useEffect(() => {
    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    await installApp();
    setIsVisible(false);
    onClose?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onClose?.();
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Set a timer to remind after 24 hours
    localStorage.setItem('pwa-install-remind-later', Date.now().toString());
    onClose?.();
  };

  // Don't show if not installable, already installed, or dismissed
  if (!canInstall || isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4 md:items-center">
      <Card className={`w-full max-w-md transform transition-all duration-300 ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900">
            <Smartphone className="h-8 w-8 text-pink-600 dark:text-pink-400" />
          </div>
          <CardTitle className="text-xl font-bold">
            تثبيت LaaBoBo على جهازك
          </CardTitle>
          <CardDescription className="text-center">
            احصل على تجربة أفضل مع التطبيق المثبت على جهازك
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>وصول سريع من الشاشة الرئيسية</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>عمل بدون إنترنت للميزات الأساسية</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>إشعارات فورية للرسائل الجديدة</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>تجربة سلسة بملء الشاشة</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleInstall}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Download className="ml-2 h-4 w-4" />
              تثبيت الآن
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRemindLater}
              className="flex-1"
            >
              لاحقاً
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full text-xs text-muted-foreground"
          >
            لا تظهر مرة أخرى
          </Button>
        </CardContent>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}

// Mini install button for header
export function PWAInstallButton({ className }: { className?: string }) {
  const { canInstall, installApp } = usePWA();

  if (!canInstall) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={installApp}
      className={`gap-2 ${className}`}
    >
      <Download className="h-4 w-4" />
      تثبيت
    </Button>
  );
}