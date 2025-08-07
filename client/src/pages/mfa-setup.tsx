import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Smartphone, Key, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MFASetup() {
  const [step, setStep] = useState(1);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateMFASecret();
  }, []);

  const generateMFASecret = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/mfa/generate-secret', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء كود الحماية",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('/api/mfa/verify-and-enable', {
        method: 'POST',
        body: JSON.stringify({
          secret,
          token: verificationCode
        })
      });

      if (response.ok) {
        setStep(3);
        toast({
          title: "تم التفعيل بنجاح",
          description: "تم تفعيل التحقق بخطوتين لحسابك"
        });
      } else {
        const error = await response.json();
        toast({
          title: "فشل التحقق",
          description: error.message || "رمز التحقق غير صحيح",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تفعيل التحقق بخطوتين",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold">
              تفعيل التحقق بخطوتين
            </CardTitle>
            <CardDescription>
              احم حسابك بطبقة إضافية من الأمان
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    قم بتحميل تطبيق Google Authenticator أو أي تطبيق مشابه على هاتفك
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    بعد تحميل التطبيق، انقر على "التالي" للمتابعة
                  </p>
                  
                  <Button 
                    onClick={() => setStep(2)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    امسح رمز QR التالي باستخدام تطبيق Google Authenticator:
                  </p>
                  
                  {qrCodeUrl && (
                    <div className="flex justify-center mb-4">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="border-2 border-gray-200 rounded-lg"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="verification-code">
                      أدخل الرمز من التطبيق (6 أرقام):
                    </Label>
                    <Input
                      id="verification-code"
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="text-center text-lg tracking-widest"
                    />
                  </div>

                  <Button 
                    onClick={verifyAndEnableMFA}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? "جاري التحقق..." : "تفعيل التحقق بخطوتين"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-green-600">
                  تم التفعيل بنجاح!
                </h3>
                
                <p className="text-sm text-gray-600">
                  تم تفعيل التحقق بخطوتين لحسابك. سيُطلب منك إدخال رمز من تطبيق المصادقة عند تسجيل الدخول.
                </p>

                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    احتفظ بهذا الرمز السري في مكان آمن: <code className="bg-gray-100 px-1 rounded">{secret}</code>
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => window.location.href = '/profile'}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  العودة إلى الملف الشخصي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}