import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Lock, 
  Unlock, 
  Plus, 
  Image, 
  Video, 
  Upload,
  Star,
  Eye,
  Crown,
  Gift,
  MessageSquare,
  Heart
} from "lucide-react";

interface LockedAlbum {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  coverImage?: string;
  createdAt: string;
  ownerUsername: string;
  ownerProfileImage?: string;
  isPurchased?: boolean;
  isOwner?: boolean;
}

interface AlbumContent {
  id: string;
  albumId: string;
  type: 'image' | 'video' | 'audio' | 'text';
  url?: string;
  content?: string;
  caption?: string;
  order: number;
}

const LockedAlbums: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<LockedAlbum[]>([]);
  const [myAlbums, setMyAlbums] = useState<LockedAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<LockedAlbum | null>(null);
  const [albumContent, setAlbumContent] = useState<AlbumContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-albums' | 'requests'>('browse');
  
  // Create album form
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    price: 100,
  });

  // Content request form
  const [contentRequest, setContentRequest] = useState({
    type: 'image' as 'image' | 'video' | 'audio' | 'text',
    description: '',
    offeredPrice: 50,
  });

  useEffect(() => {
    loadPublicAlbums();
    if (user) {
      loadMyAlbums();
    }
  }, [user]);

  const loadPublicAlbums = async () => {
    try {
      const response = await apiRequest('/api/albums/public', 'GET');
      setAlbums(response.map((album: any) => ({
        ...album,
        isOwner: user?.id === album.ownerId,
        isPurchased: false // Will be updated when checking purchases
      })));
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const loadMyAlbums = async () => {
    try {
      const response = await apiRequest('/api/albums/my', 'GET');
      setMyAlbums(response);
    } catch (error) {
      console.error('Error loading my albums:', error);
    }
  };

  const createAlbum = async () => {
    if (!newAlbum.title.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان الألبوم",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/api/albums/create', 'POST', newAlbum);
      toast({
        title: "نجح",
        description: "تم إنشاء الألبوم المحمي بنجاح",
      });
      setNewAlbum({ title: '', description: '', price: 100 });
      loadMyAlbums();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الألبوم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const purchaseAlbum = async (album: LockedAlbum) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/api/albums/purchase', 'POST', { albumId: album.id });
      toast({
        title: "نجح",
        description: `تم شراء ألبوم "${album.title}" بنجاح`,
      });
      loadPublicAlbums();
      loadAlbumContent(album.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في شراء الألبوم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumContent = async (albumId: string) => {
    try {
      const response = await apiRequest(`/api/albums/${albumId}/content`, 'GET');
      setAlbumContent(response);
    } catch (error) {
      console.error('Error loading album content:', error);
    }
  };

  const requestPrivateContent = async (toUserId: string) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!contentRequest.description.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال وصف المحتوى المطلوب",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/api/content-requests/create', 'POST', {
        ...contentRequest,
        toUserId,
      });
      toast({
        title: "نجح",
        description: "تم إرسال طلب المحتوى الخاص بنجاح",
      });
      setContentRequest({ type: 'image', description: '', offeredPrice: 50 });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال الطلب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            🔒 الألبومات المحمية
          </h1>
          <p className="text-gray-300">أشتري واطلب محتوى خاص حصري بالنقاط</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800 rounded-lg p-1 flex">
            <Button
              variant={activeTab === 'browse' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('browse')}
              className={activeTab === 'browse' ? 'bg-purple-600' : ''}
            >
              <Eye className="w-4 h-4 mr-2" />
              تصفح الألبومات
            </Button>
            <Button
              variant={activeTab === 'my-albums' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('my-albums')}
              className={activeTab === 'my-albums' ? 'bg-purple-600' : ''}
            >
              <Crown className="w-4 h-4 mr-2" />
              ألبوماتي
            </Button>
            <Button
              variant={activeTab === 'requests' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('requests')}
              className={activeTab === 'requests' ? 'bg-purple-600' : ''}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              طلبات المحتوى
            </Button>
          </div>
        </div>

        {/* Browse Albums */}
        {activeTab === 'browse' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-pink-400">الألبومات المتاحة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <Card key={album.id} className="bg-slate-800 border-purple-700 overflow-hidden">
                  {album.coverImage && (
                    <img 
                      src={album.coverImage} 
                      alt={album.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      <img 
                        src={album.ownerProfileImage || '/default-avatar.png'} 
                        alt={album.ownerUsername}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <span className="text-gray-300">{album.ownerUsername}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 text-white">{album.title}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{album.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-yellow-600 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        {album.price} نقطة
                      </Badge>
                      
                      {album.isOwner ? (
                        <Badge className="bg-green-600">ألبومي</Badge>
                      ) : album.isPurchased ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="default" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedAlbum(album);
                                loadAlbumContent(album.id);
                              }}
                            >
                              <Unlock className="w-4 h-4 mr-2" />
                              مفتوح
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-800 text-white max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{selectedAlbum?.title}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                              {albumContent.map((content) => (
                                <div key={content.id} className="bg-slate-700 rounded-lg p-4">
                                  {content.type === 'image' && content.url && (
                                    <img 
                                      src={content.url} 
                                      alt={content.caption}
                                      className="w-full h-48 object-cover rounded"
                                    />
                                  )}
                                  {content.type === 'video' && content.url && (
                                    <video 
                                      src={content.url}
                                      controls
                                      className="w-full h-48 object-cover rounded"
                                    />
                                  )}
                                  {content.type === 'text' && (
                                    <p className="text-white">{content.content}</p>
                                  )}
                                  {content.caption && (
                                    <p className="text-gray-400 mt-2 text-sm">{content.caption}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="flex space-x-2 space-x-reverse">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="border-pink-600 text-pink-400">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                طلب خاص
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 text-white">
                              <DialogHeader>
                                <DialogTitle>طلب محتوى خاص من {album.ownerUsername}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select value={contentRequest.type} onValueChange={(value: any) => setContentRequest(prev => ({ ...prev, type: value }))}>
                                  <SelectTrigger className="bg-slate-700 border-slate-600">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-700 border-slate-600">
                                    <SelectItem value="image">صورة 📸</SelectItem>
                                    <SelectItem value="video">فيديو 📹</SelectItem>
                                    <SelectItem value="audio">صوت 🎵</SelectItem>
                                    <SelectItem value="text">رسالة نصية 💬</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Textarea
                                  placeholder="وصف المحتوى المطلوب..."
                                  value={contentRequest.description}
                                  onChange={(e) => setContentRequest(prev => ({ ...prev, description: e.target.value }))}
                                  className="bg-slate-700 border-slate-600"
                                />
                                
                                <Input
                                  type="number"
                                  placeholder="النقاط المعروضة"
                                  value={contentRequest.offeredPrice}
                                  onChange={(e) => setContentRequest(prev => ({ ...prev, offeredPrice: parseInt(e.target.value) || 0 }))}
                                  className="bg-slate-700 border-slate-600"
                                />
                                
                                <Button 
                                  onClick={() => requestPrivateContent(album.ownerId)}
                                  disabled={loading}
                                  className="w-full bg-pink-600 hover:bg-pink-700"
                                >
                                  <Gift className="w-4 h-4 mr-2" />
                                  إرسال الطلب
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            onClick={() => purchaseAlbum(album)}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            شراء
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Albums */}
        {activeTab === 'my-albums' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-pink-400">ألبوماتي المحمية</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    إنشاء ألبوم جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle>إنشاء ألبوم محمي جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="عنوان الألبوم"
                      value={newAlbum.title}
                      onChange={(e) => setNewAlbum(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Textarea
                      placeholder="وصف الألبوم"
                      value={newAlbum.description}
                      onChange={(e) => setNewAlbum(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Input
                      type="number"
                      placeholder="السعر بالنقاط"
                      value={newAlbum.price}
                      onChange={(e) => setNewAlbum(prev => ({ ...prev, price: parseInt(e.target.value) || 100 }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Button 
                      onClick={createAlbum}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إنشاء الألبوم
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAlbums.map((album) => (
                <Card key={album.id} className="bg-slate-800 border-purple-700">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white">{album.title}</h3>
                    <p className="text-gray-400 mb-4">{album.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-yellow-600">
                        <Star className="w-3 h-3 mr-1" />
                        {album.price} نقطة
                      </Badge>
                      <Button 
                        variant="outline" 
                        className="border-green-600 text-green-400"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        إضافة محتوى
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Content Requests */}
        {activeTab === 'requests' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-pink-400">طلبات المحتوى الخاص</h2>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">ستظهر هنا طلبات المحتوى الخاص</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LockedAlbums;