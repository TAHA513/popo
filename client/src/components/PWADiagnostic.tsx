import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';

interface PWAStatus {
  serviceWorkerRegistered: boolean;
  manifestLoaded: boolean;
  httpsEnabled: boolean;
  installPromptAvailable: boolean;
  isStandalone: boolean;
  manifestValid: boolean;
  iconsAvailable: boolean;
}

export function PWADiagnostic() {
  const [status, setStatus] = useState<PWAStatus>({
    serviceWorkerRegistered: false,
    manifestLoaded: false,
    httpsEnabled: false,
    installPromptAvailable: false,
    isStandalone: false,
    manifestValid: false,
    iconsAvailable: false
  });
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    checkPWAStatus();
  }, []);

  const checkPWAStatus = async () => {
    const newStatus: PWAStatus = {
      serviceWorkerRegistered: false,
      manifestLoaded: false,
      httpsEnabled: window.location.protocol === 'https:',
      installPromptAvailable: !!(window as any).deferredPrompt,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true,
      manifestValid: false,
      iconsAvailable: false
    };

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        newStatus.serviceWorkerRegistered = !!registration;
      } catch (error) {
        console.error('Service Worker check failed:', error);
      }
    }

    // Check Manifest
    try {
      const response = await fetch('/manifest.json');
      if (response.ok) {
        newStatus.manifestLoaded = true;
        const manifest = await response.json();
        newStatus.manifestValid = !!(manifest.name && manifest.start_url && manifest.display && manifest.icons?.length);
      }
    } catch (error) {
      console.error('Manifest check failed:', error);
    }

    // Check Icons
    try {
      const iconResponse = await fetch('/icon-192x192.png');
      newStatus.iconsAvailable = iconResponse.ok;
    } catch (error) {
      console.error('Icon check failed:', error);
    }

    setStatus(newStatus);
  };

  const StatusIcon = ({ condition }: { condition: boolean }) => {
    return condition ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getOverallStatus = () => {
    const requiredChecks = [
      status.serviceWorkerRegistered,
      status.manifestLoaded,
      status.httpsEnabled,
      status.manifestValid,
      status.iconsAvailable
    ];
    
    const passedChecks = requiredChecks.filter(Boolean).length;
    return passedChecks === requiredChecks.length;
  };

  if (!showDiagnostic) {
    return (
      <Button
        onClick={() => setShowDiagnostic(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-20 right-4 z-50 bg-white/90 backdrop-blur-sm"
      >
        <Settings className="h-4 w-4 mr-2" />
        تشخيص PWA
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">تشخيص PWA</h3>
          <Button
            onClick={() => setShowDiagnostic(false)}
            variant="ghost"
            size="sm"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">اتصال آمن (HTTPS)</span>
            <StatusIcon condition={status.httpsEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Service Worker مُسجل</span>
            <StatusIcon condition={status.serviceWorkerRegistered} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Manifest محمّل</span>
            <StatusIcon condition={status.manifestLoaded} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Manifest صالح</span>
            <StatusIcon condition={status.manifestValid} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">الأيقونات متوفرة</span>
            <StatusIcon condition={status.iconsAvailable} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">مُثبت بالفعل</span>
            <StatusIcon condition={status.isStandalone} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">قابل للتثبيت</span>
            <StatusIcon condition={status.installPromptAvailable} />
          </div>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          {getOverallStatus() ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">PWA جاهز للتثبيت!</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">PWA غير مكتمل الإعداد</span>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>• تأكد من فتح الموقع بـ HTTPS</p>
          <p>• انتظر ثوانٍ قليلة بعد تحميل الصفحة</p>
          <p>• ابحث عن خيار "تثبيت التطبيق" في متصفحك</p>
        </div>

        <Button
          onClick={checkPWAStatus}
          className="w-full mt-4"
          size="sm"
        >
          إعادة الفحص
        </Button>
      </div>
    </div>
  );
}