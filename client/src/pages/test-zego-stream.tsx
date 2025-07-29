import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";
import { Input } from '@/components/ui/input';

export default function TestZegoStreamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [streamUrl, setStreamUrl] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamTitle, setStreamTitle] = useState('اختبار البث المباشر');
  
  const testStreamingFlow = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setStatus('🔄 جاري إنشاء البث...');
      
      // 1. إنشاء البث في قاعدة البيانات
      const streamData = {
        title: streamTitle,
        description: 'اختبار نقل الفيديو والصوت عبر ZegoCloud'
      };

      const response = await apiRequest('/api/streams', 'POST', streamData);
      if (!response?.data?.id) {
        throw new Error('فشل في إنشاء البث');
      }

      const streamId = response.data.id;
      setStatus(`✅ تم إنشاء البث بمعرف: ${streamId}`);
      
      // 2. تحديث معرفات ZegoCloud
      const zegoRoomId = `room_${streamId}`;
      const zegoStreamId = `stream_${streamId}`;
      
      await apiRequest(`/api/streams/${streamId}`, 'PATCH', {
        zegoRoomId,
        zegoStreamId
      });
      
      setStatus(`✅ تم تحديث معرفات البث: ${zegoRoomId}`);
      
      // 3. إنشاء روابط البث
      const hostUrl = `${window.location.origin}/unified-stream`;
      const watchUrl = `${window.location.origin}/stream/${streamId}`;
      
      setStreamUrl(watchUrl);
      setStatus('✅ البث جاهز! افتح الروابط أدناه');
      
      // فتح صفحة المذيع في نافذة جديدة
      setTimeout(() => {
        window.open(hostUrl, '_blank');
      }, 1000);
      
    } catch (error: any) {
      setStatus(`❌ خطأ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">يجب تسجيل الدخول</h2>
          <Button onClick={() => setLocation("/login")}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 اختبار البث المباشر</h1>
          <p className="text-green-200">تحقق من عمل البث بالخطوات الصحيحة</p>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-green-500/50 p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">🔍 الخطوات:</h3>
          <ol className="space-y-3 text-green-200 list-decimal list-inside">
            <li>أدخل عنوان البث</li>
            <li>اضغط "بدء الاختبار"</li>
            <li>سيفتح تبويب جديد للمذيع</li>
            <li>اضغط "بدء البث المحسن" في تبويب المذيع</li>
            <li>انسخ رابط المشاهدة وافتحه في متصفح آخر</li>
            <li>يجب أن يظهر الفيديو والصوت بشكل صحيح</li>
          </ol>
        </Card>

        <Card className="bg-black/20 backdrop-blur-sm border-teal-500/50 p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">🔧 التحسينات المطبقة:</h3>
          <ul className="space-y-2 text-teal-200">
            <li>• معرفات مستخدم صحيحة (غير فارغة)</li>
            <li>• معرفات غرف بسيطة وثابتة</li>
            <li>• تحديث البث في قاعدة البيانات</li>
            <li>• إزالة الخصائص غير المدعومة</li>
            <li>• تسجيل مفصل لكل خطوة</li>
          </ul>
        </Card>

        <Card className="bg-black/20 backdrop-blur-sm border-cyan-500/50 p-6 mb-6">
          <label className="block text-white font-bold mb-2">عنوان البث:</label>
          <Input
            type="text"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            className="w-full bg-black/30 text-white border-cyan-400"
            placeholder="أدخل عنوان البث..."
          />
        </Card>

        {status && (
          <Card className={`p-4 mb-6 ${status.includes('✅') ? 'bg-green-500/20 border-green-500' : status.includes('🔄') ? 'bg-blue-500/20 border-blue-500' : 'bg-red-500/20 border-red-500'}`}>
            <p className="text-white font-mono text-sm">{status}</p>
          </Card>
        )}

        {streamUrl && (
          <Card className="bg-cyan-500/20 backdrop-blur-sm border-cyan-500 p-4 mb-6">
            <p className="text-white mb-2 font-bold">🔗 رابط المشاهدة:</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={streamUrl}
                readOnly
                className="flex-1 bg-black/30 text-white px-3 py-2 rounded font-mono text-sm"
              />
              <Button
                onClick={() => navigator.clipboard.writeText(streamUrl)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                نسخ
              </Button>
              <Button
                onClick={() => window.open(streamUrl, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                فتح
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          <Button
            onClick={testStreamingFlow}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white"
          >
            {isLoading ? '🔄 جاري الإعداد...' : '🚀 بدء الاختبار'}
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full border-green-400 text-green-200 hover:bg-green-800"
          >
            🏠 العودة للرئيسية
          </Button>
        </div>

        <div className="mt-8 bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-500">
          <h4 className="text-yellow-200 font-bold mb-2">💡 نصائح مهمة:</h4>
          <ul className="text-yellow-100 text-sm space-y-1">
            <li>• استخدم متصفحين مختلفين للاختبار (Chrome للمذيع، Edge للمشاهد)</li>
            <li>• تأكد من السماح بالكاميرا والميكروفون</li>
            <li>• افتح console (F12) لمراقبة السجلات</li>
            <li>• انتظر 5-10 ثواني بعد بدء البث حتى يظهر للمشاهدين</li>
          </ul>
        </div>
      </div>
    </div>
  );
}