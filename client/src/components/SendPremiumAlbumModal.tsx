import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Gift, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PremiumAlbum = {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  requiredGiftId: number;
  requiredGiftAmount: number;
  gift?: {
    id: number;
    name: string;
    emoji: string;
    pointCost: number;
  };
};

interface SendPremiumAlbumModalProps {
  recipientId: string;
  recipientName: string;
  trigger: React.ReactNode;
}

export function SendPremiumAlbumModal({ recipientId, recipientName, trigger }: SendPremiumAlbumModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's premium albums
  const { data: userAlbums, isLoading } = useQuery<PremiumAlbum[]>({
    queryKey: ['/api/premium-albums/my-albums'],
    enabled: isOpen,
  });

  // Send premium message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch('/api/premium-messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال الألبوم المدفوع بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setIsOpen(false);
      setSelectedAlbumId('');
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!selectedAlbumId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ألبوم للإرسال",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      recipientId,
      albumId: parseInt(selectedAlbumId),
      message,
    });
  };

  const selectedAlbum = userAlbums?.find(album => album.id.toString() === selectedAlbumId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-500" />
            إرسال ألبوم مدفوع إلى {recipientName}
          </DialogTitle>
          <DialogDescription>
            اختر الألبوم المدفوع الذي تريد إرساله مع رسالة اختيارية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">جارٍ تحميل الألبومات...</div>
            </div>
          ) : !userAlbums || userAlbums.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">لا توجد ألبومات مدفوعة متاحة</p>
              <Button
                variant="link"
                onClick={() => window.location.href = '/premium-albums'}
                className="mt-2"
              >
                إنشاء ألبوم جديد
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="album">اختيار الألبوم</Label>
                <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الألبوم المراد إرساله" />
                  </SelectTrigger>
                  <SelectContent>
                    {userAlbums.map((album) => (
                      <SelectItem key={album.id} value={album.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{album.title}</span>
                          {album.gift && (
                            <Badge variant="outline" className="text-xs">
                              {album.gift.emoji} {album.requiredGiftAmount}x
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAlbum && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      {selectedAlbum.title}
                    </CardTitle>
                    {selectedAlbum.description && (
                      <CardDescription>{selectedAlbum.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {selectedAlbum.coverImageUrl && (
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={selectedAlbum.coverImageUrl}
                          alt={selectedAlbum.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {selectedAlbum.gift && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">سعر الفتح:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedAlbum.gift.emoji}</span>
                          <span className="font-medium">
                            {selectedAlbum.requiredGiftAmount}x {selectedAlbum.gift.name}
                          </span>
                          <Badge variant="outline" className="text-blue-600">
                            {selectedAlbum.gift.pointCost * selectedAlbum.requiredGiftAmount} نقطة
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="message">رسالة مرفقة (اختياري)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="أضف رسالة مع الألبوم..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !selectedAlbumId}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  <Send className="w-4 h-4 ml-2" />
                  {sendMessageMutation.isPending ? "جارٍ الإرسال..." : "إرسال الألبوم"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}