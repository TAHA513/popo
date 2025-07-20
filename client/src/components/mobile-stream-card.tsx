import { Link } from "wouter";
import { Eye, Users, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Stream {
  id: number;
  title: string;
  description?: string;
  hostId: string;
  host?: {
    id: string;
    username?: string;
    firstName?: string;
    profileImageUrl?: string;
  };
  viewerCount: number;
  isLive: boolean;
  category?: string;
}

interface MobileStreamCardProps {
  stream: Stream;
}

export default function MobileStreamCard({ stream }: MobileStreamCardProps) {
  // Safe way to get the first character with fallback
  const getInitial = (text?: string | null) => {
    if (!text || typeof text !== 'string') return 'U';
    return text.charAt(0).toUpperCase();
  };

  const displayName = stream.host?.firstName || stream.host?.username || 'مستخدم';
  const initial = getInitial(stream.host?.firstName) || getInitial(stream.host?.username);

  return (
    <Link href={`/stream/${stream.id}`}>
      <Card className="w-full overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-3">
          {/* Live Stream Thumbnail */}
          <div className="relative w-full h-32 bg-gradient-to-br from-laa-pink via-laa-purple to-laa-blue rounded-lg mb-3 flex items-center justify-center">
            <div className="text-white text-center">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium">بث مباشر</span>
            </div>
            
            {stream.isLive && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                مباشر
              </Badge>
            )}
            
            <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-white text-xs">
              <Eye className="w-3 h-3" />
              <span>{stream.viewerCount}</span>
            </div>
          </div>

          {/* Stream Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white">
              {stream.title}
            </h3>
            
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage 
                  src={stream.host?.profileImageUrl || undefined}
                  alt={displayName}
                />
                <AvatarFallback className="bg-laa-pink text-white text-xs">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {displayName}
              </span>
            </div>

            {stream.category && (
              <Badge variant="secondary" className="text-xs">
                {stream.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}