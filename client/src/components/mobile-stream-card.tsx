import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Gift, Play } from "lucide-react";
import { Link } from "wouter";

interface Stream {
  id: number;
  title: string;
  viewerCount: number;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  thumbnail?: string;
  category?: string;
  isLive: boolean;
  totalGifts: number;
}

interface MobileStreamCardProps {
  stream: Stream;
}

export default function MobileStreamCard({ stream }: MobileStreamCardProps) {
  // Safely handle undefined values
  const safeStreamerName = stream?.streamerName || 'Unknown Streamer';
  const safeTitle = stream?.title || 'Live Stream';
  
  return (
    <Link href={`/stream/${stream.id}`}>
      <Card className="laa-card-mobile cursor-pointer hover:shadow-xl transition-all duration-300 touch-target">
        <CardContent className="p-0">
          {/* Thumbnail Section */}
          <div className="relative aspect-video bg-gradient-to-br from-laa-pink via-laa-purple to-laa-blue rounded-t-2xl overflow-hidden">
            {stream.thumbnail ? (
              <img 
                src={stream.thumbnail} 
                alt={safeTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-70" />
              </div>
            )}
            
            {/* Live Badge */}
            {stream.isLive && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">
                مباشر
              </Badge>
            )}
            
            {/* View Count */}
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{stream.viewerCount.toLocaleString()}</span>
            </div>
            
            {/* Gift Count */}
            <div className="absolute bottom-2 right-2 bg-laa-pink/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Gift className="w-3 h-3" />
              <span>{stream.totalGifts}</span>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-3">
            {/* Streamer Info */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8 border-2 border-laa-pink">
                <AvatarImage src={stream.streamerAvatar} alt={safeStreamerName} />
                <AvatarFallback className="bg-laa-pink text-white text-xs">
                  {safeStreamerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {safeStreamerName}
                </p>
                {stream.category && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {stream.category}
                  </p>
                )}
              </div>
            </div>
            
            {/* Stream Title */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
              {safeTitle}
            </h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}