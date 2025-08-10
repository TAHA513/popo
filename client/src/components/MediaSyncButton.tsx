import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MediaSyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/sync-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "✅ تم التحديث بنجاح",
          description: `تم مزامنة ${result.syncedCount} من ${result.totalChecked} ملف`,
        });
        setLastSync(new Date().toLocaleTimeString('ar-SA'));
      } else {
        throw new Error(result.message || 'فشل التحديث');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "❌ خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الملفات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
      <Button 
        onClick={handleSync} 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            جاري التحديث...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث المنشورات
          </>
        )}
      </Button>
      
      {lastSync && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <CheckCircle className="w-3 h-3 text-green-500" />
          آخر تحديث: {lastSync}
        </div>
      )}
      
      <div className="text-xs text-center text-gray-600">
        <p>يحدث هذا الزر جميع المنشورات المفقودة</p>
        <p>ويجلبها من البيئات الأخرى تلقائياً</p>
      </div>
    </div>
  );
}