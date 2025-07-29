import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { apiRequest } from "@/lib/queryClient";

export default function ZegoFixPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [streamUrl, setStreamUrl] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const createSimpleStream = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setStatus('جاري إنشاء البث...');
      
      // إنشاء البث في قاعدة البيانات
      const streamData = {
        title: 'بث تجريبي مباشر',
        description: 'اختبار نقل الفيديو والصوت'
      };

      const response = await apiRequest('/api/streams', 'POST', streamData);
      if (!response?.data?.id) {
        throw new Error('فشل في إنشاء البث');
      }

      const streamId = response.data.id;
      const streamPageUrl = `${window.location.origin}/unified-stream`;
      const watchUrl = `${window.location.origin}/stream/${streamId}`;
      
      setStreamUrl(watchUrl);
      setStatus('✅ تم إنشاء البث بنجاح!');
      
      // فتح صفحة البث في نافذة جديدة
      window.open(streamPageUrl, '_blank');
      
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔧 حل مشكلة البث المباشر</h1>
          <p className="text-blue-200">تعليمات بسيطة لاختبار البث بطريقة صحيحة</p>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-blue-500/50 p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">📋 التعليمات:</h3>
          <ol className="space-y-3 text-blue-200 list-decimal list-inside">
            <li>اضغط على "إنشاء بث تجريبي" أدناه</li>
            <li>سيفتح تبويب جديد - امنح الأذونات للكاميرا والميكروفون</li>
            <li>اضغط على "بدء البث المحسن" في التبويب الجديد</li>
            <li>انسخ رابط المشاهدة وافتحه في تبويب آخر أو شاركه</li>
            <li>يجب أن يظهر الفيديو والصوت للمشاهدين الآن</li>
          </ol>
        </Card>

        <Card className="bg-black/20 backdrop-blur-sm border-green-500/50 p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">✅ التحسينات المطبقة:</h3>
          <ul className="space-y-2 text-green-200">
            <li>• معرفات ثابتة للغرف والبث</li>
            <li>• إعدادات محسنة لـ ZegoCloud</li>
            <li>• معرف مستخدم صحيح (غير فارغ)</li>
            <li>• إزالة timestamps من المعرفات</li>
          </ul>
        </Card>

        {status && (
          <Card className={`p-4 mb-6 ${status.includes('✅') ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
            <p className="text-white">{status}</p>
          </Card>
        )}

        {streamUrl && (
          <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500 p-4 mb-6">
            <p className="text-white mb-2">رابط المشاهدة:</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={streamUrl}
                readOnly
                className="flex-1 bg-black/30 text-white px-3 py-2 rounded"
              />
              <Button
                onClick={() => navigator.clipboard.writeText(streamUrl)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                نسخ
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          <Button
            onClick={createSimpleStream}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isLoading ? '🔄 جاري الإنشاء...' : '🎥 إنشاء بث تجريبي'}
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full border-blue-400 text-blue-200 hover:bg-blue-800"
          >
            🏠 العودة للرئيسية
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>💡 نصيحة: استخدم متصفحين مختلفين أو وضع التصفح الخاص للاختبار</p>
        </div>
      </div>
    </div>
  );
}