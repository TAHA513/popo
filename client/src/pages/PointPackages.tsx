import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, CreditCard, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PointPackage {
  id: number;
  name: string;
  pointAmount: number;
  priceInCents: number;
  priceDisplay: string;
  currency: string;
  bonusPoints: number;
  isPopular: boolean;
  isActive: boolean;
}

export default function PointPackages() {
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const { toast } = useToast();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['/api/point-packages'],
  });

  const handlePurchase = (pkg: PointPackage) => {
    setSelectedPackage(pkg);
    // Redirect to checkout with selected package
    window.location.href = `/checkout?package=${pkg.id}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">حزم النقاط</h1>
              <p className="text-pink-200">اختر الحزمة المناسبة لك لشراء النقاط</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="text-white font-medium">نقاطك الحالية: --</span>
          </div>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg: PointPackage) => (
            <Card key={pkg.id} className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${pkg.isPopular ? 'border-2 border-yellow-400 shadow-xl shadow-yellow-400/20' : 'border-white/20'} bg-white/10 backdrop-blur-sm text-white`}>
              {pkg.isPopular && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-yellow-400 text-black font-bold">
                    <Star className="h-3 w-3 ml-1" />
                    الأكثر شعبية
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {pkg.name}
                </CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-pink-300">
                    {pkg.priceDisplay}
                  </div>
                  <div className="text-lg text-pink-200">
                    {pkg.pointAmount.toLocaleString()} نقطة
                  </div>
                </div>
              </CardHeader>

              <CardContent className="text-center pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-pink-200">
                      {pkg.pointAmount.toLocaleString()} نقطة أساسية
                    </span>
                  </div>
                  
                  {pkg.bonusPoints > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-300">
                        + {pkg.bonusPoints.toLocaleString()} نقطة إضافية
                      </span>
                    </div>
                  )}

                  <div className="text-2xl font-bold text-white pt-2">
                    = {(pkg.pointAmount + pkg.bonusPoints).toLocaleString()} نقطة
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  onClick={() => handlePurchase(pkg)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3"
                >
                  <CreditCard className="h-4 w-4 ml-2" />
                  اشتري الآن
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">كيفية استخدام النقاط</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-pink-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium mb-1">إرسال الهدايا</h3>
              <p className="text-sm">أرسل هدايا للمبدعين في البث المباشر</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium mb-1">شراء المحتوى</h3>
              <p className="text-sm">اشتري الألبومات والمحتوى المتميز</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium mb-1">دعم المبدعين</h3>
              <p className="text-sm">ادعم المبدعين المفضلين لديك</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 text-center">
          <p className="text-pink-200 mb-4">طرق الدفع المدعومة:</p>
          <div className="flex justify-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">Visa</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">Mastercard</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">American Express</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}