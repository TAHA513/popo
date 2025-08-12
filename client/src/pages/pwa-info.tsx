import { useState } from 'react';
import { ArrowLeft, Smartphone, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PWAStatus } from '@/components/pwa-status';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PWAInfoPage() {
  const { language, dir } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  const isRTL = dir === 'rtl';

  const pwaFeatures = [
    {
      title: 'التثبيت على الهاتف',
      description: 'يمكن تثبيت التطبيق على شاشة هاتفك مثل التطبيقات العادية',
      icon: '📱',
      color: 'blue'
    },
    {
      title: 'العمل بلا إنترنت',
      description: 'تصفح المحتوى المحفوظ حتى بدون اتصال بالإنترنت',
      icon: '🔄',
      color: 'green'
    },
    {
      title: 'الإشعارات الفورية',
      description: 'تلقي إشعارات للرسائل الجديدة والتحديثات المهمة',
      icon: '🔔',
      color: 'purple'
    },
    {
      title: 'المزامنة التلقائية',
      description: 'تتم مزامنة بياناتك تلقائياً عند الاتصال بالإنترنت',
      icon: '☁️',
      color: 'cyan'
    },
    {
      title: 'أداء محسن',
      description: 'تحميل أسرع وتجربة أكثر سلاسة مع التخزين المؤقت الذكي',
      icon: '⚡',
      color: 'yellow'
    },
    {
      title: 'مشاركة الملفات',
      description: 'شارك الصور والفيديوهات مباشرة من التطبيقات الأخرى',
      icon: '📤',
      color: 'pink'
    }
  ];

  const installSteps = [
    {
      platform: 'Android (Chrome)',
      steps: [
        'اضغط على قائمة Chrome (⋮)',
        'اختر "إضافة إلى الشاشة الرئيسية"',
        'اضغط "إضافة" للتأكيد',
        'ستجد أيقونة التطبيق على شاشة هاتفك'
      ]
    },
    {
      platform: 'iPhone (Safari)',
      steps: [
        'اضغط على زر المشاركة في Safari',
        'مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"',
        'اضغط "إضافة" للتأكيد',
        'ستجد أيقونة التطبيق على شاشة هاتفك'
      ]
    },
    {
      platform: 'Windows/Mac (Chrome)',
      steps: [
        'ابحث عن أيقونة التثبيت في شريط العنوان',
        'اضغط على "تثبيت LaaBoBo"',
        'اختر "تثبيت" في النافذة المنبثقة',
        'سيفتح التطبيق في نافذة منفصلة'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              تطبيق الويب التقدمي
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              معلومات وإعدادات PWA
            </p>
          </div>
        </div>

        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">المزايا</TabsTrigger>
            <TabsTrigger value="install">التثبيت</TabsTrigger>
            <TabsTrigger value="status">الحالة</TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  ما هو تطبيق الويب التقدمي؟
                </CardTitle>
                <CardDescription>
                  LaaBoBo PWA يقدم تجربة تطبيق أصلي مع مزايا الويب الحديث
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pwaFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl" role="img" aria-label={feature.title}>
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Install Prompt Component */}
            <PWAInstallPrompt />
          </TabsContent>

          {/* Install Tab */}
          <TabsContent value="install" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>كيفية تثبيت التطبيق</CardTitle>
                <CardDescription>
                  خطوات تثبيت LaaBoBo على جهازك حسب المنصة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {installSteps.map((platform, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Badge variant="outline">{platform.platform}</Badge>
                    </h3>
                    <ol className="space-y-2">
                      {platform.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3">
                          <Badge variant="secondary" className="min-w-[24px] h-6 rounded-full flex items-center justify-center text-xs">
                            {stepIndex + 1}
                          </Badge>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  نصائح مهمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 بعد التثبيت، يمكنك استخدام التطبيق مثل أي تطبيق آخر على هاتفك
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    🔔 فعّل الإشعارات للحصول على تحديثات فورية للرسائل والأنشطة
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    ⚡ التطبيق المثبت يعمل أسرع ويستهلك بيانات أقل
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  حالة التطبيق والإعدادات
                </CardTitle>
                <CardDescription>
                  معلومات مفصلة عن حالة PWA والإمكانيات المتاحة
                </CardDescription>
              </CardHeader>
            </Card>

            <PWAStatus />

            <Card>
              <CardHeader>
                <CardTitle>معلومات تقنية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span>إصدار PWA:</span>
                    <Badge variant="outline">v2.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Worker:</span>
                    <Badge variant="default">نشط</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>استراتيجية التخزين:</span>
                    <Badge variant="secondary">Cache First</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>دعم Background Sync:</span>
                    <Badge variant="default">متاح</Badge>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs space-y-2">
                    <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                    <div><strong>Platform:</strong> {navigator.platform}</div>
                    <div><strong>Language:</strong> {navigator.language}</div>
                    <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? 'إخفاء التفاصيل التقنية' : 'عرض التفاصيل التقنية'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}