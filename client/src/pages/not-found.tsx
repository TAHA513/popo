import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-4">
      <Card className="w-full max-w-md mx-4 shadow-2xl bg-white/95 backdrop-blur">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-700">الصفحة غير موجودة</h2>
          </div>

          <p className="mt-4 text-gray-600 mb-8">
            عذراً، لا يمكننا العثور على الصفحة التي تبحث عنها
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                العودة للرئيسية
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              الرجوع للخلف
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
