import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export function PWADiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const runDiagnostics = async () => {
    const results: DiagnosticResult[] = [];

    // 1. Service Worker Test
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          results.push({
            name: 'Service Worker',
            status: 'success',
            message: `مثبت بنجاح (${registrations.length} registrations)`
          });
        } else {
          results.push({
            name: 'Service Worker',
            status: 'warning',
            message: 'مدعوم ولكن غير مثبت'
          });
        }
      } catch (error) {
        results.push({
          name: 'Service Worker',
          status: 'error',
          message: 'فشل في التحقق'
        });
      }
    } else {
      results.push({
        name: 'Service Worker',
        status: 'error',
        message: 'غير مدعوم في هذا المتصفح'
      });
    }

    // 2. Manifest Test
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) {
      try {
        const manifestUrl = (manifest as HTMLLinkElement).href;
        const response = await fetch(manifestUrl);
        if (response.ok) {
          const manifestData = await response.json();
          results.push({
            name: 'Web App Manifest',
            status: 'success',
            message: `متاح: ${manifestData.name || 'LaaBoBo'}`
          });
        } else {
          results.push({
            name: 'Web App Manifest',
            status: 'error',
            message: 'فشل في تحميل manifest'
          });
        }
      } catch (error) {
        results.push({
          name: 'Web App Manifest',
          status: 'error',
          message: 'خطأ في قراءة manifest'
        });
      }
    } else {
      results.push({
        name: 'Web App Manifest',
        status: 'error',
        message: 'غير موجود'
      });
    }

    // 3. HTTPS Test
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    results.push({
      name: 'HTTPS/Secure Context',
      status: isSecure ? 'success' : 'error',
      message: isSecure ? 'اتصال آمن' : 'يتطلب HTTPS للتثبيت'
    });

    // 4. Display Mode Test
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    results.push({
      name: 'تثبيت حالي',
      status: isStandalone ? 'success' : 'warning',
      message: isStandalone ? 'التطبيق مثبت كـ PWA' : 'غير مثبت كـ PWA'
    });

    // 5. Icons Test
    try {
      const icon192 = await fetch('/icon-192x192.png');
      const icon512 = await fetch('/icon-512x512.png');
      
      if (icon192.ok && icon512.ok) {
        results.push({
          name: 'App Icons',
          status: 'success',
          message: 'جميع الأيقونات متوفرة (192x192, 512x512)'
        });
      } else {
        results.push({
          name: 'App Icons',
          status: 'warning',
          message: 'بعض الأيقونات مفقودة'
        });
      }
    } catch (error) {
      results.push({
        name: 'App Icons',
        status: 'error',
        message: 'فشل في التحقق من الأيقونات'
      });
    }

    // 6. BeforeInstallPrompt Test
    const hasBeforeInstallPrompt = 'onbeforeinstallprompt' in window;
    results.push({
      name: 'Install Prompt Support',
      status: hasBeforeInstallPrompt ? 'success' : 'warning',
      message: hasBeforeInstallPrompt ? 'مدعوم' : 'غير مدعوم (iOS Safari)'
    });

    setDiagnostics(results);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Settings className="w-4 h-4" />
        تشخيص PWA
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              PWA تشخيص حالة
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {diagnostic.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {diagnostic.message}
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <strong>نصيحة:</strong> للحصول على أفضل تجربة PWA، تأكد من أن جميع العناصر تظهر باللون الأخضر. 
              إذا كانت هناك مشاكل، افتح Developer Tools (F12) ← Console لمزيد من التفاصيل.
            </div>
          </div>
          
          <button
            onClick={runDiagnostics}
            className="w-full mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            إعادة فحص
          </button>
        </div>
      </div>
    </div>
  );
}