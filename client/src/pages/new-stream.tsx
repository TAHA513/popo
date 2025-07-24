import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Mic, ArrowLeft, Gamepad2, Key, MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function NewStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [permissionStep, setPermissionStep] = useState('main'); // 'main', 'camera', 'mic', 'title', 'ready'
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // إنشاء البث
  const createStreamMutation = useMutation({
    mutationFn: (data: { title: string; description: string; category: string }) => 
      apiRequest('/api/streams', 'POST', data),
    onSuccess: (newStream) => {
      console.log('✅ تم إنشاء البث:', newStream);
      setCurrentStreamId(newStream.id);
      setIsStreaming(true);
    },
    onError: (error) => {
      console.error('❌ خطأ في إنشاء البث:', error);
    }
  });

  // طلب إذن الكاميرا
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      setHasCamera(true);
      setPermissionStep('mic');
      
      // إيقاف الكاميرا مؤقتاً
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('❌ خطأ في إذن الكاميرا:', error);
    }
  };

  // طلب إذن الميكروفون
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setHasMic(true);
      setPermissionStep('title');
      
      // إيقاف الكاميرا مؤقتاً حتى يكتب العنوان
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('❌ خطأ في إذن الميكروفون:', error);
    }
  };

  // بدء البث
  const startStreaming = async () => {
    if (hasCamera && hasMic && streamTitle.trim()) {
      try {
        // تأكد من أن الكاميرا تعمل قبل بدء البث
        if (!mediaStream) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setMediaStream(stream);
          }
        }
        
        // بدء البث في قاعدة البيانات
        createStreamMutation.mutate({
          title: streamTitle.trim(),
          description: streamTitle.trim(),
          category: 'gaming'
        });
      } catch (error) {
        console.error('❌ خطأ في بدء البث:', error);
        alert('خطأ في تشغيل الكاميرا. تأكد من السماح للموقع بالوصول للكاميرا والميكروفون.');
      }
    }
  };

  // إيقاف البث
  const stopStreaming = async () => {
    if (currentStreamId) {
      try {
        await apiRequest(`/api/streams/${currentStreamId}`, 'DELETE', {});
        console.log('✅ تم حذف البث من قاعدة البيانات');
      } catch (error) {
        console.error('❌ خطأ في حذف البث:', error);
      }
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsStreaming(false);
    setCurrentStreamId(null);
    setLocation('/');
  };

  // واجهة البث المباشر
  if (isStreaming) {
    return (
      <div className="min-h-screen bg-black relative">
        {/* معاينة الكاميرا */}
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={false}
          controls={false}
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* تحقق من وجود الفيديو */}
        {!mediaStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="text-4xl mb-4">📹</div>
              <p>جاري تحميل الكاميرا...</p>
            </div>
          </div>
        )}
        
        {/* أزرار التحكم */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button 
            onClick={stopStreaming}
            variant="ghost" 
            className="text-white bg-black/50 backdrop-blur-sm rounded-full w-12 h-12 p-0 hover:bg-red-500/50"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="text-white bg-red-500 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            🔴 مباشر
          </div>
        </div>

        {/* معلومات البث */}
        <div className="absolute bottom-20 left-4 right-4 text-white z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="text-lg font-bold mb-1">{streamTitle}</div>
            <div className="text-sm opacity-80">مشاهدين: 0</div>
            <div className="text-xs opacity-60">اسحب لأعلى للدردشة</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* الهيدر */}
      <div className="flex items-center justify-between p-4">
        <Button 
          onClick={() => setLocation('/')}
          variant="ghost" 
          className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">بث مباشر</h1>
        <div className="w-12"></div>
      </div>

      {/* الواجهة الرئيسية */}
      {permissionStep === 'main' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          {/* أيقونات الألعاب */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <span className="text-sm text-center">ألعاب</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <span className="text-sm text-center">دردشة</span>
            </div>
          </div>

          {/* معلومات الأذونات */}
          <div className="text-center space-y-4">
            <div className="text-2xl">🔒</div>
            <h2 className="text-xl font-bold">نحتاج لبعض الأذونات</h2>
            <p className="text-sm text-white/70 max-w-sm">
              للبدء في البث المباشر، نحتاج للوصول إلى الكاميرا والميكروفون
            </p>
          </div>

          {/* زر البدء */}
          <Button 
            onClick={() => setPermissionStep('camera')}
            className="w-full max-w-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-full font-bold text-lg"
          >
            ابدأ البث المباشر
          </Button>
        </div>
      )}

      {/* طلب إذن الكاميرا */}
      {permissionStep === 'camera' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Camera className="w-16 h-16 text-white" />
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">الوصول للكاميرا</h2>
            <p className="text-white/70 max-w-sm">
              نحتاج للوصول إلى الكاميرا لبدء البث المباشر
            </p>
          </div>

          <Button 
            onClick={requestCameraPermission}
            className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-bold"
          >
            السماح للكاميرا
          </Button>
        </div>
      )}

      {/* طلب إذن الميكروفون */}
      {permissionStep === 'mic' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Mic className="w-16 h-16 text-white" />
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">الوصول للميكروفون</h2>
            <p className="text-white/70 max-w-sm">
              نحتاج للوصول إلى الميكروفون لإرسال الصوت
            </p>
          </div>

          <Button 
            onClick={requestMicPermission}
            className="w-full max-w-sm bg-green-500 hover:bg-green-600 text-white py-4 rounded-full font-bold"
          >
            السماح للميكروفون
          </Button>
        </div>
      )}

      {/* كتابة اسم البث */}
      {permissionStep === 'title' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <MessageSquare className="w-16 h-16 text-white" />
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">اسم البث</h2>
            <p className="text-white/70 max-w-sm">
              اكتب اسماً جذاباً لبثك المباشر
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <Input
              placeholder="مثال: ألعاب ممتعة مع الأصدقاء"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center py-4 text-lg"
              maxLength={50}
            />
            
            <Button 
              onClick={async () => {
                // تشغيل الكاميرا للمعاينة
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                  });
                  
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setMediaStream(stream);
                  }
                  setPermissionStep('ready');
                } catch (error) {
                  console.error('❌ خطأ في تشغيل الكاميرا:', error);
                }
              }}
              disabled={!streamTitle.trim()}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white py-4 rounded-full font-bold disabled:opacity-50"
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* جاهز للبث */}
      {permissionStep === 'ready' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          {/* معاينة الكاميرا */}
          <div className="relative">
            <video 
              ref={videoRef}
              className="w-64 h-48 object-cover rounded-2xl bg-black"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-2 right-2 bg-green-500 w-3 h-3 rounded-full"></div>
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">جاهز للبث!</h2>
            <div className="bg-white/10 rounded-lg p-3 max-w-sm">
              <p className="text-white font-medium">{streamTitle}</p>
            </div>
            <p className="text-white/70 max-w-sm">
              كل شيء جاهز. اضغط للبدء في البث المباشر
            </p>
          </div>

          <Button 
            onClick={startStreaming}
            disabled={createStreamMutation.isPending}
            className="w-full max-w-sm bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 rounded-full font-bold text-lg"
          >
            {createStreamMutation.isPending ? 'جاري البدء...' : '🔴 بدء البث المباشر'}
          </Button>
        </div>
      )}
    </div>
  );
}