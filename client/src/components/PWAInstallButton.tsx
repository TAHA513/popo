import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PWAInstallButton() {
  const { canInstall, isInstalled, installApp, debug } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await installApp();
      if (!success) {
        console.warn('تثبيت التطبيق لم ينجح');
        // Show manual install instruction
        alert('افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"');
      }
    } catch (error) {
      console.error('خطأ في تثبيت التطبيق:', error);
      alert('اضغط على قائمة المتصفح واختر "تثبيت التطبيق"');
    } finally {
      setInstalling(false);
    }
  };

  const handleManualInstall = () => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        alert('في Safari: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"');
      } else {
        alert('في Chrome: اضغط على القائمة (⋮) ثم "إضافة إلى الشاشة الرئيسية"');
      }
    } else {
      alert('اضغط على أيقونة التثبيت في شريط العنوان أو قائمة المتصفح');
    }
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
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

  // Show manual install for all devices when PWA install not available
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return (
    <div className="flex justify-center">
      <button
        onClick={handleManualInstall}
        className="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm cursor-pointer transition-colors"
        title={isMobile ? "اضغط للحصول على تعليمات التثبيت" : "اضغط للحصول على تعليمات التثبيت"}
      >
        <Smartphone className="w-4 h-4" />
        تثبيت
      </button>
    </div>
  );
}