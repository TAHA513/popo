import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Smartphone, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { PWACacheManager, getPWACapabilities } from '@/lib/pwa-utils';

export function PWAStatus() {
  const { canInstall, isInstalled, installApp } = usePWA();
  const { pendingSync, isOnline, hasPendingItems } = useBackgroundSync();
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<any>(null);

  useEffect(() => {
    // Load PWA capabilities and cache stats
    const loadStats = async () => {
      const caps = getPWACapabilities();
      setCapabilities(caps);
      
      const stats = await PWACacheManager.getCacheStats();
      setCacheStats(stats);
    };
    
    loadStats();
  }, []);

  if (!capabilities) return null;

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            حالة تطبيق الويب التقدمي (PWA)
          </CardTitle>
          <CardDescription>
            معلومات التثبيت والإمكانيات المتاحة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <span>حالة التثبيت:</span>
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  مثبت
                </Badge>
              ) : canInstall ? (
                <>
                  <Badge variant="secondary">غير مثبت</Badge>
                  <Button size="sm" onClick={installApp}>
                    <Download className="h-4 w-4 ml-1" />
                    تثبيت
                  </Button>
                </>
              ) : (
                <Badge variant="outline">غير متاح للتثبيت</Badge>
              )}
            </div>
          </div>

          {/* Network Status */}
          <div className="flex items-center justify-between">
            <span>حالة الشبكة:</span>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Wifi className="h-3 w-3 ml-1" />
                  متصل
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 ml-1" />
                  غير متصل
                </Badge>
              )}
            </div>
          </div>

          {/* Background Sync */}
          <div className="flex items-center justify-between">
            <span>العناصر المعلقة للمزامنة:</span>
            <Badge variant={hasPendingItems ? "secondary" : "outline"}>
              {pendingSync.length} عنصر
            </Badge>
          </div>

          {/* Cache Info */}
          {cacheStats && (
            <div className="flex items-center justify-between">
              <span>حجم التخزين المؤقت:</span>
              <Badge variant="outline">
                {formatSize(cacheStats.cacheSize)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الإمكانيات المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Service Worker:</span>
              <Badge variant={capabilities.serviceWorker ? "default" : "destructive"}>
                {capabilities.serviceWorker ? 'مدعوم' : 'غير مدعوم'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>الإشعارات:</span>
              <Badge variant={capabilities.pushNotifications ? "default" : "destructive"}>
                {capabilities.pushNotifications ? 'مدعوم' : 'غير مدعوم'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>المزامنة الخلفية:</span>
              <Badge variant={capabilities.backgroundSync ? "default" : "destructive"}>
                {capabilities.backgroundSync ? 'مدعوم' : 'غير مدعوم'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>التخزين المؤقت:</span>
              <Badge variant={capabilities.caching ? "default" : "destructive"}>
                {capabilities.caching ? 'مدعوم' : 'غير مدعوم'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>العمل بلا إنترنت:</span>
              <Badge variant={capabilities.offlineCapable ? "default" : "destructive"}>
                {capabilities.offlineCapable ? 'مدعوم' : 'غير مدعوم'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>قابل للتثبيت:</span>
              <Badge variant={capabilities.installable ? "default" : "destructive"}>
                {capabilities.installable ? 'نعم' : 'لا'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Sync Items Details */}
      {hasPendingItems && (
        <Card>
          <CardHeader>
            <CardTitle>العناصر المعلقة للمزامنة</CardTitle>
            <CardDescription>
              ستتم مزامنة هذه العناصر عند الاتصال بالإنترنت
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingSync.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                  <span>{item.type}</span>
                  <Badge variant="outline" className="text-xs">
                    محاولة {item.retries + 1}
                  </Badge>
                </div>
              ))}
              {pendingSync.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  و {pendingSync.length - 5} عنصر إضافي...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}