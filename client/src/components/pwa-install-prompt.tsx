
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Plus } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

export default function PWAInstallPrompt() {
  const { canInstall, installApp, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // تحديد نوع الجهاز
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // التحقق من حالة الرفض السابق
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
    
    // إظهار المطالبة بعد 10 ثوان إذا كان التثبيت متاحاً
    if ((canInstall || iOS) && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed, isInstalled]);

  const handleInstall = async () => {
    if (isIOS) {
      // إرشادات iOS
      toast({
        title: "تثبيت التطبيق على iOS",
        description: "اضغط على أيقونة المشاركة ثم 'إضافة إلى الشاشة الرئيسية'",
        duration: 8000,
      });
      setShowPrompt(false);
      return;
    }
    
    try {
      await installApp();
      setShowPrompt(false);
      toast({
        title: "تم التثبيت بنجاح! 🎉",
        description: "يمكنك الآن الوصول للتطبيق من الشاشة الرئيسية",
        duration: 5000,
      });
    } catch (error) {
      console.error('خطأ في تثبيت التطبيق:', error);
      toast({
        title: "خطأ في التثبيت",
        description: "حدث خطأ أثناء تثبيت التطبيق. حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // لا تظهر المطالبة إذا كان التطبيق مثبت أو تم رفضه
  if (!showPrompt || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="bg-gradient-to-r from-pink-500 to-purple-600 border-white/20 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {isIOS ? <Plus className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">
                🐰 ثبت LaaBoBo Live
              </h3>
              <p className="text-white/90 text-xs mb-3">
                {isIOS 
                  ? "احصل على تجربة أفضل! أضف التطبيق للشاشة الرئيسية"
                  : "احصل على وصول سريع وتجربة أفضل"
                }
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-white text-pink-600 hover:bg-white/90 text-xs font-medium px-3 py-1 h-7"
                >
                  {isIOS ? "كيفية التثبيت" : "ثبت الآن"}
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 text-xs px-2 py-1 h-7"
                >
                  لاحقاً
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-1 h-6 w-6 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
