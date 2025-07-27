import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

export default function StreamTestPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [testResults, setTestResults] = useState<any[]>([]);

  const testStreamAccess = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      // اختبار إنشاء بث
      console.log('🧪 اختبار إنشاء بث...');
      const streamData = {
        title: 'اختبار البث - ' + new Date().toLocaleTimeString('ar'),
        description: 'بث تجريبي للاختبار',
        category: 'اختبار'
      };

      const createResponse = await apiRequest('/api/streams', 'POST', streamData);
      console.log('✅ تم إنشاء البث:', createResponse);

      // اختبار جلب البث
      const streamId = createResponse.data.id;
      const getResponse = await apiRequest(`/api/streams/${streamId}`, 'GET');
      console.log('✅ تم جلب البث:', getResponse);

      setTestResults(prev => [...prev, {
        action: 'إنشاء وجلب البث',
        success: true,
        data: { streamId, created: createResponse.data, fetched: getResponse }
      }]);

      // تجربة الانتقال للبث
      alert(`تم إنشاء البث بنجاح! ID: ${streamId} - سيتم الانتقال إليه الآن`);
      setLocation(`/stream/${streamId}`);

    } catch (error: any) {
      console.error('❌ خطأ في الاختبار:', error);
      setTestResults(prev => [...prev, {
        action: 'اختبار البث',
        success: false,
        error: error.message || error.toString()
      }]);
    }
  };

  const testAuth = async () => {
    try {
      const authResponse = await apiRequest('/api/auth/user', 'GET');
      console.log('✅ المصادقة تعمل:', authResponse);
      setTestResults(prev => [...prev, {
        action: 'اختبار المصادقة',
        success: true,
        data: authResponse
      }]);
    } catch (error: any) {
      console.error('❌ خطأ في المصادقة:', error);
      setTestResults(prev => [...prev, {
        action: 'اختبار المصادقة',
        success: false,
        error: error.message
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🧪 اختبار وظائف البث</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button 
            onClick={testAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto"
          >
            <div className="text-center">
              <div className="text-lg font-bold">اختبار المصادقة</div>
              <div className="text-sm opacity-80">تحقق من حالة تسجيل الدخول</div>
            </div>
          </Button>

          <Button 
            onClick={testStreamAccess}
            className="bg-green-600 hover:bg-green-700 text-white p-4 h-auto"
          >
            <div className="text-center">
              <div className="text-lg font-bold">اختبار البث</div>
              <div className="text-sm opacity-80">إنشاء بث والانتقال إليه</div>
            </div>
          </Button>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl mb-2">معلومات المستخدم الحالي</h3>
          {user ? (
            <div className="bg-green-900/30 p-4 rounded-lg">
              <p>✅ مسجل دخول: {user.username}</p>
              <p>ID: {user.id}</p>
            </div>
          ) : (
            <div className="bg-red-900/30 p-4 rounded-lg">
              <p>❌ غير مسجل دخول</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">نتائج الاختبارات</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-400">لم يتم تشغيل أي اختبارات بعد</p>
          ) : (
            testResults.map((result, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className={`mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? '✅' : '❌'} {result.action}
                  </div>
                  {result.success ? (
                    <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-red-400 text-sm">
                      خطأ: {result.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline"
            className="text-white border-gray-600"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}