import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PWAInstallButton() {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await installApp();
      if (!success) {
        console.warn('تثبيت التطبيق لم ينجح');
      }
    } catch (error) {
      console.error('خطأ في تثبيت التطبيق:', error);
    } finally {
      setInstalling(false);
    }
  };

  // Show success icon if already installed
  if (isInstalled) {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          <Check className="w-4 h-4" />
          مثبت
        </div>
      </div>
    );
  }

  // Show install button if PWA can be installed
  if (canInstall) {
    return (
      <div className="flex justify-center">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium disabled:opacity-50"
          title="تثبيت التطبيق"
        >
          <Download className="w-4 h-4" />
          {installing ? 'جاري التثبيت...' : 'تثبيت التطبيق'}
        </button>
      </div>
    );
  }

  // For mobile devices, show simple install hint
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
          title="اضغط على قائمة المتصفح واختر 'إضافة للشاشة الرئيسية'">
          <Smartphone className="w-4 h-4" />
          تثبيت
        </div>
      </div>
    );
  }

  // For desktop, don't show anything
  return null;
}