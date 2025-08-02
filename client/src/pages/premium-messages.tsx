import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PremiumAlbumMessage } from "@/components/PremiumAlbumMessage";
import { SendPremiumAlbumModal } from "@/components/SendPremiumAlbumModal";
import { Plus, Gift, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type PremiumMessage = {
  id: number;
  senderId: string;
  recipientId: string;
  albumId: number;
  message: string;
  unlockedAt?: Date;
  createdAt: Date;
  album: {
    id: number;
    title: string;
    description?: string;
    coverImageUrl?: string;
    requiredGiftId: number;
    requiredGiftAmount: number;
    gift: {
      id: number;
      name: string;
      emoji: string;
      pointCost: number;
    };
  };
  sender: {
    id: string;
    firstName?: string;
    username: string;
    profileImageUrl?: string;
  };
  recipient: {
    id: string;
    firstName?: string;
    username: string;
    profileImageUrl?: string;
  };
};

export default function PremiumMessagesPage() {
  const { user } = useAuth();

  // Fetch premium messages
  const { data: messages, isLoading } = useQuery<PremiumMessage[]>({
    queryKey: ['/api/premium-messages'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل الرسائل المدفوعة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-yellow-500" />
            الرسائل المدفوعة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            عرض وإدارة رسائل الألبومات المدفوعة
          </p>
        </div>

        <Button 
          onClick={() => window.location.href = '/premium-albums'}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          إدارة الألبومات
        </Button>
      </div>

      {!messages || messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4 space-x-4 rtl:space-x-reverse">
            <Gift className="w-16 h-16 text-gray-400" />
            <MessageSquare className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            لا توجد رسائل مدفوعة
          </h3>
          <p className="text-gray-500 mb-6">
            ابدأ بإنشاء ألبومات مدفوعة أو انتظر استلام رسائل من الآخرين
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => window.location.href = '/premium-albums'}
              variant="outline"
            >
              إنشاء ألبوم مدفوع
            </Button>
            <Button 
              onClick={() => window.location.href = '/messages'}
              variant="outline"
            >
              العودة للرسائل العادية
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Received Messages */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              الرسائل المستلمة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages
                .filter(msg => msg.recipientId === user?.id)
                .map((message) => (
                  <PremiumAlbumMessage
                    key={`received-${message.id}`}
                    message={message}
                    currentUserId={user?.id || ''}
                  />
                ))}
            </div>
            {messages.filter(msg => msg.recipientId === user?.id).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد رسائل مستلمة
              </div>
            )}
          </div>

          {/* Sent Messages */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              الرسائل المرسلة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages
                .filter(msg => msg.senderId === user?.id)
                .map((message) => (
                  <Card key={`sent-${message.id}`} className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Gift className="w-5 h-5 text-green-500" />
                          {message.album.title}
                        </CardTitle>
                        <div className="text-xs text-gray-500">
                          مرسل إلى {message.recipient.firstName || message.recipient.username}
                        </div>
                      </div>
                      {message.album.description && (
                        <CardDescription>{message.album.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {message.album.coverImageUrl && (
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={message.album.coverImageUrl}
                              alt={message.album.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">الحالة:</span>
                          <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                            message.unlockedAt 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {message.unlockedAt ? 'تم الفتح' : 'في الانتظار'}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">
                          تم الإرسال: {new Date(message.createdAt).toLocaleDateString('ar-EG')}
                          {message.unlockedAt && (
                            <div>
                              تم الفتح: {new Date(message.unlockedAt).toLocaleDateString('ar-EG')}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {messages.filter(msg => msg.senderId === user?.id).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لم ترسل أي رسائل مدفوعة بعد
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}