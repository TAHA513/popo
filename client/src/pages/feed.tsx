import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { CachedImage } from "@/hooks/useImageWithCache";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Play, Video, Heart, MessageCircle, Share2, Gift, User, Bookmark } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { EnhancedGiftModal } from "@/components/enhanced-gift-modal";
import { Stream } from "@/types";
import { Link, useLocation } from "wouter";

export default function Feed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Gift panel state
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  // Fetch live streams - محسن للأداء
  const { data: streams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 10000, // كل 10 ثواني - أقل استهلاكاً
    staleTime: 3000, // 3 ثواني - تخزين مؤقت أسرع
    refetchOnMount: true, // تحميل البث المباشر عند فتح الصفحة
    refetchOnWindowFocus: false, // تجنب إعادة التحميل عند التركيز
  });

  // Fetch public memories/posts - محسن للأداء العالي
  const { data: memories = [], isLoading: memoriesLoading, error: memoriesError } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 60000, // كل دقيقة - توفير الشبكة
    staleTime: 2000, // ثانيتان فقط - تحديث سريع
    refetchOnMount: true, // تحميل فوري
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // إعادة التحميل عند الاتصال
    retry: 3, // إعادة المحاولة 3 مرات
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const typedStreams = (streams as Stream[]);
  const typedMemories = (memories as any[]);
  
  // ⚠️ فلتر جذري نهائي: استبعاد كامل لجميع الفيديوهات من المنشورات
  const imageOnlyMemories = typedMemories.filter(memory => {
    console.log(`🔍 فحص منشور ${memory.id}:`, {
      type: memory.type,
      firstUrl: memory.mediaUrls?.[0]?.substring(0, 80),
      urlsCount: memory.mediaUrls?.length
    });
    
    // ❌ استبعاد فوري: أي نوع فيديو
    if (memory.type === 'video' || memory.type === 'live' || memory.type === 'stream') {
      console.log(`🚫 BLOCKED - Video Type: ${memory.id} (${memory.type})`);
      return false;
    }
    
    // ❌ استبعاد فوري: أي URL يحتوي على إشارات فيديو
    if (memory.mediaUrls?.length > 0) {
      for (const url of memory.mediaUrls) {
        const lowerUrl = url.toLowerCase();
        
        // فحص امتدادات الفيديو
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp'];
        if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
          console.log(`🚫 BLOCKED - Video Extension: ${memory.id} (${url.substring(0, 50)}...)`);
          return false;
        }
        
        // فحص كلمات دلالية على الفيديو
        const videoKeywords = ['(720p)', '(480p)', '_hd', 'video', 'mp4', 'webm'];
        const foundKeyword = videoKeywords.find(keyword => lowerUrl.includes(keyword));
        if (foundKeyword) {
          console.log(`🚫 BLOCKED - Video Keyword: ${memory.id} (${foundKeyword})`);
          return false;
        }
      }
    }
    
    // ✅ قبول فقط إذا كان صورة صريحة
    if (memory.type === 'image') {
      console.log(`✅ ACCEPTED - Image Type: ${memory.id}`);
      return true;
    }
    
    // ✅ قبول إذا كان URL يحتوي على امتدادات صور
    if (memory.mediaUrls?.length > 0) {
      const hasImageExtension = memory.mediaUrls.some((url: string) => {
        const lowerUrl = url.toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some(ext => 
          lowerUrl.includes(ext)
        );
      });
      
      if (hasImageExtension) {
        console.log(`✅ ACCEPTED - Image Extension: ${memory.id}`);
        return true;
      }
    }
    
    // ❌ رفض كل شيء آخر
    console.log(`🚫 REJECTED - Unknown: ${memory.id} (type: ${memory.type})`);
    return false;
  });
  
  // تسجيل النتائج النهائية
  console.log('📊 نتائج الفلترة النهائية:');
  console.log('🔍 إجمالي المنشورات:', typedMemories.length);
  console.log('📷 الصور المقبولة:', imageOnlyMemories.length);
  console.log('🚫 المنشورات المرفوضة:', typedMemories.length - imageOnlyMemories.length);
  console.log('📷 الصور النهائية:', imageOnlyMemories.map(m => ({id: m.id, type: m.type})));

  // Pre-fetch data and optimize for instant display
  useEffect(() => {
    // Prefetch posts data
    queryClient.prefetchQuery({
      queryKey: ['/api/memories/public'],
      staleTime: 1000,
    });
    
    // Prefetch streams data
    queryClient.prefetchQuery({
      queryKey: ['/api/streams/public'],
      staleTime: 1000,
    });
    
    // Preload first few images for instant display
    const preloadImages = async () => {
      if (imageOnlyMemories.length > 0) {
        const firstFiveMemories = imageOnlyMemories.slice(0, 5);
        firstFiveMemories.forEach(memory => {
          if (memory.thumbnailUrl) {
            const img = new Image();
            img.src = memory.thumbnailUrl;
          }
        });
      }
    };
    
    preloadImages();
  }, [queryClient, imageOnlyMemories]);

  const handleJoinStream = (streamId: number) => {
    window.location.href = `/stream/${streamId}`;
  };

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return await apiRequest(`/api/users/${userId}/follow`, 'POST');
    },
    onSuccess: (data) => {
      toast({
        title: data.following ? "تمت المتابعة!" : "تم إلغاء المتابعة",
        description: data.following ? "أضيف المستخدم لقائمة الأصدقاء" : "تم إزالة المستخدم من الأصدقاء",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    },
    onError: () => {
      toast({
        title: "خطأ في المتابعة",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

  // Memory interaction mutation
  const interactionMutation = useMutation({
    mutationFn: async ({ memoryId, type }: { memoryId: number; type: string }) => {
      return await apiRequest('POST', `/api/memories/${memoryId}/interact`, { type });
    },
    onSuccess: (_, { type }) => {
      const messages = {
        like: "تم الإعجاب! ❤️",
        comment: "تم فتح التعليقات",
        share: "تم نسخ الرابط للمشاركة",
      };
      
      toast({
        title: messages[type as keyof typeof messages] || "تم التفاعل",
        description: "شكراً لتفاعلك مع المحتوى",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
    },
    onError: () => {
      toast({
        title: "خطأ في التفاعل",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

  const handleFollow = (userId: string) => {
    followMutation.mutate({ userId });
  };

  const handleLike = (memoryId: number) => {
    interactionMutation.mutate({ memoryId, type: 'like' });
  };

  const handleComment = (memoryId: number) => {
    interactionMutation.mutate({ memoryId, type: 'comment' });
  };

  const handleShare = (memoryId: number) => {
    console.log('Share button clicked for memory ID:', memoryId);
    navigator.clipboard?.writeText(`${window.location.origin}/memory/${memoryId}`);
    interactionMutation.mutate({ memoryId, type: 'share' });
  };

  // تم استبدال sendGiftMutation بـ EnhancedGiftModal الذي يدير إرسال الهدايا بنفسه

  const handleGiftClick = (memory: any) => {
    console.log('🎁 Gift button clicked for memory:', memory);
    console.log('🎁 Memory ID:', memory.id);
    
    const recipient = {
      id: memory.authorId,
      username: memory.author?.username,
      profileImageUrl: memory.author?.profileImageUrl,
      memoryId: memory.id // إضافة memoryId للتعليق التلقائي
    };
    
    console.log('🎁 Setting recipient with memoryId:', recipient);
    setSelectedRecipient(recipient);
    
    console.log('🎁 Opening gift panel...');
    setShowGiftPanel(true);
  };

  // إضافة دالة لفتح التعليقات
  const handleCommentsClick = (e: React.MouseEvent, memoryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('💬 Comments button clicked for memory:', memoryId);
    // التنقل إلى صفحة المنشور
    setLocation(`/memory/${memoryId}`);
  };

  // لا نحتاج handleSendGift بعد الآن - EnhancedGiftModal يتعامل مع إرسال الهدايا مباشرة

  // Delete memory mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ memoryId }: { memoryId: number }) => {
      return await apiRequest(`/api/memories/${memoryId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف المنشور بنجاح",
      });
      // إعادة تحميل قائمة المنشورات
      queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memories/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المنشور",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMemory = (memoryId: number) => {
    deleteMutation.mutate({ memoryId });
  };

  // Optimized loading logic - عرض المحتوى فوراً مع تحسين الأداء
  const showLoadingSpinner = memoriesLoading && typedMemories.length === 0 && !memoriesError;
  const hasContent = imageOnlyMemories.length > 0 || typedStreams.length > 0;
  const isInitialLoad = memoriesLoading && typedMemories.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Active Live Streams - Full Width Cards */}
        {typedStreams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">بث مباشر الآن 🔴</h2>
            <div className="space-y-4">
              {typedStreams.map((stream) => (
                <Card 
                  key={stream.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleJoinStream(stream.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Stream Preview */}
                      <div className="relative md:w-1/3 h-64 md:h-auto bg-gradient-to-br from-purple-500 to-pink-500">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-16 h-16 text-white" />
                        </div>
                        <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                          مباشر
                        </Badge>
                        <div className="absolute bottom-4 left-4 flex items-center text-white">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{stream.viewerCount || 0}</span>
                        </div>
                      </div>
                      
                      {/* Stream Info */}
                      <div className="flex-1 p-6">
                        <h3 className="text-xl font-semibold mb-2">{stream.title}</h3>
                        <p className="text-gray-600 mb-4">{stream.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">البث #{stream.id}</span>
                            <Badge variant="outline">{stream.category}</Badge>
                          </div>
                          
                          <Button 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          >
                            انضم الآن
                          </Button>
                        </div>
                        
                        {/* Stream Stats */}
                        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Gift className="w-4 h-4 mr-1 text-pink-500" />
                            {stream.totalGifts} هدية
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-blue-500" />
                            {stream.viewerCount || 0} مشاهد
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Posts/Memories Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">آخر الصور 📷</h2>
            {memoriesLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 ml-2"></div>
                جاري التحديث...
              </div>
            )}
          </div>
          
          {showLoadingSpinner ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-300 rounded mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : memoriesError ? (
            <Card className="p-12 text-center border-red-200 bg-red-50">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-700 mb-2">مشكلة في تحميل المنشورات</h3>
              <p className="text-red-600 mb-6">تحقق من الاتصال بالإنترنت وأعد المحاولة</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                إعادة المحاولة
              </Button>
            </Card>
          ) : imageOnlyMemories.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 text-gray-400 mx-auto mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد صور حالياً</h3>
              <p className="text-gray-500 mb-6">هذه الصفحة تعرض الصور فقط. شارك صورة جديدة!</p>
              <Button onClick={() => window.location.href = '/create-memory'}>
                رفع صورة جديدة
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageOnlyMemories.length > 0 ? imageOnlyMemories.map((memory) => (
                <Card key={memory.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Link href={`/user/${memory.authorId}`}>
                          <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full overflow-hidden ring-2 ring-purple-100 group-hover:ring-purple-200 transition-all">
                                {memory.author?.profileImageUrl ? (
                                  <img 
                                    src={memory.author.profileImageUrl} 
                                    alt={memory.author.username} 
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <User className={`w-6 h-6 text-white m-3 ${memory.author?.profileImageUrl ? 'hidden' : ''}`} />
                              </div>
                              {/* Online Status Indicator - TikTok Style */}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                                {memory.author?.username || `مستخدم #${memory.authorId?.slice(0, 6)}`}
                                {/* Verification Badge */}
                                <span className="text-blue-500">✓</span>
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                نشط الآن • منذ دقيقتين
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {memory.authorId !== user?.id && (
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-1 text-xs font-medium"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollow(memory.authorId);
                            }}
                          >
                            متابعة
                          </Button>
                        )}
                        {memory.authorId === user?.id ? (
                          <button 
                            className="p-2 text-red-600 hover:text-red-800 transition-colors bg-red-100 hover:bg-red-200 rounded-lg border border-red-300"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🗑️ Delete button clicked for memory:', memory.id);
                              if (confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
                                handleDeleteMemory(memory.id);
                              }
                            }}
                            title="حذف المنشور"
                          >
                            🗑️
                          </button>
                        ) : (
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-4 pb-3">
                    {/* Media Preview */}
                    {memory.mediaUrls?.length > 0 && (
                      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl aspect-square mb-3 sm:mb-4 overflow-hidden group cursor-pointer">
                        {memory.type === 'image' && memory.thumbnailUrl ? (
                          <img 
                            src={memory.thumbnailUrl} 
                            alt={memory.caption || 'منشور'} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            style={{ 
                              backgroundColor: '#f3f4f6',
                              minHeight: '200px'
                            }}
                          />

                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-16 h-16 text-gray-400 mx-auto mb-2">📷</div>
                              <p className="text-sm text-gray-500">صورة</p>
                            </div>
                          </div>
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Interaction Buttons - OUTSIDE CardContent to avoid Link conflicts */}
                  <div className="px-4 pb-4 relative z-50" style={{ pointerEvents: 'auto' }}>
                    <div className="flex items-center justify-between py-2" style={{ position: 'relative', zIndex: 100 }}>
                      <div className="flex items-center space-x-3 md:space-x-4 rtl:space-x-reverse">
                        <button 
                          className="flex items-center space-x-1 rtl:space-x-reverse p-1.5 md:p-2 -m-2 group"
                          onClick={() => {
                            console.log('Like button clicked for memory:', memory.id);
                            handleLike(memory.id);
                          }}
                        >
                          <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-red-500 group-active:scale-125 transition-all duration-200" />
                          <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-red-500">
                            {memory.likeCount || 0}
                          </span>
                        </button>
                        
                        <div 
                          className="flex items-center space-x-1 rtl:space-x-reverse p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer relative"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('💬 Comments DIV clicked for memory:', memory.id);
                            console.log('💬 Navigating to:', `/comments/${memory.id}`);
                            
                            // جرب طرق متعددة للتنقل
                            try {
                              // الطريقة الأولى
                              window.location.assign(`/comments/${memory.id}`);
                            } catch (error) {
                              console.error('Navigation error:', error);
                              // الطريقة الثانية
                              window.location.href = `/comments/${memory.id}`;
                            }
                          }}
                          style={{ 
                            pointerEvents: 'auto',
                            zIndex: 9999,
                            position: 'relative',
                            touchAction: 'manipulation'
                          }}
                        >
                          <MessageCircle className="w-4 h-4 text-blue-600 pointer-events-none" />
                          <span className="text-xs font-medium text-blue-600 pointer-events-none">تعليق</span>
                        </div>
                        
                        <div 
                          className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer relative"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Share DIV clicked for memory:', memory.id);
                            
                            // Try native mobile share first
                            if (navigator.share) {
                              navigator.share({
                                title: `منشور من ${memory.author?.username || 'LaaBoBo'}`,
                                text: memory.caption || 'شاهد هذا المنشور الرائع!',
                                url: `${window.location.origin}/memory/${memory.id}`
                              }).then(() => {
                                console.log('Share successful');
                                handleShare(memory.id);
                              }).catch((error) => {
                                console.error('Share failed:', error);
                                // Fallback to clipboard
                                navigator.clipboard?.writeText(`${window.location.origin}/memory/${memory.id}`);
                                alert('تم نسخ الرابط للحافظة!');
                                handleShare(memory.id);
                              });
                            } else {
                              // Fallback to clipboard
                              navigator.clipboard?.writeText(`${window.location.origin}/memory/${memory.id}`);
                              alert('تم نسخ الرابط للحافظة!');
                              handleShare(memory.id);
                            }
                          }}
                          style={{ 
                            pointerEvents: 'auto',
                            zIndex: 9999,
                            position: 'relative',
                            touchAction: 'manipulation'
                          }}
                        >
                          <Share2 className="w-4 h-4 text-green-600 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
                        <button 
                          className="p-1.5 md:p-2 -m-2 group"
                          onClick={() => {
                            console.log('Gift button clicked, calling handleGiftClick...');
                            handleGiftClick(memory);
                          }}
                        >
                          <Gift className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-purple-500 transition-colors duration-200" />
                        </button>
                        <button className="p-1.5 md:p-2 -m-2 group">
                          <Bookmark className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-yellow-500 transition-colors duration-200" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Like count and comments preview */}
                    <div className="space-y-1 text-sm">
                      {(memory.likeCount && memory.likeCount > 0) && (
                        <p className="font-semibold text-gray-900">
                          {memory.likeCount} إعجاب
                        </p>
                      )}
                      {memory.caption && (
                        <div className="flex items-start space-x-2 rtl:space-x-reverse">
                          <span className="font-semibold text-gray-900">{memory.author?.username}</span>
                          <span className="text-gray-700">{memory.caption}</span>
                        </div>
                      )}
                      {/* Enhanced Date Display - Instagram/TikTok Style */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <p className="text-gray-500 text-xs flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {(() => {
                            const now = new Date();
                            const postDate = new Date(memory.createdAt);
                            const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
                            const diffInDays = Math.floor(diffInHours / 24);
                            
                            if (diffInHours < 1) return 'منذ دقائق';
                            if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
                            if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
                            return postDate.toLocaleDateString('ar-SA', { 
                              day: 'numeric', 
                              month: 'short',
                              year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                            });
                          })()}
                        </p>
                        
                        {/* Views/Engagement Indicator */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {memory.viewCount || Math.floor(Math.random() * 500) + 50}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {memory.shareCount || Math.floor(Math.random() * 50) + 5}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="col-span-full flex items-center justify-center p-8">
                  <p className="text-gray-500">لا توجد صور لعرضها</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation />
      
      {/* Enhanced Gift Modal */}
      <EnhancedGiftModal
        isOpen={showGiftPanel}
        onClose={() => {
          console.log('EnhancedGiftModal onClose called');
          setShowGiftPanel(false);
          setSelectedRecipient(null);
        }}
        receiverId={selectedRecipient?.id || ''}
        receiverName={selectedRecipient?.username || 'مستخدم'}
        memoryId={selectedRecipient?.memoryId}
        onGiftSent={() => {
          console.log('🎁 Gift sent successfully, clearing state');
          setShowGiftPanel(false);
          setSelectedRecipient(null);
          // تحديث التعليقات بعد إرسال الهدية
          if (selectedRecipient?.memoryId) {
            queryClient.invalidateQueries({ queryKey: [`/api/memories/${selectedRecipient.memoryId}/comments`] });
          }
        }}
      />
    </div>
  );
}