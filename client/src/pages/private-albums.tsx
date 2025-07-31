import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Camera, Lock, Image, Gift, Star, Crown, Heart, ArrowLeft } from 'lucide-react';

interface Album {
  id: number;
  title: string;
  description: string;
  albumType: 'locked_album' | 'individual_photos';
  accessPrice: number;
  totalPhotos: number;
  totalViews: number;
  hasAccess: boolean;
  isOwner: boolean;
  requiresPayment?: boolean;
  giftRequired?: {
    name: string;
    icon: string;
    price: number;
  };
}

interface Photo {
  id: number;
  imageUrl: string;
  caption: string;
  accessPrice: number;
  hasAccess: boolean;
  requiresPayment: boolean;
  giftRequired?: {
    name: string;
    icon: string;
    price: number;
  };
}

const giftOptions = [
  { name: 'وردة', icon: '🌹', price: 50 },
  { name: 'قلب', icon: '❤️', price: 100 },
  { name: 'نجمة', icon: '⭐', price: 200 },
  { name: 'تاج', icon: '👑', price: 500 },
  { name: 'ألماسة', icon: '💎', price: 1000 },
  { name: 'هدية فاخرة', icon: '🎁', price: 2000 },
];

export default function PrivateAlbums() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [showGiftSelector, setShowGiftSelector] = useState<{ type: 'album' | 'photo'; id: number } | null>(null);
  const [currentUserMode, setCurrentUserMode] = useState('view'); // 'view' or 'manage'
  
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    albumType: 'locked_album' as 'locked_album' | 'individual_photos',
    accessPrice: 100,
    giftRequired: giftOptions[0]
  });
  
  const [newPhoto, setNewPhoto] = useState({
    imageUrl: '',
    caption: '',
    accessPrice: 50,
    giftRequired: giftOptions[0]
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Get user's albums
  const { data: albums = [], isLoading } = useQuery({
    queryKey: ['/api/albums/user', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Get album photos when album is selected
  const { data: albumDetails } = useQuery({
    queryKey: ['/api/albums', selectedAlbum?.id],
    enabled: !!selectedAlbum?.id,
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: (albumData: any) => apiRequest('/api/albums', 'POST', albumData),
    onSuccess: () => {
      toast({ title: "تم إنشاء الألبوم بنجاح" });
      setShowCreateAlbum(false);
      setNewAlbum({
        title: '',
        description: '',
        albumType: 'locked_album',
        accessPrice: 100,
        giftRequired: giftOptions[0]
      });
      queryClient.invalidateQueries({ queryKey: ['/api/albums/user'] });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء الألبوم", variant: "destructive" });
    }
  });

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: ({ albumId, photoData }: { albumId: number; photoData: any }) => 
      apiRequest(`/api/albums/${albumId}/photos`, 'POST', photoData),
    onSuccess: () => {
      toast({ title: "تم إضافة الصورة بنجاح" });
      setShowAddPhoto(false);
      setNewPhoto({
        imageUrl: '',
        caption: '',
        accessPrice: 50,
        giftRequired: giftOptions[0]
      });
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
    },
    onError: () => {
      toast({ title: "فشل في إضافة الصورة", variant: "destructive" });
    }
  });

  // Purchase album access mutation
  const purchaseAlbumMutation = useMutation({
    mutationFn: ({ albumId, giftPaid }: { albumId: number; giftPaid: any }) => 
      apiRequest(`/api/albums/${albumId}/purchase`, 'POST', { giftPaid }),
    onSuccess: () => {
      toast({ title: "تم شراء الألبوم بنجاح! يمكنك الآن مشاهدة جميع الصور" });
      setShowGiftSelector(null);
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
    },
    onError: (error: any) => {
      toast({ 
        title: error.response?.data?.message || "فشل في شراء الألبوم", 
        variant: "destructive" 
      });
    }
  });

  // Purchase photo access mutation
  const purchasePhotoMutation = useMutation({
    mutationFn: ({ photoId, giftPaid }: { photoId: number; giftPaid: any }) => 
      apiRequest(`/api/photos/${photoId}/purchase`, 'POST', { giftPaid }),
    onSuccess: () => {
      toast({ title: "تم شراء الصورة بنجاح!" });
      setShowGiftSelector(null);
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
    },
    onError: (error: any) => {
      toast({ 
        title: error.response?.data?.message || "فشل في شراء الصورة", 
        variant: "destructive" 
      });
    }
  });

  const handleCreateAlbum = () => {
    createAlbumMutation.mutate({
      ...newAlbum,
      giftRequired: newAlbum.giftRequired
    });
  };

  const handleAddPhoto = () => {
    if (!selectedAlbum) return;
    
    addPhotoMutation.mutate({
      albumId: selectedAlbum.id,
      photoData: {
        ...newPhoto,
        giftRequired: selectedAlbum.albumType === 'individual_photos' ? newPhoto.giftRequired : null
      }
    });
  };

  const handlePurchaseAlbum = (gift: any) => {
    if (showGiftSelector?.type === 'album') {
      purchaseAlbumMutation.mutate({
        albumId: showGiftSelector.id,
        giftPaid: gift
      });
    }
  };

  const handlePurchasePhoto = (gift: any) => {
    if (showGiftSelector?.type === 'photo') {
      purchasePhotoMutation.mutate({
        photoId: showGiftSelector.id,
        giftPaid: gift
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:text-pink-400 hover:bg-white/10 rounded-full p-2"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <Camera className="w-8 h-8 text-pink-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              الألبومات الخاصة
            </h1>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setCurrentUserMode(currentUserMode === 'view' ? 'manage' : 'view')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentUserMode === 'view' ? 'إدارة الألبومات' : 'عرض الألبومات'}
            </Button>
            
            {currentUserMode === 'manage' && (
              <Dialog open={showCreateAlbum} onOpenChange={setShowCreateAlbum}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                    <Camera className="w-4 h-4 mr-2" />
                    إنشاء ألبوم جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-center text-pink-400">إنشاء ألبوم خاص جديد</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>عنوان الألبوم</Label>
                      <Input
                        value={newAlbum.title}
                        onChange={(e) => setNewAlbum({...newAlbum, title: e.target.value})}
                        placeholder="مثال: صوري الخاصة"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    
                    <div>
                      <Label>وصف الألبوم</Label>
                      <Textarea
                        value={newAlbum.description}
                        onChange={(e) => setNewAlbum({...newAlbum, description: e.target.value})}
                        placeholder="وصف مختصر للألبوم..."
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    
                    <div>
                      <Label>نوع الألبوم</Label>
                      <Select 
                        value={newAlbum.albumType} 
                        onValueChange={(value: 'locked_album' | 'individual_photos') => 
                          setNewAlbum({...newAlbum, albumType: value})
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="locked_album">ألبوم مقفل بالكامل</SelectItem>
                          <SelectItem value="individual_photos">صور منفردة مدفوعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>سعر الدخول</Label>
                      <Input
                        type="number"
                        value={newAlbum.accessPrice}
                        onChange={(e) => setNewAlbum({...newAlbum, accessPrice: parseInt(e.target.value)})}
                        placeholder="100"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    
                    <div>
                      <Label>الهدية المطلوبة</Label>
                      <Select 
                        value={giftOptions.findIndex(g => g.name === newAlbum.giftRequired.name).toString()}
                        onValueChange={(value) => setNewAlbum({...newAlbum, giftRequired: giftOptions[parseInt(value)]})}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {giftOptions.map((gift, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {gift.icon} {gift.name} - {gift.price} نقطة
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleCreateAlbum}
                      disabled={createAlbumMutation.isPending}
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    >
                      {createAlbumMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الألبوم'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Albums Grid */}
        {!selectedAlbum ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album: Album) => (
              <Card key={album.id} className="bg-gray-900/80 border-gray-700 hover:border-pink-500 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-pink-400">{album.title}</h3>
                    <div className="flex items-center space-x-2">
                      {album.albumType === 'locked_album' ? 
                        <Lock className="w-5 h-5 text-yellow-400" /> : 
                        <Image className="w-5 h-5 text-blue-400" />
                      }
                      {!album.hasAccess && !album.isOwner && (
                        <Gift className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{album.description}</p>
                  
                  <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
                    <span>{album.totalPhotos} صورة</span>
                    <span>{album.totalViews} مشاهدة</span>
                    <span>{album.accessPrice} نقطة</span>
                  </div>
                  
                  {album.isOwner ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => setSelectedAlbum(album)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        إدارة الألبوم
                      </Button>
                      {currentUserMode === 'manage' && (
                        <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => setSelectedAlbum(album)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              إضافة صور
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      )}
                    </div>
                  ) : album.hasAccess ? (
                    <Button 
                      onClick={() => setSelectedAlbum(album)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      مشاهدة الألبوم
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setShowGiftSelector({ type: 'album', id: album.id })}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      شراء الألبوم ({album.accessPrice} نقطة)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {albums.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-xl text-gray-400">لا توجد ألبومات خاصة بعد</p>
                <p className="text-gray-500 mt-2">أنشئ أول ألبوم خاص بك!</p>
              </div>
            )}
          </div>
        ) : (
          /* Album Photos View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <Button 
                onClick={() => setSelectedAlbum(null)}
                className="bg-gray-700 hover:bg-gray-600"
              >
                العودة للألبومات
              </Button>
              
              <h2 className="text-2xl font-bold text-pink-400">{selectedAlbum.title}</h2>
              
              {selectedAlbum.isOwner && currentUserMode === 'manage' && (
                <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Camera className="w-4 h-4 mr-2" />
                      إضافة صورة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl text-center text-green-400">إضافة صورة جديدة</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>رابط الصورة</Label>
                        <Input
                          value={newPhoto.imageUrl}
                          onChange={(e) => setNewPhoto({...newPhoto, imageUrl: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label>تعليق على الصورة</Label>
                        <Textarea
                          value={newPhoto.caption}
                          onChange={(e) => setNewPhoto({...newPhoto, caption: e.target.value})}
                          placeholder="تعليق مختصر..."
                          className="bg-gray-800 border-gray-600"
                        />
                      </div>
                      
                      {selectedAlbum.albumType === 'individual_photos' && (
                        <>
                          <div>
                            <Label>سعر الصورة</Label>
                            <Input
                              type="number"
                              value={newPhoto.accessPrice}
                              onChange={(e) => setNewPhoto({...newPhoto, accessPrice: parseInt(e.target.value)})}
                              placeholder="50"
                              className="bg-gray-800 border-gray-600"
                            />
                          </div>
                          
                          <div>
                            <Label>الهدية المطلوبة</Label>
                            <Select 
                              value={giftOptions.findIndex(g => g.name === newPhoto.giftRequired.name).toString()}
                              onValueChange={(value) => setNewPhoto({...newPhoto, giftRequired: giftOptions[parseInt(value)]})}
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                {giftOptions.map((gift, index) => (
                                  <SelectItem key={index} value={index.toString()}>
                                    {gift.icon} {gift.name} - {gift.price} نقطة
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      
                      <Button 
                        onClick={handleAddPhoto}
                        disabled={addPhotoMutation.isPending}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {addPhotoMutation.isPending ? 'جاري الإضافة...' : 'إضافة الصورة'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {/* Photos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {albumDetails?.photos?.map((photo: Photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                    {photo.hasAccess || selectedAlbum.isOwner ? (
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center">
                          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">صورة مقفلة</p>
                          <p className="text-yellow-400 text-xs">{photo.accessPrice} نقطة</p>
                        </div>
                      </div>
                    )}
                    
                    {photo.requiresPayment && !selectedAlbum.isOwner && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => setShowGiftSelector({ type: 'photo', id: photo.id })}
                          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          شراء ({photo.accessPrice})
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {photo.caption && (photo.hasAccess || selectedAlbum.isOwner) && (
                    <p className="text-gray-300 text-sm mt-2 px-2">{photo.caption}</p>
                  )}
                </div>
              ))}
              
              {(!albumDetails?.photos || albumDetails.photos.length === 0) && (
                <div className="col-span-full text-center py-12">
                  <Image className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">لا توجد صور في هذا الألبوم بعد</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gift Selection Dialog */}
        <Dialog open={!!showGiftSelector} onOpenChange={() => setShowGiftSelector(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-center text-yellow-400">
                اختر الهدية للشراء
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              {giftOptions.map((gift, index) => (
                <Button
                  key={index}
                  onClick={() => showGiftSelector?.type === 'album' ? handlePurchaseAlbum(gift) : handlePurchasePhoto(gift)}
                  className="h-20 flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={purchaseAlbumMutation.isPending || purchasePhotoMutation.isPending}
                >
                  <span className="text-2xl mb-1">{gift.icon}</span>
                  <span className="text-xs">{gift.name}</span>
                  <span className="text-xs text-yellow-300">{gift.price} نقطة</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}