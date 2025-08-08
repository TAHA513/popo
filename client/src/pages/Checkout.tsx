import { useEffect, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { ArrowLeft, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PointPackage {
  id: number;
  name: string;
  pointAmount: number;
  priceInCents: number;
  priceDisplay: string;
  currency: string;
  bonusPoints: number;
  isPopular: boolean;
}

const CheckoutForm = ({ selectedPackage }: { selectedPackage: PointPackage | null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedPackage) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "فشل في الدفع",
          description: error.message || "حدث خطأ أثناء معالجة الدفع",
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        const response = await apiRequest('/api/confirm-payment', 'POST', {
          paymentIntentId: paymentIntent.id
        });

        if (response.ok) {
          const data = await response.json();
          setPaymentSucceeded(true);
          toast({
            title: "تم الدفع بنجاح!",
            description: `تم إضافة ${data.pointsAdded} نقطة إلى حسابك`,
          });

          // Redirect to profile after 3 seconds
          setTimeout(() => {
            setLocation('/profile');
          }, 3000);
        } else {
          throw new Error('فشل في تأكيد الدفع');
        }
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الدفع",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSucceeded) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح!</h2>
        <p className="text-pink-200 mb-4">تم إضافة النقاط إلى حسابك</p>
        <p className="text-sm text-pink-300">سيتم توجيهك إلى ملفك الشخصي خلال ثوانٍ...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: "tabs"
        }}
      />
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            جاري المعالجة...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 ml-2" />
            ادفع {selectedPackage?.priceDisplay}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get package ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const packageId = urlParams.get('package');
    
    if (!packageId) {
      setError("لم يتم تحديد حزمة نقاط");
      return;
    }

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('/api/create-payment-intent', 'POST', { 
          packageId: parseInt(packageId) 
        });

        if (!response.ok) {
          throw new Error('فشل في إنشاء عملية الدفع');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setSelectedPackage(data.package);
      } catch (error: any) {
        setError(error.message || 'حدث خطأ في إعداد الدفع');
      }
    };

    createPaymentIntent();
  }, [location]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/point-packages">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">الدفع</h1>
          </div>

          <Card className="bg-red-900/20 border-red-500/50 text-white">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-bold mb-2 text-red-300">خطأ في الدفع</h2>
              <p className="text-red-200 mb-4">{error}</p>
              <Link href="/point-packages">
                <Button className="bg-red-600 hover:bg-red-700">
                  العودة إلى حزم النقاط
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-white">جاري إعداد عملية الدفع...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/point-packages">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">إتمام الدفع</h1>
        </div>

        {/* Payment Unavailable Notice */}
        <div className="mb-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-6 border-2 border-red-400/50">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">🚫 عذراً</h2>
              <p className="text-red-200 text-lg font-semibold mb-1">
                عملية الشراء غير متاحة حالياً في بلدك
              </p>
              <p className="text-red-100 text-sm">
                نعمل على توسيع خدماتنا لتشمل منطقتك قريباً. يرجى المحاولة لاحقاً
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-right">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPackage && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedPackage.name}</span>
                    <span>{selectedPackage.priceDisplay}</span>
                  </div>
                  <div className="flex justify-between text-sm text-pink-200">
                    <span>النقاط الأساسية</span>
                    <span>{selectedPackage.pointAmount.toLocaleString()}</span>
                  </div>
                  {selectedPackage.bonusPoints > 0 && (
                    <div className="flex justify-between text-sm text-green-300">
                      <span>نقاط إضافية</span>
                      <span>+{selectedPackage.bonusPoints.toLocaleString()}</span>
                    </div>
                  )}
                  <hr className="border-white/20" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>إجمالي النقاط</span>
                    <span>{(selectedPackage.pointAmount + selectedPackage.bonusPoints).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl text-pink-300">
                    <span>المبلغ الإجمالي</span>
                    <span>{selectedPackage.priceDisplay}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-right">معلومات الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#ec4899',
                      colorBackground: 'transparent',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '6px',
                      borderRadius: '8px',
                    }
                  }
                }}
              >
                <CheckoutForm selectedPackage={selectedPackage} />
              </Elements>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-sm text-pink-200">
            🔒 جميع عمليات الدفع آمنة ومشفرة بواسطة Stripe
          </p>
        </div>
      </div>
    </div>
  );
}