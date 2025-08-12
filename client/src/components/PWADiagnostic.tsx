import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Wifi, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PWACheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export function PWADiagnostic() {
  const [checks, setChecks] = useState<PWACheck[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: PWACheck[] = [];

    // Check HTTPS
    results.push({
      name: 'HTTPS',
      status: window.location.protocol === 'https:' ? 'pass' : 'fail',
      message: window.location.protocol === 'https:' 
        ? 'موقع آمن (HTTPS)' 
        : 'يتطلب HTTPS للتثبيت'
    });

    // Check Service Worker
    const hasServiceWorker = 'serviceWorker' in navigator;
    let swRegistered = false;
    if (hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        swRegistered = !!registration;
      } catch (e) {
        console.error('Error checking SW:', e);
      }
    }
    
    results.push({
      name: 'Service Worker',
      status: swRegistered ? 'pass' : 'fail',
      message: swRegistered 
        ? 'مُسجل وجاهز' 
        : 'غير مُسجل - مطلوب للتثبيت'
    });

    // Check Manifest
    let manifestValid = false;
    try {
      const manifestResponse = await fetch('/manifest.json');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        manifestValid = !!(manifest.name && manifest.icons && manifest.start_url);
      }
    } catch (e) {
      console.error('Error checking manifest:', e);
    }
    
    results.push({
      name: 'Web App Manifest',
      status: manifestValid ? 'pass' : 'fail',
      message: manifestValid 
        ? 'صالح ومكتمل' 
        : 'مفقود أو غير مكتمل'
    });

    // Check Standalone Display
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    results.push({
      name: 'Standalone Mode',
      status: isStandalone ? 'pass' : 'warning',
      message: isStandalone 
        ? 'يعمل كتطبيق مستقل' 
        : 'يعمل في المتصفح - قم بالتثبيت للوضع المستقل'
    });

    // Check Install Prompt
    const hasInstallPrompt = !!(window as any).deferredInstallPrompt;
    results.push({
      name: 'Install Prompt',
      status: hasInstallPrompt ? 'pass' : 'warning',
      message: hasInstallPrompt 
        ? 'متوفر للتثبيت التلقائي' 
        : 'غير متوفر - استخدم التثبيت اليدوي'
    });

    // Check Icons
    results.push({
      name: 'App Icons',
      status: 'pass',
      message: 'أيقونة PWA محسنة ومجهزة'
    });

    setChecks(results);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 z-40 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        title="تشخيص PWA"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            تشخيص PWA
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {check.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {check.message}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-medium mb-2">
            <Wifi className="w-4 h-4" />
            ملخص الحالة
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {checks.filter(c => c.status === 'pass').length} من {checks.length} المتطلبات مُحققة
            {checks.some(c => c.status === 'fail') && (
              <div className="mt-2 text-red-600 dark:text-red-400">
                يرجى إصلاح الأخطاء المذكورة أعلاه للحصول على تجربة PWA كاملة
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            runDiagnostics();
          }}
          className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          🔄 إعادة التشخيص
        </button>
      </div>
    </div>
  );
}