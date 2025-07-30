import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Gift, DollarSign, History, ArrowUp, ArrowDown } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WalletData {
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
}

interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Fetch wallet data
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['/api/wallet'],
    queryFn: async () => {
      const response = await fetch('/api/wallet', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch wallet data');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  // Fetch wallet transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/wallet/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/wallet/transactions', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!user
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest('/api/wallet/withdraw', 'POST', { amount });
    },
    onSuccess: () => {
      toast({
        title: "تم السحب بنجاح",
        description: "تم تحويل المبلغ إلى نقاط LaaBoBo"
      });
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في السحب",
        description: error.message || "حدث خطأ أثناء السحب",
        variant: "destructive"
      });
    }
  });

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "مبلغ غير صحيح",
        description: "يرجى إدخال مبلغ صحيح للسحب",
        variant: "destructive"
      });
      return;
    }

    if (amount > (walletData?.availableBalance || 0)) {
      toast({
        title: "رصيد غير كافي",
        description: "المبلغ المطلوب أكبر من الرصيد المتاح",
        variant: "destructive"
      });
      return;
    }

    withdrawMutation.mutate(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <SimpleNavigation />
        <div className="pt-16 pb-20 px-4 flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">تسجيل الدخول مطلوب</h3>
            <p className="text-gray-600">يرجى تسجيل الدخول لعرض محفظتك</p>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <SimpleNavigation />
      
      <div className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <Wallet className="w-8 h-8 ml-3" />
              محفظة الأرباح
            </h1>
            <p className="text-white/70">أرباحك من الهدايا المستلمة (40% صافي)</p>
          </div>

          {/* Wallet Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <h3 className="text-lg font-bold">إجمالي الأرباح</h3>
                <p className="text-3xl font-bold">{walletData?.totalEarnings || 0}</p>
                <p className="text-sm opacity-80">نقطة مكتسبة</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2" />
                <h3 className="text-lg font-bold">الرصيد المتاح</h3>
                <p className="text-3xl font-bold">{walletData?.availableBalance || 0}</p>
                <p className="text-sm opacity-80">قابل للسحب</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardContent className="p-6 text-center">
                <ArrowUp className="w-8 h-8 mx-auto mb-2" />
                <h3 className="text-lg font-bold">تم سحبه</h3>
                <p className="text-3xl font-bold">{walletData?.totalWithdrawn || 0}</p>
                <p className="text-sm opacity-80">نقطة مسحوبة</p>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Section */}
          <Card className="bg-black/30 border-purple-500/20">
            <CardHeader>
              <h3 className="text-xl font-bold text-white text-center flex items-center justify-center">
                <ArrowUp className="w-6 h-6 ml-2" />
                سحب الأرباح
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center text-white/70 text-sm">
                  يمكنك سحب أرباحك وتحويلها إلى نقاط LaaBoBo لاستخدامها في التطبيق
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="أدخل المبلغ للسحب"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white text-right"
                    min="1"
                    max={walletData?.availableBalance || 0}
                  />
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending || !withdrawAmount}
                    className="bg-green-600 hover:bg-green-700 px-6"
                  >
                    {withdrawMutation.isPending ? 'جاري السحب...' : 'سحب'}
                  </Button>
                </div>

                <div className="text-center text-white/60 text-xs">
                  الحد الأدنى للسحب: 1 نقطة | الرصيد المتاح: {walletData?.availableBalance || 0} نقطة
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-black/30 border-yellow-500/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4 text-center flex items-center justify-center">
                <Gift className="w-5 h-5 ml-2" />
                كيف تعمل الأرباح؟
              </h3>
              <div className="space-y-3 text-white/80 text-sm">
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-600 text-white">40%</Badge>
                  <p>تحصل على 40% من قيمة كل هدية تستلمها كأرباح في محفظتك</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white">تلقائي</Badge>
                  <p>الأرباح تُضاف تلقائياً عند استلام الهدايا من الغرف المدفوعة</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-purple-600 text-white">سحب</Badge>
                  <p>يمكنك سحب أرباحك وتحويلها إلى نقاط LaaBoBo في أي وقت</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-black/30 border-purple-500/20">
            <CardHeader>
              <h3 className="text-xl font-bold text-white text-center flex items-center justify-center">
                <History className="w-6 h-6 ml-2" />
                سجل المعاملات
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا توجد معاملات بعد</p>
                  <p className="text-sm mt-2">ستظهر هنا أرباحك وعمليات السحب</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction: WalletTransaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'gift_earning' ? (
                          <ArrowDown className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowUp className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <p className="text-white/60 text-sm">
                            {new Date(transaction.createdAt).toLocaleString('ar')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'gift_earning' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.type === 'gift_earning' ? '+' : '-'}{Math.abs(transaction.amount)}
                        </p>
                        <p className="text-white/60 text-sm">نقطة</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}