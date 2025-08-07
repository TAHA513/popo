import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Calendar, CreditCard, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface PaymentTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  stripePaymentId: string;
  paymentStatus: string;
  createdAt: string;
}

export default function PaymentHistory() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/payment-history'],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">مكتمل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">قيد المعالجة</Badge>;
      case 'failed':
        return <Badge className="bg-red-600">فشل</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-600">مُسترد</Badge>;
      default:
        return <Badge className="bg-gray-600">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">سجل المدفوعات</h1>
              <p className="text-pink-200">تاريخ مشترياتك للنقاط</p>
            </div>
          </div>
          <Button 
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="text-center py-12">
              <CreditCard className="h-16 w-16 text-pink-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">لا توجد مدفوعات</h2>
              <p className="text-pink-200 mb-6">لم تقم بأي عمليات شراء للنقاط حتى الآن</p>
              <Link href="/point-packages">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  شراء النقاط
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction: PaymentTransaction) => (
              <Card key={transaction.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {transaction.description}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-pink-200">
                          <Calendar className="h-4 w-4" />
                          {formatDate(transaction.createdAt)}
                        </div>
                        {transaction.stripePaymentId && (
                          <p className="text-xs text-pink-300 mt-1">
                            معرف الدفعة: {transaction.stripePaymentId.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-2xl font-bold text-pink-300 mb-1">
                        +{transaction.amount.toLocaleString()} نقطة
                      </div>
                      {getStatusBadge(transaction.paymentStatus)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {transactions.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-right">ملخص المدفوعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {transactions.length}
                  </div>
                  <div className="text-pink-200">إجمالي المعاملات</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-300">
                    {transactions
                      .filter((t: PaymentTransaction) => t.paymentStatus === 'completed')
                      .reduce((sum: number, t: PaymentTransaction) => sum + t.amount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-pink-200">إجمالي النقاط المشتراة</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-300">
                    {transactions.filter((t: PaymentTransaction) => t.paymentStatus === 'completed').length}
                  </div>
                  <div className="text-pink-200">المدفوعات الناجحة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link href="/point-packages">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              <Zap className="h-4 w-4 ml-2" />
              شراء المزيد من النقاط
            </Button>
          </Link>
          <Link href="/wallet">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <CreditCard className="h-4 w-4 ml-2" />
              عرض المحفظة
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}