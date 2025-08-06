import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Users, Heart, Sparkles, Gift, Video, MessageCircle, TrendingUp, DollarSign, Star, Crown } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للملف الشخصي
            </Button>
          </Link>
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-purple-600 ml-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              سياسات وشروط LaaBoBo
            </h1>
          </div>
        </div>

        {/* Platform Overview */}
        <Card className="mb-8 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-purple-800 dark:text-purple-200">
              <Sparkles className="w-6 h-6 ml-3" />
              نظرة عامة على المنصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              LaaBoBo Garden (حديقة LaaBoBo) هي منصة اجتماعية مبتكرة تُحدث ثورة في التفاعل على وسائل التواصل الاجتماعي من خلال مشاركة الذكريات والمشاركة المجتمعية. تركز المنصة على إنشاء المحتوى والتفاعلات الاجتماعية وميزات المجتمع.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-gradient-to-b from-purple-100 to-purple-50 dark:from-purple-800/30 dark:to-purple-900/20 rounded-lg">
                <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">البث المباشر</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-b from-pink-100 to-pink-50 dark:from-pink-800/30 dark:to-pink-900/20 rounded-lg">
                <Gift className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <p className="text-sm font-medium">نظام الهدايا</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-800/30 dark:to-blue-900/20 rounded-lg">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">الدردشة المباشرة</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-b from-green-100 to-green-50 dark:from-green-800/30 dark:to-green-900/20 rounded-lg">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">المجتمع</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-blue-800 dark:text-blue-200">
              <Star className="w-6 h-6 ml-3" />
              مميزات وخدمات المنصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Core Features */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b pb-2">
                  الميزات الأساسية
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Heart className="w-5 h-5 text-red-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">نظام الذكريات</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        إنشاء ومشاركة المحتوى مع دعم غني للوسائط المتعددة وأنواع مختلفة من الذكريات
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Video className="w-5 h-5 text-purple-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">البث المباشر</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        بث فيديو مباشر بتقنية WebRTC للتفاعل المباشر مع المتابعين
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MessageCircle className="w-5 h-5 text-blue-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">الدردشة المباشرة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        دردشة نصية فورية، محادثات خاصة وقدرات المراسلة الجماعية
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-green-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">الميزات الاجتماعية</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        الملفات الشخصية، نظام المتابعة، الإعجابات، التعليقات والتفاعلات الاجتماعية
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Features */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b pb-2">
                  الميزات المميزة
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Gift className="w-5 h-5 text-yellow-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">نظام الهدايا</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        أكثر من 30 هدية متنوعة مع تأثيرات ثلاثية الأبعاد ونظام نقاط متكامل
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Crown className="w-5 h-5 text-purple-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">الألبومات المميزة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        نظام محتوى مدفوع مع إدارة شاملة للألبومات وواجهة عربية
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Sparkles className="w-5 h-5 text-pink-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">الرسائل المميزة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        نظام مراسلة مميز لمشاركة الألبومات المدفوعة
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-green-500 ml-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">الذكريات الدائمة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ذكريات لا تنتهي صلاحيتها أبداً مع مؤشرات خاصة
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monetization & Earnings */}
        <Card className="mb-8 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-green-800 dark:text-green-200">
              <DollarSign className="w-6 h-6 ml-3" />
              كيفية الربح من المنصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* For Content Creators */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b pb-2">
                  للمبدعين والمؤثرين
                </h3>
                
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🎁 الهدايا الافتراضية</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      اكسب النقاط من خلال تلقي الهدايا من المتابعين أثناء البث المباشر أو على المحتوى
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">👑 المحتوى المميز</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      بيع الألبومات المميزة والمحتوى الحصري للمشتركين
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📈 برنامج الشراكة</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      انضم لبرنامج شراكة المبدعين واحصل على عمولة من المبيعات
                    </p>
                  </div>
                </div>
              </div>

              {/* For Regular Users */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b pb-2">
                  للمستخدمين العاديين
                </h3>
                
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⭐ النشاط اليومي</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      احصل على نقاط مجانية من خلال التفاعل اليومي والمشاركة في المجتمع
                    </p>
                  </div>
                  
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <h4 className="font-semibold text-pink-800 dark:text-pink-200 mb-2">🔄 نظام الإحالة</h4>
                    <p className="text-sm text-pink-700 dark:text-pink-300">
                      ادع الأصدقاء واحصل على مكافآت عن كل شخص ينضم عبر رابطك
                    </p>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">🎮 المسابقات والألعاب</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      شارك في المسابقات والفعاليات الخاصة لكسب جوائز نقدية
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Terms */}
        <Card className="mb-8 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-800 dark:text-gray-200">
              <Shield className="w-6 h-6 ml-3" />
              سياسة الخصوصية والشروط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">🔒 حماية البيانات</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 ml-2">•</span>
                  نحمي جميع بياناتك الشخصية بتشفير عالي المستوى
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 ml-2">•</span>
                  لا نشارك معلوماتك مع أطراف ثالثة بدون موافقتك
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 ml-2">•</span>
                  يمكنك حذف حسابك وجميع بياناتك في أي وقت
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">📜 شروط الاستخدام</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 ml-2">•</span>
                  يجب أن تكون 13 سنة أو أكثر لاستخدام المنصة
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 ml-2">•</span>
                  ممنوع نشر محتوى مسيء أو غير مناسب
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 ml-2">•</span>
                  احترم الآخرين وحافظ على بيئة إيجابية
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 ml-2">•</span>
                  لا تنتهك حقوق الملكية الفكرية للآخرين
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">💰 السياسات المالية</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-500 ml-2">•</span>
                  جميع المعاملات آمنة ومشفرة
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 ml-2">•</span>
                  يمكن استرداد الأموال خلال 7 أيام من الشراء
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 ml-2">•</span>
                  النقاط المكتسبة لا تنتهي صلاحيتها
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="text-center py-8">
            <h3 className="font-bold text-xl mb-4 text-purple-800 dark:text-purple-200">
              تواصل معنا
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              لأي استفسارات أو مساعدة، يمكنك التواصل معنا
            </p>
            <div className="flex justify-center space-x-4 rtl:space-x-reverse">
              <Badge variant="outline" className="px-4 py-2">
                📧 support@laabobogarden.com
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                📱 واتساب: +1234567890
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}