import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { 
  Cloud, 
  Radio, 
  Zap, 
  Globe, 
  Clock, 
  Shield,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

export default function StreamServiceSelector() {
  const [, setLocation] = useLocation();

  const streamingOptions = [
    {
      type: 'cloud',
      title: 'بث احترافي سحابي',
      subtitle: 'أداء عالي وجودة فائقة',
      icon: <Cloud className="w-8 h-8 text-blue-500" />,
      features: [
        'زمن استجابة أقل من ثانية واحدة',
        'جودة HD/4K مع تحسين تلقائي',
        'يدعم آلاف المشاهدين المتزامنين',
        'تسجيل سحابي وإحصائيات متقدمة',
        'CDN عالمية للتوزيع السريع'
      ],
      pricing: 'من $49/شهر أو مجاني للتجربة',
      recommended: true,
      action: () => setLocation('/cloud-stream-guide'),
      buttonText: 'اختر الخدمة السحابية',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      type: 'local', 
      title: 'بث بسيط محلي',
      subtitle: 'ابدأ الآن بدون تعقيد',
      icon: <Radio className="w-8 h-8 text-red-500" />,
      features: [
        'بدء فوري بدون إعدادات',
        'مجاني بالكامل',
        'يعمل على أي جهاز',
        'مناسب للمبتدئين',
        'محاكاة تفاعل المشاهدين'
      ],
      pricing: 'مجاني 100%',
      recommended: false,
      action: () => setLocation('/simple-stream'),
      buttonText: 'ابدأ البث البسيط',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">اختر نوع البث المناسب</h1>
          <p className="text-gray-300">ابدأ البث المباشر بالطريقة التي تناسبك</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {streamingOptions.map((option, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden border-0 bg-gradient-to-br ${
                option.type === 'cloud' 
                  ? 'from-blue-600 to-purple-700' 
                  : 'from-red-600 to-pink-700'
              } text-white transform hover:scale-105 transition-all duration-300`}
            >
              {option.recommended && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  موصى به
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center mb-4">
                  {option.icon}
                  <div className="mr-3">
                    <CardTitle className="text-xl font-bold">{option.title}</CardTitle>
                    <p className="text-sm opacity-90">{option.subtitle}</p>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-sm font-semibold mb-1">التكلفة:</p>
                  <p className="font-bold">{option.pricing}</p>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-300 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={option.action}
                  className={`w-full ${option.buttonColor} text-white py-3 font-semibold flex items-center justify-center space-x-2 rtl:space-x-reverse`}
                >
                  <span>{option.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Service Comparison */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-center">مقارنة سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-right py-2">الميزة</th>
                    <th className="text-center py-2">البث السحابي</th>
                    <th className="text-center py-2">البث البسيط</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-gray-700">
                    <td className="py-2">جودة الفيديو</td>
                    <td className="text-center">HD/4K متكيفة</td>
                    <td className="text-center">جودة عادية</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2">عدد المشاهدين</td>
                    <td className="text-center">آلاف + غير محدود</td>
                    <td className="text-center">محاكاة محلية</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2">زمن الاستجابة</td>
                    <td className="text-center">&lt; 1 ثانية</td>
                    <td className="text-center">فوري</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2">التسجيل</td>
                    <td className="text-center">سحابي تلقائي</td>
                    <td className="text-center">غير متاح</td>
                  </tr>
                  <tr>
                    <td className="py-2">الإعداد</td>
                    <td className="text-center">يحتاج API key</td>
                    <td className="text-center">فوري</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}