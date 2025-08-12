import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRetry(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setTimeout(() => setShowRetry(true), 3000); // Show retry after 3 seconds
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    // Force a network check by trying to fetch a small resource
    fetch('/manifest.json', { method: 'HEAD', cache: 'no-cache' })
      .then(() => {
        if (!navigator.onLine) {
          // Manually trigger online event if we can fetch but navigator says offline
          setIsOnline(true);
          setShowRetry(false);
        }
      })
      .catch(() => {
        console.log('Still offline');
      });
  };

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="flex items-center gap-3 p-4">
          <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              لا يوجد اتصال بالإنترنت
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {showRetry ? 'تحقق من اتصالك وحاول مرة أخرى' : 'التطبيق يعمل في وضع عدم الاتصال'}
            </p>
          </div>
          {showRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200 dark:border-orange-700 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              إعادة المحاولة
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Online status indicator for the navigation
export function OnlineStatusIndicator({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {isOnline ? (
        <Wifi className="h-3 w-3 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-orange-500" />
      )}
      <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
        {isOnline ? 'متصل' : 'غير متصل'}
      </span>
    </div>
  );
}