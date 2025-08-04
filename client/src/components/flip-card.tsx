import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RealTimeTimestamp } from "./real-time-timestamp";
import { OnlineStatus } from "./online-status";
import SupporterBadge from "./SupporterBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoOptimizer } from "@/utils/video-optimizer";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User,
  Image,
  Radio,
  Star,
  Crown,
  PlayCircle,
  Users,
  Clock
} from "lucide-react";

interface FlipCardProps {
  content: any;
  type: 'video' | 'image' | 'live' | 'featured';
  onAction: (action: string) => void;
  onLike?: (id: string) => void;
  isLiked?: boolean;
}

export default function FlipCard({ content, type, onAction, onLike, isLiked = false }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [location, setLocation] = useLocation();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [currentLikeCount, setCurrentLikeCount] = useState(content.likeCount || 0);
  const [userLiked, setUserLiked] = useState(isLiked);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showQuickGifts, setShowQuickGifts] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user to get points
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => apiRequest('GET', '/api/auth/user').then(res => res.json())
  });

  // Fetch gift characters for quick selection
  const { data: giftCharacters = [] } = useQuery({
    queryKey: ['/api/gifts/characters'],
    queryFn: () => apiRequest('GET', '/api/gifts/characters').then(res => res.json()),
    enabled: showQuickGifts
  });

  // Quick gift icons
  const giftIcons: { [key: string]: JSX.Element } = {
    'BoBo Love': <span className="text-2xl">💖</span>,
    'Rose': <span className="text-2xl">🌹</span>,
    'Coffee': <span className="text-2xl">☕</span>,
    'Star': <span className="text-2xl">⭐</span>,
    'Crown': <span className="text-2xl">👑</span>,
    'Diamond': <span className="text-2xl">💎</span>,
    'Fire': <span className="text-2xl">🔥</span>,
    'Rocket': <span className="text-2xl">🚀</span>,
    'Trophy': <span className="text-2xl">🏆</span>,
    'Galaxy': <span className="text-2xl">🌌</span>,
    'Castle': <span className="text-2xl">🏰</span>,
    'Dragon': <span className="text-2xl">🐉</span>,
    'Unicorn': <span className="text-2xl">🦄</span>
  };

  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (giftData: { giftCharacterId: number; pointCost: number }) => {
      const response = await apiRequest('POST', '/api/gifts/send', {
        giftCharacterId: giftData.giftCharacterId,
        recipientId: content.author?.id || content.authorId,
        postId: content.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🎁 تم إرسال الهدية!",
        description: "تم إرسال الهدية بنجاح وخصم النقاط من حسابك",
      });
      setShowQuickGifts(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'فشل إرسال الهدية';
      toast({
        title: "❌ خطأ في الإرسال",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Handle quick gift send
  const handleQuickGiftSend = (gift: any) => {
    if (!currentUser) {
      toast({
        title: "❌ يجب تسجيل الدخول",
        description: "يجب تسجيل الدخول أولاً لإرسال الهدايا",
        variant: "destructive"
      });
      return;
    }

    if (currentUser.points < gift.pointCost) {
      toast({
        title: "❌ نقاط غير كافية",
        description: `تحتاج ${gift.pointCost} نقطة لإرسال هذه الهدية`,
        variant: "destructive"
      });
      return;
    }

    sendGiftMutation.mutate({
      giftCharacterId: gift.id,
      pointCost: gift.pointCost
    });
  };

  // Check follow status on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!content.author?.id && !content.authorId) return;
      
      try {
        const response = await fetch(`/api/users/${content.author?.id || content.authorId}/follow-status`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [content.author?.id, content.authorId]);

  // Handle follow/unfollow action
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isFollowLoading) return;
    setIsFollowLoading(true);
    
    try {
      const response = await fetch(`/api/users/${content.author?.id || content.authorId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('خطأ في المتابعة:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle like action
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/memories/${content.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserLiked(data.liked);
        if (data.liked) {
          setCurrentLikeCount((prev: number) => prev + 1);
        } else {
          setCurrentLikeCount((prev: number) => prev - 1);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const getCardStyle = () => {
    switch (type) {
      case 'live':
        return {
          front: "bg-gradient-to-br from-red-500 via-pink-500 to-red-600",
          glow: "shadow-red-400/50 shadow-2xl animate-pulse"
        };
      case 'video':
        return {
          front: "bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600",
          glow: "shadow-purple-400/30 shadow-lg"
        };
      case 'featured':
        return {
          front: "bg-gradient-to-br from-yellow-500 via-orange-500 to-yellow-600",
          glow: "shadow-yellow-400/40 shadow-xl"
        };
      default:
        return {
          front: "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600",
          glow: "shadow-purple-400/30 shadow-lg"
        };
    }
  };

  const cardStyle = getCardStyle();

  const renderFrontContent = () => {
    return (
      <div className={`relative w-full h-full ${cardStyle.front} overflow-hidden rounded-xl ${cardStyle.glow}`}>
        {/* Background Media */}
        {content.mediaUrls && content.mediaUrls.length > 0 ? (
          type === 'video' || type === 'live' ? (
            <video
              ref={videoRef}
              src={content.mediaUrls[0]}
              className="w-full h-full object-cover transition-opacity duration-300"
              muted
              loop
              playsInline
              preload="metadata"
              poster={content.thumbnailUrl}
              style={{ opacity: isVideoLoaded ? 1 : 0.7 }}
              onLoadStart={() => {
                // تحسين إعدادات الفيديو
                if (videoRef.current) {
                  VideoOptimizer.optimizeVideoElement(videoRef.current);
                }
              }}
              onLoadedData={() => {
                setIsVideoLoaded(true);
              }}
              onCanPlay={async (e) => {
                const video = e.currentTarget;
                try {
                  await VideoOptimizer.playVideoFast(video);
                } catch (error) {
                  console.log('Video autoplay failed:', error);
                }
              }}
              onError={(e) => {
                console.error('Video load error:', e);
                e.currentTarget.style.display = 'none';
              }}
              onClick={(e) => {
                e.stopPropagation();
                const video = e.currentTarget;
                if (video.paused) {
                  video.play().catch(() => {});
                } else {
                  video.pause();
                }
              }}
            />
          ) : (
            <img
              src={content.mediaUrls[0]}
              alt="منشور"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Show gradient background instead of broken image
                e.currentTarget.style.display = 'none';
              }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-16 h-16 text-white/50" />
          </div>
        )}

        {/* Overlay Gradient - only if there's media */}
        {content.mediaUrls && content.mediaUrls.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        )}

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between">
            {/* Author Info */}
            <Link 
              href={`/user/${content.author?.id || content.authorId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 rtl:space-x-reverse group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 group-hover:border-white transition-colors">
                {content.author?.profileImageUrl ? (
                  <img
                    src={content.author.profileImageUrl}
                    alt={content.author?.firstName || content.author?.username || 'مستخدم'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold text-sm group-hover:text-white/90 transition-colors">
                  {content.author?.username || 'مستخدم LaaBoBo'}
                </span>
                {content.author?.isStreamer && (
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                )}
              </div>
            </Link>

            {/* Views Count */}
            <div className="bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span className="font-medium">{content.viewCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Content Type Indicator */}
        {type === 'live' && (
          <div className="absolute top-12 right-3 z-20">
            <Badge className="bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse border border-white/30">
              🔴 مباشر الآن
            </Badge>
          </div>
        )}

        {/* Center Play Button - Only for Videos */}
        {type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 group-hover:bg-black/10 transition-colors">
            <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/60 hover:scale-110 hover:bg-black/70 transition-all duration-300">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            {/* Video Indicator Badge */}
            <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg animate-pulse">
              ▶️ فيديو
            </div>
          </div>
        )}

        {/* Live Join Button */}
        {type === 'live' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 group-hover:bg-black/10 transition-colors">
            <div className="w-18 h-16 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/60 hover:scale-110 hover:bg-red-600/90 transition-all duration-300 px-4">
              <Radio className="w-6 h-6 text-white mr-2" />
              <span className="text-white font-bold text-sm">انضم</span>
            </div>
          </div>
        )}

        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-3">
          {/* Post Title */}
          {content.title && (
            <h3 className="text-white font-bold text-base mb-2 line-clamp-1 drop-shadow-lg">
              {content.title}
            </h3>
          )}
          
          {/* Post Description */}
          <p className="text-white/90 text-sm line-clamp-2 drop-shadow mb-3">
            {content.caption || content.description || "منشور جديد على LaaBoBo"}
          </p>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button 
                onClick={handleLike}
                className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-red-400 transition-colors"
              >
                <Heart className={`w-4 h-4 ${userLiked ? 'fill-red-400 text-red-400' : ''}`} />
                <span className="text-xs">{currentLikeCount}</span>
              </button>
              
              <button className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-blue-400 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{content.commentCount || 0}</span>
              </button>
              
              <button className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-green-400 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowQuickGifts(!showQuickGifts);
                  }}
                  className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-yellow-400 transition-colors"
                >
                  <Gift className="w-4 h-4" />
                </button>

                {/* Quick Gifts Popup */}
                {showQuickGifts && (
                  <div className="absolute bottom-8 left-0 bg-black/90 backdrop-blur-sm rounded-xl p-3 border border-white/20 z-50 min-w-[200px]">
                    <div className="text-white text-xs mb-2 text-center">هدايا سريعة 🎁</div>
                    <div className="grid grid-cols-3 gap-2">
                      {giftCharacters
                        .filter((gift: any) => gift.pointCost <= 500) // Show only affordable gifts for quick selection
                        .slice(0, 6) // Show only first 6 gifts
                        .map((gift: any) => (
                        <button
                          key={gift.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleQuickGiftSend(gift);
                          }}
                          disabled={sendGiftMutation.isPending || (currentUser && currentUser.points < gift.pointCost)}
                          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                            currentUser && currentUser.points < gift.pointCost 
                              ? 'bg-gray-600/50 cursor-not-allowed opacity-50' 
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <div className="mb-1">
                            {giftIcons[gift.name] || <span className="text-xl">🎁</span>}
                          </div>
                          <span className="text-white text-xs font-bold">{gift.pointCost}</span>
                        </button>
                      ))}
                    </div>
                    
                    {currentUser && (
                      <div className="text-center mt-2 pt-2 border-t border-white/20">
                        <span className="text-white/70 text-xs">نقاطك: {currentUser.points}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowQuickGifts(false)}
                      className="w-full mt-2 text-white/60 hover:text-white text-xs py-1"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Time */}
            <span className="text-white/60 text-xs">
              <RealTimeTimestamp timestamp={content.createdAt} />
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBackContent = () => {
    const author = content.author || {};
    
    return (
      <div className="w-full h-full relative overflow-hidden rounded-xl flip-card-back">
        {/* Beautiful gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-500 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 h-full flex flex-col p-6 text-white" dir="rtl">
          {/* Header with profile */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="relative">
                <Avatar className="w-16 h-16 border-3 border-white/50">
                  <AvatarImage src={author.profileImageUrl} />
                  <AvatarFallback className="bg-white/20 text-white font-bold">
                    {author.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {author.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 rtl:mr-3 ltr:ml-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-white text-right">
                    {author.username || 'مستخدم LaaBoBo'}
                  </h3>
                  {author.supporterLevel > 0 && (
                    <SupporterBadge 
                      level={author.supporterLevel}
                      totalGiftsSent={author.totalGiftsSent || 0}
                      showText={false}
                      className="scale-90"
                    />
                  )}
                  {author.isStreamer && (
                    <Badge className="bg-red-500 text-white text-xs">
                      <Radio className="w-3 h-3 mr-1" />
                      مذيع
                    </Badge>
                  )}
                </div>
                <p className="text-white/80 text-sm text-right">{author.bio || 'عضو في مجتمع LaaBoBo'}</p>
              </div>
            </div>
            
            {/* Follow button */}
            <Button 
              size="sm" 
              className={`border ${isFollowing 
                ? 'bg-green-500/80 hover:bg-red-500/80 border-green-500/30 text-white' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              } transition-all duration-300`}
              onClick={handleFollow}
              disabled={isFollowLoading}
            >
              <Users className="w-4 h-4 ml-1" />
              {isFollowLoading ? 'جاري...' : isFollowing ? 'متابع ✓' : 'متابعة'}
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex justify-around bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="font-bold text-xl text-white">{content.viewCount || 0}</div>
              <div className="text-white/70 text-xs">مشاهدة</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-white">{currentLikeCount}</div>
              <div className="text-white/70 text-xs">إعجاب</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-white">{author.followersCount || 0}</div>
              <div className="text-white/70 text-xs">متابع</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-white">{author.postsCount || 0}</div>
              <div className="text-white/70 text-xs">منشور</div>
            </div>
          </div>

          {/* Content description */}
          <div className="flex-1 mb-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="font-bold text-white mb-2 flex items-center text-right">
                <Star className="w-4 h-4 ml-2 text-yellow-300" />
                {content.title || 'ذكرى جميلة'}
              </h4>
              <p className="text-white/90 text-sm leading-relaxed text-right">
                {content.caption || 'لحظة رائعة تم توثيقها في LaaBoBo - منصة الذكريات والمشاركة الاجتماعية'}
              </p>
              <div className="flex items-center mt-2 text-white/60 text-xs justify-end">
                <RealTimeTimestamp timestamp={content.createdAt} />
                <Clock className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>

          {/* Interactive action buttons */}
          <div className="flex justify-around space-x-2 rtl:space-x-reverse">
            <Button 
              size="sm" 
              className="flex-1 bg-red-500/80 hover:bg-red-500 text-white border-0"
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ml-1 ${userLiked ? 'fill-white' : ''}`} />
              إعجاب
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-blue-500/80 hover:bg-blue-500 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setLocation(`/user/${content.author?.id || content.authorId}`);
              }}
            >
              <User className="w-4 h-4 ml-1" />
              الملف
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-yellow-500/80 hover:bg-yellow-500 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setLocation(`/comments/${content.id}`);
              }}
            >
              <MessageCircle className="w-4 h-4 ml-1" />
              تعليقات
            </Button>
          </div>

          {/* Flip back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 text-white/80 hover:text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsFlipped(false);
            }}
          >
            العودة للعرض
          </Button>
        </div>
      </div>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // تجنب الانقلاب إذا تم النقر على زر أو رابط
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
      return;
    }

    // فتح الفيديوهات والبث المباشر فقط - تجاهل الصور والمحتوى الآخر
    if (type === 'video' || type === 'live') {
      if (type === 'video' && content.id) {
        setLocation(`/video/${content.id}`);
      } else if (type === 'live' && content.id) {
        setLocation(`/stream/${content.id}`);
      }
    } else {
      // للصور والمحتوى الآخر، فقط اقلب البطاقة لعرض التفاصيل
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div 
      className="relative w-full aspect-[4/5] cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className={`w-full h-full transition-transform duration-700 ${isFlipped ? 'transform rotateY-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
        {/* Front side */}
        {!isFlipped && (
          <div className="w-full h-full">
            {renderFrontContent()}
          </div>
        )}
        
        {/* Back side */}
        {isFlipped && (
          <div className="w-full h-full">
            {renderBackContent()}
          </div>
        )}
      </div>
    </div>
  );
}