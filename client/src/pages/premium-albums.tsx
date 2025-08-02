import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Eye, Lock, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type PremiumAlbum = {
  id: number;
  creatorId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  requiredGiftId: number;
  requiredGiftAmount: number;
  createdAt: Date;
  hasAccess?: boolean;
};

type GiftCharacter = {
  id: number;
  name: string;
  emoji: string;
  pointCost: number;
  description: string;
};

type AlbumMedia = {
  id: number;
  albumId: number;
  mediaUrl: string;
  mediaType: string;
  caption?: string;
  orderIndex: number;
  createdAt: Date;
};

export default function PremiumAlbumsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PremiumAlbum | null>(null);
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    requiredGiftId: '',
    requiredGiftAmount: 1,
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's albums
  const { data: userAlbums, isLoading: albumsLoading } = useQuery({
    queryKey: ['/api/premium-albums/my-albums'],
  });

  // Fetch available gifts
  const { data: gifts } = useQuery<GiftCharacter[]>({
    queryKey: ['/api/gifts'],
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: async (albumData: any) => {
      const response = await fetch('/api/premium-albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(albumData),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الألبوم",
        description: "تم إنشاء الألبوم المدفوع بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/premium-albums/my-albums'] });
      setIsCreateDialogOpen(false);
      setNewAlbum({
        title: '',
        description: '',
        coverImageUrl: '',
        requiredGiftId: '',
        requiredGiftAmount: 1,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الألبوم",
        variant: "destructive",
      });
    },
  });

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ albumId, mediaData }: { albumId: number; mediaData: any }) => {
      const response = await fetch(`/api/premium-albums/${albumId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم رفع المحتوى",
        description: "تم رفع المحتوى للألبوم بنجاح",
      });
      setUploadingMedia(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع المحتوى",
        variant: "destructive",
      });
      setUploadingMedia(false);
    },
  });

  const handleCreateAlbum = () => {
    if (!newAlbum.title || !newAlbum.requiredGiftId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    createAlbumMutation.mutate({
      ...newAlbum,
      requiredGiftId: parseInt(newAlbum.requiredGiftId),
    });
  };

  const handleFileUpload = async (albumId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    
    // In a real app, you'd upload to a file storage service first
    // For now, we'll simulate with a placeholder URL
    const mediaUrl = `/uploads/${file.name}`;
    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

    uploadMediaMutation.mutate({
      albumId,
      mediaData: {
        mediaUrl,
        mediaType,
        caption: `${mediaType} من الألبوم`,
        orderIndex: 0,
      },
    });
  };

  const getGiftDetails = (giftId: number) => {
    return gifts?.find(g => g.id === giftId);
  };

  if (albumsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل الألبومات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            الألبومات المدفوعة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة ألبوماتك المدفوعة وإنشاء محتوى حصري
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء ألبوم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء ألبوم مدفوع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الألبوم</Label>
                <Input
                  id="title"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  placeholder="أدخل عنوان الألبوم"
                />
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  placeholder="وصف الألبوم (اختياري)"
                />
              </div>

              <div>
                <Label htmlFor="coverImage">رابط صورة الغلاف</Label>
                <Input
                  id="coverImage"
                  value={newAlbum.coverImageUrl}
                  onChange={(e) => setNewAlbum({ ...newAlbum, coverImageUrl: e.target.value })}
                  placeholder="رابط صورة الغلاف (اختياري)"
                />
              </div>

              <div>
                <Label htmlFor="gift">الهدية المطلوبة</Label>
                <Select 
                  value={newAlbum.requiredGiftId} 
                  onValueChange={(value) => setNewAlbum({ ...newAlbum, requiredGiftId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الهدية المطلوبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {gifts?.map((gift) => (
                      <SelectItem key={gift.id} value={gift.id.toString()}>
                        {gift.emoji} {gift.name} ({gift.pointCost} نقطة)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">عدد الهدايا المطلوبة</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={newAlbum.requiredGiftAmount}
                  onChange={(e) => setNewAlbum({ ...newAlbum, requiredGiftAmount: parseInt(e.target.value) })}
                />
              </div>

              <Button 
                onClick={handleCreateAlbum} 
                className="w-full"
                disabled={createAlbumMutation.isPending}
              >
                {createAlbumMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الألبوم"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!userAlbums || (Array.isArray(userAlbums) && userAlbums.length === 0) ? (
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            لا توجد ألبومات مدفوعة
          </h3>
          <p className="text-gray-500 mb-6">
            قم بإنشاء أول ألبوم مدفوع لك وابدأ في بيع المحتوى الحصري
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(userAlbums) && userAlbums.map((album: PremiumAlbum) => {
            const giftDetails = getGiftDetails(album.requiredGiftId);
            const totalCost = giftDetails ? giftDetails.pointCost * album.requiredGiftAmount : 0;
            
            return (
              <Card key={album.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {album.coverImageUrl && (
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={album.coverImageUrl} 
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardTitle className="text-lg">{album.title}</CardTitle>
                  {album.description && (
                    <CardDescription>{album.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">السعر:</span>
                      <div className="flex items-center">
                        {giftDetails && (
                          <>
                            <span className="text-lg ml-1">{giftDetails.emoji}</span>
                            <span className="font-medium">
                              {album.requiredGiftAmount}x {giftDetails.name}
                            </span>
                            <span className="text-blue-600 font-bold mr-2">
                              ({totalCost} نقطة)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedAlbum(album)}
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>
                      
                      <label className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={uploadingMedia}
                        >
                          <Upload className="w-4 h-4 ml-1" />
                          {uploadingMedia ? "جارٍ الرفع..." : "رفع محتوى"}
                        </Button>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(album.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}