import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { 
  Cloud, 
  DollarSign, 
  Zap, 
  Users, 
  Globe, 
  Shield,
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function CloudStreamGuide() {
  const [, setLocation] = useLocation();

  const streamingServices = [
    {
      name: "ZegoCloud",
      price: "$49/شهرياً",
      freeMinutes: "استكشاف مجاني",
      features: [
        "زمن استجابة أقل من ثانية واحدة",
        "مقاومة 70% لفقدان البيانات", 
        "300+ API جاهزة",
        "دعم العربية والتطبيقات الاجتماعية",
        "SDK متعدد المنصات"
      ],
      bestFor: "الأفضل بشكل عام",
      color: "from-blue-500 to-purple-600",
      icon: <Zap className="w-8 h-8" />,
      recommended: true
    },
    {
      name: "Agora.io",
      price: "$3.99/1000 دقيقة",
      freeMinutes: "10,000 دقيقة مجاناً شهرياً",
      features: [
        "دعم ملايين المشاهدين المتزامنين",
        "بنية تحتية عالمية قوية",
        "جودة عالية للفيديو والصوت",
        "تسجيل سحابي",
        "تحليلات مفصلة"
      ],
      bestFor: "الأكثر شهرة",
      color: "from-green-500 to-blue-500",
      icon: <Globe className="w-8 h-8" />
    },
    {
      name: "Daily.co",
      price: "$0.004/دقيقة",
      freeMinutes: "طبقة مجانية متاحة",
      features: [
        "تكامل خلال 10 دقائق",
        "مكونات UI جاهزة",
        "React/Flutter SDKs",
        "تسجيل مدمج",
        "دعم فني ممتاز"
      ],
      bestFor: "سهل التكامل",
      color: "from-purple-500 to-pink-500",
      icon: <Clock className="w-8 h-8" />
    },
    {
      name: "Amazon IVS",
      price: "متدرج حسب الاستخدام",
      freeMinutes: "5 ساعات إدخال + 100 ساعة مخرجات شهرياً",
      features: [
        "بنية AWS القوية",
        "تحمل مشاهدين غير محدود",
        "جودة HD و 4K",
        "CDN عالمية",
        "أمان على مستوى المؤسسات"
      ],
      bestFor: "المشاريع الكبيرة",
      color: "from-orange-500 to-red-500",
      icon: <Shield className="w-8 h-8" />
    },
    {
      name: "Ant Media Server",
      price: "مجاني (مفتوح المصدر)",
      freeMinutes: "غير محدود",
      features: [
        "زمن استجابة أقل من 0.5 ثانية",
        "يمكن استضافته ذاتياً",
        "دعم WebRTC + RTMP",
        "تخصيص كامل",
        "لا توجد رسوم شهرية"
      ],
      bestFor: "الأرخص",
      color: "from-gray-600 to-gray-800",
      icon: <DollarSign className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Cloud className="w-16 h-16 text-blue-400 mr-4" />
            <h1 className="text-4xl font-bold">خدمات البث السحابية</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            ربط تطبيق LaaBoBo بأقوى خدمات البث المباشر السحابية لتجربة بث احترافية وعالية الجودة
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {streamingServices.map((service, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden border-0 bg-gradient-to-br ${service.color} text-white transform hover:scale-105 transition-all duration-300`}
            >
              {service.recommended && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                  موصى به
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  {service.icon}
                  <span className="text-sm font-semibold bg-black/20 px-2 py-1 rounded">
                    {service.bestFor}
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold">{service.name}</CardTitle>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{service.price}</p>
                  <p className="text-sm opacity-90">{service.freeMinutes}</p>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-300 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Steps */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center">
              <ArrowRight className="w-6 h-6 mr-2" />
              خطوات التكامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">اختر الخدمة</h3>
                <p className="text-gray-400 text-sm">
                  سجل حساب مع إحدى الخدمات المذكورة أعلاه واحصل على API keys
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">أضف المفاتيح</h3>
                <p className="text-gray-400 text-sm">
                  أدخل API keys في ملف .env لربط التطبيق بالخدمة المختارة
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">ابدأ البث</h3>
                <p className="text-gray-400 text-sm">
                  استخدم البث الاحترافي المدعوم بالذكاء الاصطناعي والجودة العالية
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setLocation('/zego-stream')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            جرب ZegoCloud الآن
          </Button>
          
          <Button
            onClick={() => setLocation('/simple-stream')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 text-lg"
          >
            البث البسيط (محلي)
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            className="bg-transparent border border-gray-500 hover:bg-gray-800 text-white px-8 py-3 text-lg"
          >
            العودة للرئيسية
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 border-0 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">تحتاج مساعدة؟</h3>
              <p className="mb-4">
                يمكننا مساعدتك في إعداد وتكوين أي من هذه الخدمات لتطبيق LaaBoBo
              </p>
              <div className="text-sm opacity-90">
                اتبع التعليمات في ملف .env.example لإعداد المفاتيح المطلوبة
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}