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
      }
    } catch (error) {
      console.error('خطأ في تثبيت التطبيق:', error);
    } finally {
      setInstalling(false);
    }
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
        <CardContent className="flex items-center gap-2 pt-6">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-green-800 dark:text-green-200">
            تم تثبيت التطبيق بنجاح ✨
          </span>
        </CardContent>
      </Card>
    );
  }

  // Show install button if available
  if (canInstall) {
    return (
      <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-pink-600" />
            تثبيت تطبيق LaaBoBo
          </CardTitle>
          <CardDescription>
            قم بتثبيت التطبيق على هاتفك للحصول على تجربة أفضل وأسرع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleInstall} 
            disabled={installing}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            {installing ? 'جاري التثبيت...' : 'تثبيت التطبيق'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Debug info for development
  if (process.env.NODE_ENV === 'development') {
    return (
      <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-sm">PWA Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>Can Install: {canInstall ? '✅' : '❌'}</div>
          <div>Is Installed: {isInstalled ? '✅' : '❌'}</div>
          <div>Standalone: {debug.standalone ? '✅' : '❌'}</div>
          <div>Platform: {debug.platform}</div>
          <div>User Agent: {debug.userAgent}</div>
          <div>Deferred Prompt: {debug.deferredPrompt ? '✅' : '❌'}</div>
        </CardContent>
      </Card>
    );
  }

  return null;
}