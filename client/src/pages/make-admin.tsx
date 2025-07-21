import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Crown } from "lucide-react";
import { useLocation } from "wouter";

export default function MakeAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState(user?.email || "");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "تمت الترقية بنجاح! 🎉",
          description: "تم ترقيتك إلى super_admin. يمكنك الآن الوصول للوحة التحكم.",
        });
        
        // Redirect to admin panel after 2 seconds
        setTimeout(() => {
          window.location.href = '/panel-9bd2f2-control';
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "فشلت الترقية",
          description: data.message || "تحقق من البريد الإلكتروني والكود",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء الترقية",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">ترقية إلى Super Admin</CardTitle>
          <p className="text-gray-600 mt-2">أدخل بياناتك للحصول على صلاحيات إدارية كاملة</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="code">كود الترقية</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="أدخل الكود الخاص"
                required
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">احصل على الكود من مدير النظام</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>جاري الترقية...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4 ml-2" />
                  ترقية الحساب
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">ماذا يعني Super Admin؟</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• الوصول الكامل للوحة التحكم</li>
              <li>• إدارة المستخدمين والمحتوى</li>
              <li>• مراقبة الإحصائيات والتقارير</li>
              <li>• التحكم في إعدادات النظام</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}