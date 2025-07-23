import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RealTimeTimestamp } from "./real-time-timestamp";
import { OnlineStatus } from "./online-status";
import SupporterBadge from "./SupporterBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  onLike: (id: string) => void;
  isLiked: boolean;
}

export default function FlipCard({ content, type, onAction, onLike, isLiked }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [location, setLocation] = useLocation();

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
              src={content.mediaUrls[0]}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              poster={content.thumbnailUrl}
              onMouseEnter={(e) => {
                e.currentTarget.play();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
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

        {/* Author Circle - Top Left (Small) */}
        <div className="absolute top-3 left-3 z-10">
          <Link 
            href={`/user/${content.author?.id || content.authorId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer border-2 border-white/80">
              {content.author?.profileImageUrl ? (
                <img
                  src={content.author.profileImageUrl}
                  alt={content.author?.firstName || content.author?.username || 'مستخدم'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Top Badges - Moved to avoid overlap with profile */}
        <div className="absolute top-16 left-3 flex items-center space-x-2 rtl:space-x-reverse">
          {type === 'live' && (
            <Badge className="bg-red-500 text-white px-3 py-1 rounded-full animate-pulse border-2 border-white/50">
              <Radio className="w-3 h-3 mr-1" />
              مباشر
            </Badge>
          )}
          {type === 'featured' && (
            <Badge className="bg-yellow-500 text-white px-3 py-1 rounded-full border-2 border-white/50">
              <Star className="w-3 h-3 mr-1" />
              مميز
            </Badge>
          )}
          {content.memoryType && (
            <Badge className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full">
              {content.memoryType}
            </Badge>
          )}
        </div>

        {/* Views Count - Back to original position */}
        <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center backdrop-blur-sm">
          <Eye className="w-3 h-3 mr-1" />
          <span className="font-medium">{content.viewCount || 0}</span>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
          {type === 'video' || type === 'live' ? (
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40 hover:scale-110 transition-transform duration-300">
              <PlayCircle className="w-10 h-10 text-white" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40 hover:scale-110 transition-transform duration-300">
              <Image className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className={`${content.mediaUrls && content.mediaUrls.length > 0 ? 'text-white' : 'text-gray-100'}`}>
            {content.title && (
              <h3 className="font-bold text-lg mb-1 line-clamp-1 drop-shadow-lg">
                {content.title}
              </h3>
            )}
            <p className={`text-sm line-clamp-2 drop-shadow ${content.mediaUrls && content.mediaUrls.length > 0 ? 'text-white/90' : 'text-gray-200'}`}>
              {content.caption || content.description || "منشور جديد"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderBackContent = () => {
    const author = content.author || {};
    
    return (
      <div className="w-full h-full relative overflow-hidden rounded-xl">
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
        <div className="relative z-10 h-full flex flex-col p-6 text-white">
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
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              <Users className="w-4 h-4 ml-1" />
              متابعة
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex justify-around bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="font-bold text-xl text-white">{content.viewCount || 0}</div>
              <div className="text-white/70 text-xs">مشاهدة</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-white">{content.likeCount || 0}</div>
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
              onClick={() => onLike(content.id)}
            >
              <Heart className={`w-4 h-4 ml-1 ${isLiked ? 'fill-white' : ''}`} />
              إعجاب
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-blue-500/80 hover:bg-blue-500 text-white border-0"
            >
              <MessageCircle className="w-4 h-4 ml-1" />
              رسالة
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-yellow-500/80 hover:bg-yellow-500 text-white border-0"
            >
              <Gift className="w-4 h-4 ml-1" />
              هدية
            </Button>
          </div>

          {/* Flip back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setIsFlipped(false)}
          >
            العودة للعرض
          </Button>
        </div>
      </div>
    );
  };

  const handleCardClick = () => {
    // إذا كان فيديو أو بث مباشر، انتقل مباشرة بدون إعادة تحميل
    if (type === 'video' || type === 'live') {
      if (type === 'video' && content.id) {
        setLocation(`/video/${content.id}`);
      } else if (type === 'live' && content.id) {
        setLocation(`/stream/${content.id}`);
      }
    } else {
      // للمنشورات الأخرى، اقلب البطاقة
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div 
      className="relative w-full h-full cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className={`w-full h-full transition-all duration-700 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
        {/* Front side */}
        {!isFlipped && (
          <div className="w-full h-full">
            {renderFrontContent()}
          </div>
        )}
      </div>
      
      {/* Back side - separate container */}
      <div className={`absolute inset-0 w-full h-full transition-all duration-700 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isFlipped && (
          <div className="w-full h-full" dir="rtl">
            {renderBackContent()}
          </div>
        )}
      </div>
    </div>
  );
}