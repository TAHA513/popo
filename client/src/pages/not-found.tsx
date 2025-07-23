import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">الصفحة غير موجودة</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            الصفحة التي تبحث عنها غير متوفرة
          </p>
          
          <Button 
            onClick={() => window.location.href = '/'}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
          >
            العودة للصفحة الرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
