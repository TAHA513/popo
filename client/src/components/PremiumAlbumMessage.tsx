import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, Gift, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
};

interface PremiumAlbumMessageProps {
  message: PremiumMessage;
  currentUserId: string;
}

export function PremiumAlbumMessage({ message, currentUserId }: PremiumAlbumMessageProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isLocked = !message.unlockedAt;
  const isRecipient = message.recipientId === currentUserId;
  const totalCost = message.album.gift.pointCost * message.album.requiredGiftAmount;

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/premium-messages/${message.id}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم فتح الألبوم",
        description: "يمكنك الآن عرض محتوى الألبوم",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/premium-messages'] });
      setIsUnlocking(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في فتح الألبوم",
        variant: "destructive",
      });
      setIsUnlocking(false);
    },
  });

  const handleUnlock = () => {
    setIsUnlocking(true);
    unlockMutation.mutate();
  };

  return (
    <Card className={`w-full max-w-md ${isLocked ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {message.sender.profileImageUrl ? (
              <img
                src={message.sender.profileImageUrl}
                alt={message.sender.firstName || message.sender.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">
                  {(message.sender.firstName || message.sender.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {message.sender.firstName || message.sender.username}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
          
          <Badge variant={isLocked ? "destructive" : "default"} className="flex items-center gap-1">
            {isLocked ? <Lock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {isLocked ? "مقفل" : "مفتوح"}
          </Badge>
        </div>

        <div className="mt-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            {message.album.title}
          </CardTitle>
          {message.album.description && (
            <CardDescription className="mt-1">
              {message.album.description}
            </CardDescription>
          )}
        </div>

        {message.album.coverImageUrl && (
          <div className="mt-3 aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={message.album.coverImageUrl}
              alt={message.album.title}
              className={`w-full h-full object-cover ${isLocked ? 'blur-sm opacity-60' : ''}`}
            />
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {message.message && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700">{message.message}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">السعر للفتح:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{message.album.gift.emoji}</span>
              <span className="font-medium">
                {message.album.requiredGiftAmount}x {message.album.gift.name}
              </span>
              <Badge variant="outline" className="text-blue-600">
                {totalCost} نقطة
              </Badge>
            </div>
          </div>

          {isLocked && isRecipient && (
            <Button
              onClick={handleUnlock}
              disabled={isUnlocking || unlockMutation.isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              <Gift className="w-4 h-4 ml-2" />
              {isUnlocking || unlockMutation.isPending ? "جارٍ الفتح..." : `فتح الألبوم (${totalCost} نقطة)`}
            </Button>
          )}

          {!isLocked && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Navigate to album content view
                window.location.href = `/premium-albums/${message.album.id}`;
              }}
            >
              <Eye className="w-4 h-4 ml-2" />
              عرض محتوى الألبوم
            </Button>
          )}

          {isLocked && !isRecipient && (
            <div className="text-center text-sm text-gray-500">
              ألبوم مدفوع مرسل إلى مستخدم آخر
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}