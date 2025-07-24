import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CameraTestButton() {
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const testCameraAccess = async () => {
    setIsTestingCamera(true);
    
    try {
      console.log('🧪 اختبار الوصول للكاميرا...');
      
      // طلب الأذونات
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ نجح الوصول للكاميرا!');
      setHasPermission(true);
      
      // إيقاف البث فوراً
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "✅ نجح الاختبار",
        description: "الكاميرا والميكروفون يعملان بشكل طبيعي",
      });
      
    } catch (error: any) {
      console.error('❌ فشل اختبار الكاميرا:', error);
      setHasPermission(false);
      
      let errorMessage = "فشل في الوصول للكاميرا";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "تم رفض الأذونات - يرجى السماح بالوصول للكاميرا";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا";
      }
      
      toast({
        title: "❌ فشل الاختبار",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestingCamera(false);
    }
  };

  return (
    <Button
      onClick={testCameraAccess}
      disabled={isTestingCamera}
      className={`
        w-full mb-4 
        ${hasPermission === true ? 'bg-green-600 hover:bg-green-700' : ''}
        ${hasPermission === false ? 'bg-red-600 hover:bg-red-700' : ''}
        ${hasPermission === null ? 'bg-blue-600 hover:bg-blue-700' : ''}
      `}
    >
      {isTestingCamera ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          جاري الاختبار...
        </div>
      ) : hasPermission === true ? (
        <div className="flex items-center">
          <Video className="w-4 h-4 mr-2" />
          الكاميرا جاهزة ✅
        </div>
      ) : hasPermission === false ? (
        <div className="flex items-center">
          <VideoOff className="w-4 h-4 mr-2" />
          أعد اختبار الكاميرا ❌
        </div>
      ) : (
        <div className="flex items-center">
          <Video className="w-4 h-4 mr-2" />
          اختبر الكاميرا أولاً 🧪
        </div>
      )}
    </Button>
  );
}