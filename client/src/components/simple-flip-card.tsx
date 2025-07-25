import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { RealTimeTimestamp } from "./real-time-timestamp";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User,
  Image as ImageIcon,
  Star
} from "lucide-react";

interface SimpleFlipCardProps {
  content: any;
  type: 'video' | 'image' | 'live' | 'featured';
  onAction: (action: string) => void;
  onLike: (id: string) => void;
  isLiked: boolean;
}

export default function SimpleFlipCard({ content, type, onAction, onLike, isLiked }: SimpleFlipCardProps) {
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

  const renderMedia = () => {
    const mediaUrl = content.mediaUrls?.[0] || content.imageUrl || content.thumbnailUrl;
    
    if (!mediaUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-16 h-16 text-white/50" />
        </div>
      );
    }
    
    if (type === 'video' || type === 'live') {
      return (
        <video
          src={mediaUrl}
          className="w-full h-full object-cover"
          muted
          autoPlay
          loop
          playsInline
          controls={false}
          poster={content.thumbnailUrl}
          onError={(e) => {
            console.log('جاري المحاولة مع رابط بديل:', mediaUrl);
            // محاولة استخدام thumbnail كبديل
            const target = e.currentTarget;
            if (content.thumbnailUrl && content.thumbnailUrl !== mediaUrl) {
              target.src = content.thumbnailUrl;
            } else if (content.imageUrl && content.imageUrl !== mediaUrl) {
              target.src = content.imageUrl;
            } else {
              // إذا فشلت كل المحاولات، اعرض صورة بديلة
              const img = document.createElement('img');
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkrlmKTwvdGV4dD48L3N2Zz4=';
              img.className = 'w-full h-full object-cover';
              img.alt = 'فيديو';
              if (target.parentNode) {
                target.parentNode.replaceChild(img, target);
              }
            }
          }}
        />
      );
    } else {
      return (
        <img
          src={mediaUrl}
          alt="منشور"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
  };

  return (
    <div className="w-full h-96 perspective-1000">
      <div className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden">
          <div className={`relative w-full h-full ${cardStyle.front} overflow-hidden rounded-xl ${cardStyle.glow}`}>
            {/* Background Media */}
            {renderMedia()}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

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
                    <span className="text-white font-semibold text-sm">
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

            {/* Video Play Button */}
            {type === 'video' && (
              <div 
                className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.currentTarget.parentElement?.querySelector('video');
                  if (video) {
                    if (video.paused) {
                      video.play();
                      video.controls = true;
                      video.muted = false;
                    } else {
                      video.pause();
                      video.controls = false;
                    }
                  }
                }}
              >
                <div className="w-16 h-16 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/80 hover:scale-110 hover:bg-black/90 transition-all duration-200 shadow-lg">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
                  🎥 فيديو
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
                    onClick={(e) => { e.stopPropagation(); onLike?.(content.id); }}
                    className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-red-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                    <span className="text-xs">{content.likeCount || 0}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">{content.commentCount || 0}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-green-400 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  
                  <button className="flex items-center space-x-1 rtl:space-x-reverse text-white/80 hover:text-yellow-400 transition-colors">
                    <Gift className="w-4 h-4" />
                  </button>
                </div>

                {/* Time */}
                <span className="text-white/60 text-xs">
                  <RealTimeTimestamp timestamp={content.createdAt} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Face - للمعلومات الإضافية */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 flex flex-col justify-center items-center text-white">
            <h3 className="text-lg font-bold mb-2">{content.title || "منشور LaaBoBo"}</h3>
            <p className="text-sm text-center mb-4 opacity-80">
              {content.caption || content.description || "لا توجد تفاصيل إضافية"}
            </p>
            <div className="flex gap-4 text-xs">
              <span>👀 {content.viewCount || 0} مشاهدة</span>
              <span>❤️ {content.likeCount || 0} إعجاب</span>
              <span>💬 {content.commentCount || 0} تعليق</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}