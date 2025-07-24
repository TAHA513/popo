import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestCamera() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>('');

  const testCamera = async () => {
    try {
      console.log('🔍 Testing camera access...');
      setError('');
      
      // Simple camera test
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsActive(true);
        
        toast({
          title: "نجح الاختبار!",
          description: "الكاميرا تعمل بشكل ممتاز",
        });
      }
    } catch (err: any) {
      console.error('❌ Camera test failed:', err);
      setError(`خطأ: ${err.name} - ${err.message}`);
      
      toast({
        title: "فشل الاختبار",
        description: `خطأ في الكاميرا: ${err.name}`,
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            اختبار الكاميرا
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <video
            ref={videoRef}
            className="w-full h-64 bg-black rounded-lg object-cover"
            muted
            playsInline
            autoPlay
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={testCamera}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={isActive}
            >
              <Video className="w-4 h-4 mr-2" />
              اختبار الكاميرا
            </Button>
            <Button
              onClick={stopCamera}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!isActive}
            >
              <VideoOff className="w-4 h-4 mr-2" />
              إيقاف
            </Button>
          </div>
          
          <div className="text-white text-sm space-y-2">
            <p>• المتصفح المدعوم: Chrome, Firefox, Safari</p>
            <p>• يجب استخدام HTTPS للكاميرا</p>
            <p>• انقر على "السماح" عند طلب الأذونات</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}