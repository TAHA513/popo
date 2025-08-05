import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Upload, Eye, Lock, Star, Gift, Image, Video, X, DragDrop, CloudUpload } from "lucide-react";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isAddMediaDialogOpen, setIsAddMediaDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Fetch album media when album is selected
  const { data: albumMedia, isLoading: mediaLoading } = useQuery<AlbumMedia[]>({
    queryKey: ['/api/premium-albums', selectedAlbum?.id, 'media'],
    enabled: !!selectedAlbum,
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

  // Enhanced file handling functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...droppedFiles.slice(0, 10 - prev.length)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles.slice(0, 10 - prev.length)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToAlbum = async (albumId: number) => {
    if (selectedFiles.length === 0) return;

    setUploadingMedia(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', `محتوى من الألبوم`);
        formData.append('orderIndex', i.toString());

        // Upload file first
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`فشل في رفع الملف: ${file.name}`);
        }

        const uploadResult = await uploadResponse.json();
        
        // Add media to album
        await uploadMediaMutation.mutateAsync({
          albumId,
          mediaData: {
            mediaUrl: uploadResult.url,
            mediaType: file.type.startsWith('image/') ? 'image' : 'video',
            caption: `محتوى من الألبوم`,
            orderIndex: i,
          },
        });

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Clear selected files and close dialog
      setSelectedFiles([]);
      setIsAddMediaDialogOpen(false);
      
      toast({
        title: "تم الرفع بنجاح",
        description: `تم رفع ${selectedFiles.length} ملف بنجاح`,
      });

    } catch (error: any) {
      toast({
        title: "خطأ في الرفع",
        description: error.message || "فشل في رفع بعض الملفات",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
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
                      
                      <Dialog open={isAddMediaDialogOpen && selectedAlbum?.id === album.id} 
                             onOpenChange={(open) => {
                               setIsAddMediaDialogOpen(open);
                               if (open) setSelectedAlbum(album);
                               if (!open) setSelectedFiles([]);
                             }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedAlbum(album)}
                          >
                            <Upload className="w-4 h-4 ml-1" />
                            رفع محتوى
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>رفع محتوى للألبوم: {album.title}</DialogTitle>
                          </DialogHeader>
                          
                          {/* File Upload Area */}
                          <div className="space-y-4">
                            <div
                              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                dragActive 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                            >
                              <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                اسحب الملفات هنا أو انقر للتحديد
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                يمكنك رفع حتى 10 صور أو فيديوهات (حد أقصى 10 ميجا لكل ملف)
                              </p>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="w-4 h-4 ml-2" />
                                اختر الملفات
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                              />
                            </div>

                            {/* Selected Files Preview */}
                            {selectedFiles.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-medium">الملفات المحددة ({selectedFiles.length}/10):</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="flex items-center">
                                        {file.type.startsWith('image/') ? (
                                          <Image className="w-5 h-5 text-blue-500 ml-2" />
                                        ) : (
                                          <Video className="w-5 h-5 text-green-500 ml-2" />
                                        )}
                                        <div>
                                          <p className="text-sm font-medium truncate max-w-[150px]">
                                            {file.name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(1)} ميجا
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upload Progress */}
                            {uploadingMedia && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>جارٍ الرفع...</span>
                                  <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <Progress value={uploadProgress} className="w-full" />
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <Button
                                onClick={() => uploadFilesToAlbum(album.id)}
                                disabled={selectedFiles.length === 0 || uploadingMedia}
                                className="flex-1"
                              >
                                {uploadingMedia ? "جارٍ الرفع..." : `رفع ${selectedFiles.length} ملف`}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedFiles([]);
                                  setIsAddMediaDialogOpen(false);
                                }}
                                disabled={uploadingMedia}
                              >
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Album Media View Dialog */}
      {selectedAlbum && (
        <Dialog open={!!selectedAlbum && !isAddMediaDialogOpen} onOpenChange={() => setSelectedAlbum(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAlbum.title}</DialogTitle>
              {selectedAlbum.description && (
                <p className="text-gray-600 dark:text-gray-400">{selectedAlbum.description}</p>
              )}
            </DialogHeader>
            
            <div className="space-y-4">
              {mediaLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3">جارٍ تحميل المحتوى...</span>
                </div>
              ) : !albumMedia || albumMedia.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    لا يوجد محتوى بعد
                  </h3>
                  <p className="text-gray-500">
                    لم يتم رفع أي محتوى لهذا الألبوم بعد
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {albumMedia.map((media) => (
                    <div key={media.id} className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {media.mediaType === 'image' ? (
                        <img 
                          src={media.mediaUrl} 
                          alt={media.caption || 'صورة من الألبوم'}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <video 
                          src={media.mediaUrl} 
                          className="w-full h-48 object-cover"
                          controls
                        >
                          متصفحك لا يدعم تشغيل الفيديو
                        </video>
                      )}
                      
                      {media.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                          <p className="text-sm truncate">{media.caption}</p>
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                        {media.mediaType === 'image' ? (
                          <div className="bg-blue-500 text-white p-1 rounded">
                            <Image className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="bg-green-500 text-white p-1 rounded">
                            <Video className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}