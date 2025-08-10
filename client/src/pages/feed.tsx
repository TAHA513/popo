import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  // Fetch live streams
  const { data: streams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 3000, // كل 3 ثواني
    staleTime: 0,
  });

  // Fetch public memories/posts
  const { data: memories = [], isLoading: memoriesLoading, error: memoriesError } = useQuery({
    queryKey: ['/api/memories/public'],
    refetchInterval: 15000, // كل 15 ثانية - متوازن
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const typedStreams = (streams as Stream[]);
  const typedMemories = (memories as any[]);
  
  // Debug info shows data loading status
  React.useEffect(() => {
    console.log('🔍 Feed Status:', {
      memoriesCount: typedMemories.length,
      isLoading: memoriesLoading,
      hasData: typedMemories.length > 0
    });
  }, [typedMemories.length, memoriesLoading]);

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

  const isLoading = streamsLoading || memoriesLoading;

  // Show current loading state
  if (memoriesLoading) {
    console.log('⏳ Still loading memories...');
  } else if (typedMemories.length > 0) {
    console.log(`✅ ${typedMemories.length} memories loaded successfully`);
  } else {
    console.log('⚠️ No memories found');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold mb-4 text-gray-800">آخر المنشورات</h2>
          
          {typedMemories.length === 0 ? (
            <Card className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منشورات حالياً</h3>
              <p className="text-gray-500 mb-6">كن أول من يشارك محتوى!</p>
              <Button onClick={() => window.location.href = '/create-memory'}>
                إنشاء منشور جديد
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedMemories.map((memory, index) => (
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
                                    loading="lazy"
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
                        {(() => {
                          const mediaUrl = Array.isArray(memory.mediaUrls) ? memory.mediaUrls[0] : memory.mediaUrls;
                          const isVideo = mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov') || memory.type === 'video');
                          
                          console.log('🖼️ Rendering media:', { 
                            mediaUrl, 
                            isVideo, 
                            type: memory.type,
                            thumbnailUrl: memory.thumbnailUrl 
                          });
                          
                          if (isVideo) {
                            return (
                              <video
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                poster={memory.thumbnailUrl}
                                onMouseEnter={(e) => e.currentTarget.play()}
                                onMouseLeave={(e) => e.currentTarget.pause()}
                                onCanPlay={(e) => {
                                  e.currentTarget.currentTime = 0.01;
                                }}
                                onLoadedData={() => {
                                  console.log('✅ Video loaded successfully:', mediaUrl);
                                }}
                                onError={(e) => {
                                  console.error('❌ Video load failed:', mediaUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            );
                          } else {
                            // For images, use first mediaUrl directly
                            const imageUrl = memory.thumbnailUrl || mediaUrl;
                            return (
                              <img 
                                src={imageUrl}
                                alt={memory.caption || 'منشور'} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                                onLoad={() => {
                                  console.log('✅ Image loaded successfully:', imageUrl);
                                }}
                                onError={(e) => {
                                  console.error('❌ Image load failed:', imageUrl);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            );
                          }
                        })()}
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
              ))}
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