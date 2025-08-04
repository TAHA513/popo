import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift,
  Eye,
  Lock,
  Globe,
  Users,
  MoreHorizontal,
  Zap,
  Clock,
  Settings
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
// import { motion } from "framer-motion";

interface MemoryCardProps {
  memory: {
    id: string;
    type: string;
    title?: string;
    caption?: string;
    mediaUrls: string[];
    thumbnailUrl?: string;
    currentEnergy: number;
    initialEnergy: number;
    memoryType: 'fleeting' | 'precious' | 'legendary';
    viewCount: number;
    likeCount: number;
    shareCount: number;
    giftCount: number;
    visibilityLevel: 'public' | 'followers' | 'private';
    allowComments: boolean;
    allowSharing: boolean;
    allowGifts: boolean;
    expiresAt: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      profileImageUrl?: string;
      firstName?: string;
    };
  };
  isOwner?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSendGift?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MemoryCard({
  memory,
  isOwner = false,
  onLike,
  onComment,
  onShare,
  onSendGift,
  onEdit,
  onDelete
}: MemoryCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  
  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'fleeting': return '💫';
      case 'precious': return '💎';
      case 'legendary': return '👑';
      default: return '✨';
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case 'fleeting': return 'from-blue-400 to-cyan-400';
      case 'precious': return 'from-purple-400 to-pink-400';
      case 'legendary': return 'from-yellow-400 to-orange-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getVisibilityIcon = (level: string) => {
    switch (level) {
      case 'public': return <Globe className="w-3 h-3" />;
      case 'followers': return <Users className="w-3 h-3" />;
      case 'private': return <Lock className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(memory.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'منتهية';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    return 'أقل من ساعة';
  };

  const energyPercentage = (memory.currentEnergy / memory.initialEnergy) * 100;

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {/* Memory Type Icon - Clickable to profile */}
              <Link href={`/user/${memory.author.id}`}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMemoryColor(memory.memoryType)} flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:scale-105 transition-transform`}>
                  {getMemoryIcon(memory.memoryType)}
                </div>
              </Link>
              
              <div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Link href={`/user/${memory.author.id}`} className="hover:text-purple-600 transition-colors">
                    <h3 className="font-semibold text-sm cursor-pointer">
                      {memory.author.firstName || memory.author.username}
                    </h3>
                  </Link>
                  {getVisibilityIcon(memory.visibilityLevel)}
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeRemaining()}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      memory.memoryType === 'legendary' ? 'border-yellow-300 text-yellow-700' :
                      memory.memoryType === 'precious' ? 'border-purple-300 text-purple-700' :
                      'border-blue-300 text-blue-700'
                    }`}
                  >
                    {memory.memoryType === 'legendary' ? 'أسطوري' :
                     memory.memoryType === 'precious' ? 'ثمين' : 'عابر'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <Settings className="w-4 h-4 mr-2" />
                      تعديل الإعدادات
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-red-600"
                    >
                      حذف الذكرى
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      عرض كامل
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      إبلاغ عن محتوى
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Energy Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>طاقة الذكرى</span>
              <span>{memory.currentEnergy}/{memory.initialEnergy}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getMemoryColor(memory.memoryType)}`}
                style={{ width: `${energyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Media Content */}
        <CardContent className="p-0">
          <div className="relative">
            {memory.type === 'image' && memory.thumbnailUrl ? (
              <Link href={`/memory/${memory.id}`}>
                <img
                  src={memory.thumbnailUrl}
                  alt={memory.title || 'Memory'}
                  className="w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                />
              </Link>
            ) : memory.type === 'video' && memory.mediaUrls?.[0] ? (
              <div 
                className="relative cursor-pointer"
                onClick={() => {
                  // فتح الفيديو في صفحة كاملة مثل TikTok بنفس أسلوب الصفحة الرئيسية
                  window.location.href = `/video/${memory.id}`;
                }}
              >
                <video
                  src={memory.mediaUrls[0]}
                  className="w-full h-64 object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={memory.thumbnailUrl}
                  onMouseEnter={(e) => {
                    console.log('🎬 Mouse enter - starting video playback');
                    e.currentTarget.currentTime = 0;
                    e.currentTarget.play().catch(console.log);
                  }}
                  onMouseLeave={(e) => {
                    console.log('🎬 Mouse leave - pausing video');
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                  onCanPlay={(e) => {
                    console.log('🎬 Video can play - ready for hover interaction');
                  }}
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-6 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            ) : (
              <Link href={`/memory/${memory.id}`}>
                <div className={`w-full h-64 bg-gradient-to-br ${getMemoryColor(memory.memoryType)} flex items-center justify-center text-6xl cursor-pointer hover:opacity-95 transition-opacity`}>
                  {getMemoryIcon(memory.memoryType)}
                </div>
              </Link>
            )}
            
            {/* Overlay with memory type */}
            <div className="absolute top-2 left-2">
              <Badge className={`bg-black/70 text-white`}>
                {memory.type === 'video' ? '📹' : '📷'} {memory.type === 'video' ? 'فيديو' : 'صورة'}
              </Badge>
            </div>
          </div>

          {/* Caption */}
          {memory.caption && (
            <div className="p-4 pb-2">
              <p className="text-sm text-gray-700">{memory.caption}</p>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-1 rtl:space-x-reverse ${
                    isLiked ? 'text-red-500' : 'text-gray-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{memory.likeCount}</span>
                </Button>

                {memory.allowComments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onComment}
                    className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">تعليق</span>
                  </Button>
                )}

                {memory.allowSharing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs">{memory.shareCount}</span>
                  </Button>
                )}
              </div>

              {memory.allowGifts && !isOwner && (
                <Button
                  size="sm"
                  onClick={onSendGift}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Gift className="w-4 h-4 mr-1" />
                  هدية ({memory.giftCount})
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <span className="flex items-center space-x-1 rtl:space-x-reverse">
                  <Eye className="w-3 h-3" />
                  <span>{memory.viewCount}</span>
                </span>
                <span className="flex items-center space-x-1 rtl:space-x-reverse">
                  <Zap className="w-3 h-3" />
                  <span>{energyPercentage.toFixed(0)}%</span>
                </span>
              </div>
              <span>منذ {new Date(memory.createdAt).toLocaleDateString('ar')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}