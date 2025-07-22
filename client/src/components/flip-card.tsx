import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
              loop
              playsInline
              poster={content.thumbnailUrl}
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

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-2 rtl:space-x-reverse">
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

        {/* Views Count */}
        <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center backdrop-blur-sm">
          <Eye className="w-3 h-3 mr-1" />
          <span className="font-medium">{content.viewCount || 0}</span>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
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
    return (
      <div className="w-full h-full bg-white rounded-xl shadow-xl p-6 flex flex-col justify-between">
        {/* User Info */}
        <div className="flex items-center mb-4">
          {content.author?.profileImageUrl ? (
            <img
              src={content.author.profileImageUrl}
              alt="صورة الكاتب"
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className={`w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md ${content.author?.profileImageUrl ? 'hidden' : ''}`}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="mr-3 flex-1">
            <h4 className="font-bold text-gray-900 text-lg">
              {content.author?.firstName || content.author?.username || content.authorId || 'مستخدم'}
            </h4>
            <p className="text-gray-600 text-sm flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              منذ يوم
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">المشاهدات:</span>
            <span className="font-bold text-purple-600">{content.viewCount || 0}</span>
          </div>
          {type === 'live' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">المشاهدون الآن:</span>
              <span className="font-bold text-red-600 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {content.currentViewers || 0}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLike(`${type}-${content.id}`);
            }}
            className={`p-3 rounded-full ${isLiked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'} transition-colors`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction('comment');
            }}
            className="p-3 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction('share');
            }}
            className="p-3 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction('gift');
            }}
            className="p-3 rounded-full text-gray-500 hover:text-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Gift className="w-5 h-5" />
          </Button>
        </div>

        {/* Action Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (type === 'live') {
              onAction('join');
            } else if (type === 'video') {
              onAction('watch');
            } else {
              onAction('view');
            }
          }}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 ${
            type === 'live' 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
              : type === 'featured'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          } text-white shadow-lg`}
        >
          {type === 'live' ? 'انضم للبث' : type === 'video' ? 'شاهد الفيديو' : 'عرض كامل'}
        </Button>
      </div>
    );
  };

  return (
    <div 
      className="flip-card group cursor-pointer h-64 perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`flip-card-inner relative w-full h-full transition-transform duration-600 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front Side */}
        <div className="flip-card-front absolute inset-0 backface-hidden">
          {renderFrontContent()}
        </div>
        
        {/* Back Side */}
        <div className="flip-card-back absolute inset-0 backface-hidden rotate-y-180">
          {renderBackContent()}
        </div>
      </div>
    </div>
  );
}