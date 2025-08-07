import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function MFALogin() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const verifyMFACode = async () => {
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
      const response = await apiRequest('/api/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          token: verificationCode
        })
      });

      if (response.ok) {
        toast({
          title: "تم تسجيل الدخول",
          description: "تم التحقق من الهوية بنجاح"
        });
        setLocation('/');
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
        description: "فشل في التحقق من الرمز",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md mx-auto pt-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold">
              التحقق بخطوتين
            </CardTitle>
            <CardDescription>
              أدخل الرمز من تطبيق المصادقة لإكمال تسجيل الدخول
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                افتح تطبيق Google Authenticator وأدخل الرمز المكون من 6 أرقام
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">
                  رمز التحقق (6 أرقام):
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>

              <Button 
                onClick={verifyMFACode}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
              </Button>

              <Button 
                variant="outline"
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                العودة لتسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}