import React, { useState } from 'react';
import { useStreamContext } from '@/contexts/StreamContext';
import { Video, X, Eye, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function LiveStreamIndicator() {
  const { isStreaming, streamId, streamTitle, setStreamInactive } = useStreamContext();
  const [, setLocation] = useLocation();
  const [showStopDialog, setShowStopDialog] = useState(false);

  if (!isStreaming) {
    return null;
  }

  const handleViewStream = () => {
    if (streamId) {
      setLocation(`/stream/${streamId}`);
    }
  };

  const handleStopStream = () => {
    setStreamInactive();
    setShowStopDialog(false);
    // إيقاف الكاميرا والمايكروفون
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(() => {
        // تجاهل الأخطاء
      });
  };

  return (
    <>
      {/* المؤشر العائم */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-red-400 animate-pulse">
        <div className="flex items-center gap-3">
          {/* نقطة البث المباشر */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <Video className="w-4 h-4" />
            <span className="text-sm font-semibold">بث مباشر</span>
          </div>

          {/* عنوان البث */}
          <div className="text-xs opacity-90 max-w-32 truncate">
            {streamTitle || 'بث مباشر'}
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-1">
            <Button
              onClick={handleViewStream}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-600 text-white"
              title="عرض البث"
            >
              <Eye className="w-3 h-3" />
            </Button>
            
            <Button
              onClick={() => setShowStopDialog(true)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-600 text-white"
              title="إيقاف البث"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* نافذة تأكيد إيقاف البث */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إيقاف البث المباشر</DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من أنك تريد إيقاف البث المباشر؟ سيتم قطع جميع المشاهدين.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-red-900">
                {streamTitle || 'بث مباشر'}
              </p>
              <p className="text-sm text-red-700">
                البث نشط حالياً
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStopDialog(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleStopStream}
            >
              إيقاف البث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}