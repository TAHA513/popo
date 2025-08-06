import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift, 
  TrendingUp,
  Eye,
  CreditCard,
  Star,
  Trophy,
  Crown,
  Gem,
  Send,
  RefreshCw
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Transaction {
  id: number;
  type: 'earned' | 'spent' | 'gift_sent' | 'gift_received';
  amount: number;
  description: string;
  createdAt: string;
  relatedUser?: {
    id: string;
    username: string;
    firstName: string;
  };
}

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'gifts' | 'transfer'>('overview');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientWalletId, setRecipientWalletId] = useState('');

  // جلب بيانات المستخدم مع النقاط
  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user?.id,
  });

  // جلب تاريخ المعاملات
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/transactions`],
    enabled: !!user?.id,
  });

  // جلب الهدايا المرسلة والمستلمة
  const { data: sentGifts } = useQuery({
    queryKey: [`/api/gifts/sent/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: receivedGifts } = useQuery({
    queryKey: [`/api/gifts/received/${user?.id}`],
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">محفظة LaaBoBo</h2>
            <p className="text-gray-500">يجب تسجيل الدخول لعرض محفظتك</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPoints = userProfile?.points || 0;
  const walletId = user.id; // معرف المحفظة = معرف المستخدم

  // حساب إحصائيات سريعة
  const totalSentGifts = sentGifts?.length || 0;
  const totalReceivedGifts = receivedGifts?.length || 0;
  const totalGiftsSent = sentGifts?.reduce((sum: number, gift: any) => sum + (gift.giftCharacterPointCost || 0), 0) || 0;
  const totalGiftsReceived = receivedGifts?.reduce((sum: number, gift: any) => sum + (gift.giftCharacterPointCost || 0), 0) || 0;

  // Transfer points mutation
  const transferMutation = useMutation({
    mutationFn: async ({ recipientId, amount }: { recipientId: string; amount: number }) => {
      const response = await apiRequest('POST', '/api/wallet/transfer', {
        recipientId,
        amount
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تحويل النقاط');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ تم التحويل بنجاح",
        description: `تم تحويل ${transferAmount} نقطة إلى المحفظة ${recipientWalletId}`,
      });
      setShowTransferDialog(false);
      setTransferAmount('');
      setRecipientWalletId('');
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ فشل في التحويل",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleTransfer = () => {
    const amount = parseInt(transferAmount);
    if (!recipientWalletId || !amount || amount <= 0) {
      toast({
        title: "❌ بيانات غير صحيحة",
        description: "يرجى إدخال معرف المحفظة والمبلغ بشكل صحيح",
        variant: "destructive"
      });
      return;
    }

    if (amount > currentPoints) {
      toast({
        title: "❌ رصيد غير كافي",
        description: `ليس لديك نقاط كافية. رصيدك الحالي: ${currentPoints} نقطة`,
        variant: "destructive"
      });
      return;
    }

    transferMutation.mutate({ recipientId: recipientWalletId, amount });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">محفظة {user.firstName || user.username}</h1>
          <div className="bg-white rounded-lg p-3 inline-block shadow-sm">
            <p className="text-sm text-gray-600">معرف المحفظة</p>
            <p className="font-mono text-lg text-purple-600 font-bold">{walletId}</p>
          </div>
        </div>

        {/* Main Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-yellow-300 ml-2" />
                <h2 className="text-2xl font-bold">الرصيد الحالي</h2>
              </div>
              <div className="text-6xl font-bold mb-4 tracking-tight">
                {currentPoints.toLocaleString()}
              </div>
              <p className="text-xl text-purple-100">نقطة LaaBoBo</p>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-purple-400">
                <div className="text-center">
                  <ArrowUpRight className="w-6 h-6 mx-auto mb-2 text-green-300" />
                  <p className="text-sm text-purple-100">مكتسب</p>
                  <p className="font-bold text-lg">+{totalGiftsReceived}</p>
                </div>
                <div className="text-center">
                  <ArrowDownLeft className="w-6 h-6 mx-auto mb-2 text-orange-300" />
                  <p className="text-sm text-purple-100">مرسل</p>
                  <p className="font-bold text-lg">-{totalGiftsSent}</p>
                </div>
                <div className="text-center">
                  <Gift className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
                  <p className="text-sm text-purple-100">الهدايا</p>
                  <p className="font-bold text-lg">{totalSentGifts + totalReceivedGifts}</p>
                </div>
              </div>
              
              {/* Transfer Button */}
              <div className="mt-6 pt-6 border-t border-purple-400">
                <Button 
                  onClick={() => setShowTransferDialog(true)}
                  className="w-full bg-white text-purple-600 hover:bg-purple-50 border-0"
                >
                  <Send className="w-5 h-5 ml-2" />
                  تحويل نقاط
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm flex">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? "bg-purple-500 text-white" : ""}
            >
              <TrendingUp className="w-4 h-4 ml-2" />
              نظرة عامة
            </Button>
            <Button
              variant={activeTab === "transactions" ? "default" : "ghost"}
              onClick={() => setActiveTab("transactions")}
              className={activeTab === "transactions" ? "bg-purple-500 text-white" : ""}
            >
              <CreditCard className="w-4 h-4 ml-2" />
              المعاملات
            </Button>
            <Button
              variant={activeTab === "gifts" ? "default" : "ghost"}
              onClick={() => setActiveTab("gifts")}
              className={activeTab === "gifts" ? "bg-purple-500 text-white" : ""}
            >
              <Gift className="w-4 h-4 ml-2" />
              الهدايا
            </Button>
            <Button
              variant={activeTab === "transfer" ? "default" : "ghost"}
              onClick={() => setActiveTab("transfer")}
              className={activeTab === "transfer" ? "bg-purple-500 text-white" : ""}
            >
              <Send className="w-4 h-4 ml-2" />
              التحويل
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">النقاط الكلية</h3>
                <p className="text-2xl font-bold text-purple-600">{currentPoints}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <ArrowUpRight className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">الهدايا المستلمة</h3>
                <p className="text-2xl font-bold text-green-600">{totalReceivedGifts}</p>
                <p className="text-sm text-gray-500">{totalGiftsReceived} نقطة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <ArrowDownLeft className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">الهدايا المرسلة</h3>
                <p className="text-2xl font-bold text-orange-600">{totalSentGifts}</p>
                <p className="text-sm text-gray-500">{totalGiftsSent} نقطة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">المستوى</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {currentPoints >= 1000 ? "VIP" : currentPoints >= 500 ? "Gold" : "Silver"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "transactions" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 ml-2" />
                تاريخ المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد معاملات</h3>
                  <p className="text-gray-500">لم تقم بأي معاملات حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction: Transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'earned' || transaction.type === 'gift_received' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'gift_sent' || transaction.type === 'gift_received' ? (
                            <Gift className="w-5 h-5" />
                          ) : transaction.type === 'earned' ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'earned' || transaction.type === 'gift_received' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'earned' || transaction.type === 'gift_received' ? '+' : '-'}
                        {transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "gifts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sent Gifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                  الهدايا المرسلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!sentGifts || sentGifts.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لم ترسل أي هدايا بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentGifts.slice(0, 5).map((gift: any) => (
                      <div key={gift.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-2xl">{gift.giftCharacterEmoji}</span>
                          <div>
                            <p className="font-medium">{gift.giftCharacterName}</p>
                            <p className="text-sm text-gray-500">إلى {gift.receiverFirstName || gift.receiverUsername}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          -{gift.giftCharacterPointCost}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Received Gifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <ArrowDownLeft className="w-5 h-5 ml-2" />
                  الهدايا المستلمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!receivedGifts || receivedGifts.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">لم تتلق أي هدايا بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedGifts.slice(0, 5).map((gift: any) => (
                      <div key={gift.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-2xl">{gift.giftCharacterEmoji}</span>
                          <div>
                            <p className="font-medium">{gift.giftCharacterName}</p>
                            <p className="text-sm text-gray-500">من {gift.senderFirstName || gift.senderUsername}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          +{gift.giftCharacterPointCost}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "transfer" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 ml-2" />
                تحويل النقاط
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">معلومات مهمة:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• يمكنك تحويل النقاط إلى أي محفظة باستخدام معرف المحفظة</li>
                  <li>• معرف المحفظة هو نفسه معرف المستخدم</li>
                  <li>• التحويل فوري ولا يمكن التراجع عنه</li>
                  <li>• رصيدك الحالي: {currentPoints} نقطة</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipientId">معرف المحفظة المستلمة</Label>
                  <Input
                    id="recipientId"
                    placeholder="أدخل معرف المحفظة (مثال: AY7JfzwUCBdKAVfPJbcS8)"
                    value={recipientWalletId}
                    onChange={(e) => setRecipientWalletId(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">المبلغ المراد تحويله</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    max={currentPoints}
                    placeholder="أدخل عدد النقاط"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>

                {transferAmount && recipientWalletId && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-bold text-green-900 mb-2">ملخص التحويل:</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <div>من: {walletId}</div>
                      <div>إلى: {recipientWalletId}</div>
                      <div>المبلغ: {transferAmount} نقطة</div>
                      <div>رصيدك بعد التحويل: {currentPoints - parseInt(transferAmount || '0')} نقطة</div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleTransfer}
                  disabled={transferMutation.isPending || !transferAmount || !recipientWalletId}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {transferMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحويل...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      تحويل النقاط
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Send className="w-5 h-5 ml-2" />
              تحويل سريع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-recipient">معرف المحفظة المستلمة</Label>
              <Input
                id="quick-recipient"
                placeholder="معرف المحفظة"
                value={recipientWalletId}
                onChange={(e) => setRecipientWalletId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="quick-amount">المبلغ</Label>
              <Input
                id="quick-amount"
                type="number"
                min="1"
                max={currentPoints}
                placeholder="عدد النقاط"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleTransfer}
                disabled={transferMutation.isPending || !transferAmount || !recipientWalletId}
              >
                {transferMutation.isPending ? "جاري التحويل..." : "تحويل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}