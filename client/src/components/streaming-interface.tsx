import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/lib/websocket";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  X, 
  Volume2, 
  Maximize, 
  UserPlus, 
  Share2, 
  Send,
  Heart,
  Eye,
  Gift as GiftIcon,
  Sparkles
} from "lucide-react";
import { Stream, ChatMessage, Gift, GiftCharacter } from "@/types";
import GiftCharacters from "./gift-characters";
import BeautyFilters from "./beauty-filters";
import LoveGiftEffect from "./LoveGiftEffect";
import SupporterBadge from "./SupporterBadge";
import SupporterLevelUpNotification from "./SupporterLevelUpNotification";

interface StreamingInterfaceProps {
  stream: Stream;
}

interface ExtendedChatMessage extends Omit<ChatMessage, 'user'> {
  user?: {
    id: string;
    username?: string;
    profileImageUrl?: string;
    supporterLevel?: number;
    totalGiftsSent?: number;
  };
}

export default function StreamingInterface({ stream }: StreamingInterfaceProps) {
  const { user } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ExtendedChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLoveEffect, setShowLoveEffect] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>('ar');
  const [supporterLevelUp, setSupporterLevelUp] = useState<{newLevel: number, oldLevel: number} | null>(null);
  const [isStreamer, setIsStreamer] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    joinStream, 
    leaveStream, 
    sendChatMessage,
    onViewerCountUpdate,
    onChatMessage,
    onGiftSent
  } = useWebSocket();

  // Join stream on mount and check if user is streamer
  useEffect(() => {
    if (user && isConnected) {
      joinStream(stream.id, user.id);
      setIsStreamer(user.id === stream.hostId);
    }

    return () => {
      leaveStream();
    };
  }, [user, isConnected, stream.id, joinStream, leaveStream]);

  // Set up WebSocket listeners
  useEffect(() => {
    onViewerCountUpdate((count) => {
      setViewerCount(count);
    });

    onChatMessage((message, messageUser) => {
      setChatMessages(prev => [...prev, { ...message, user: messageUser }]);
    });

    onGiftSent((gift, sender) => {
      // Add gift notification to chat
      const giftMessage: ExtendedChatMessage = {
        id: Date.now(),
        streamId: stream.id,
        userId: sender.sub,
        message: `sent a gift!`,
        sentAt: new Date(),
        user: {
          id: sender.sub,
          username: sender.first_name || sender.email,
          profileImageUrl: sender.profile_image_url,
        }
      };
      setChatMessages(prev => [...prev, giftMessage]);
    });
  }, [onViewerCountUpdate, onChatMessage, onGiftSent, stream.id]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      sendChatMessage(message, user);
    },
  });

  const sendGiftMutation = useMutation({
    mutationFn: async (giftData: { receiverId: string; characterId: number; pointCost: number; streamId: number }) => {
      const response = await apiRequest('POST', '/api/gifts/send', giftData);
      return response.json();
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && user) {
      sendChatMutation.mutate(chatMessage);
      setChatMessage("");
    }
  };

  const handleSendGift = (character: GiftCharacter) => {
    if (user && stream.hostId !== user.id) {
      sendGiftMutation.mutate({
        receiverId: stream.hostId,
        characterId: character.id,
        pointCost: character.pointCost,
        streamId: stream.id,
      }, {
        onSuccess: (response) => {
          // Check if this is the special Love Heart gift
          if (character.name === 'Love Heart' || character.emoji === '💝') {
            // Detect user's language preference
            const userLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
            setCurrentLanguage(userLang);
            setShowLoveEffect(true);
          }
          
          // Handle supporter level updates
          if (response.supporterUpdate) {
            setSupporterLevelUp({
              newLevel: response.supporterUpdate.newLevel,
              oldLevel: response.supporterUpdate.oldLevel
            });
          }
        }
      });
      
      // Hide gift panel after sending
      setShowGiftPanel(false);
    }
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* TikTok-Style Full Screen Stream */}
      <div className="relative w-full h-full">
        {/* Video Background */}
        <div className="absolute inset-0">
          <img 
            src={stream.thumbnailUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"}
            alt="Live Stream" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better visibility */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Top Header - TikTok Style */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white bg-black/30 hover:bg-black/50 rounded-full w-10 h-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-semibold">مباشر</span>
              <Eye className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{viewerCount}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="absolute inset-0 flex z-20">
          
          {/* Left Side - Stream Info (Bottom) */}
          <div className="flex-1 flex flex-col justify-end p-4 pb-20">
            {/* Stream and Host Info */}
            <div className="text-white max-w-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2 text-right leading-tight">{stream.title}</h2>
                <p className="text-gray-200 text-sm text-right">{stream.description || 'بث مباشر تفاعلي مع المشاهدين'}</p>
              </div>
              
              {/* Host Profile */}
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
                <div className="text-right">
                  <p className="font-semibold text-sm">{stream.hostId}</p>
                  <p className="text-xs text-gray-300">{stream.category}</p>
                </div>
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarImage src={`https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50`} />
                  <AvatarFallback className="text-xs">H</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Right Side - TikTok Style Action Panel */}
          <div className="w-20 md:w-24 flex flex-col justify-end items-center pb-4 space-y-4">
            
            {/* Follow Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-laa-pink hover:bg-pink-600 border-2 border-white shadow-lg"
              >
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </Button>
              <span className="text-white text-xs mt-1">متابعة</span>
            </div>
            
            {/* Heart/Like Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600 hover:bg-red-700 border-2 border-white shadow-lg"
              >
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </Button>
              <span className="text-white text-xs mt-1">إعجاب</span>
            </div>
            
            {/* Share Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-white shadow-lg"
              >
                <Share2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </Button>
              <span className="text-white text-xs mt-1">مشاركة</span>
            </div>
            
            {/* Gift Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                onClick={() => setShowGiftPanel(!showGiftPanel)}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-500 hover:bg-yellow-600 border-2 border-white shadow-lg"
              >
                <GiftIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </Button>
              <span className="text-white text-xs mt-1">هدية</span>
            </div>
            
            {/* Beauty Filters Button - Only for streamers */}
            {isStreamer && (
              <div className="flex flex-col items-center">
                <Button 
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-600 hover:bg-purple-700 border-2 border-white shadow-lg ${
                    showFilters ? 'ring-2 ring-pink-400' : ''
                  }`}
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </Button>
                <span className="text-white text-xs mt-1">فلاتر</span>
              </div>
            )}
            
          </div>
        </div>

        {/* Gift Animations Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-20 right-20 gift-animation">
            <div className="text-4xl">🐰💕</div>
          </div>
          <div className="absolute top-40 left-32 gift-animation" style={{animationDelay: '0.5s'}}>
            <div className="text-3xl">🌟</div>
          </div>
          <div className="absolute bottom-32 right-40 gift-animation" style={{animationDelay: '1s'}}>
            <div className="text-4xl">🔥</div>
          </div>
        </div>

        {/* Bottom Chat Panel - Floating */}
        <div className="absolute bottom-4 left-4 right-24 z-30">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 max-h-40 overflow-y-auto">
            {/* Recent Chat Messages */}
            <div className="space-y-2 mb-3">
              {chatMessages.slice(-3).map((message) => (
                <div key={message.id} className="flex items-start space-x-2 text-white text-sm">
                  <span className="font-semibold text-laa-pink">
                    {message.user?.username || 'مجهول'}:
                  </span>
                  <span className="flex-1">{message.message}</span>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text" 
                placeholder="اكتب رسالة..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 text-sm bg-white/10 border-white/20 text-white placeholder-white/70"
                disabled={sendChatMutation.isPending}
              />
              <Button 
                type="submit"
                size="sm"
                disabled={!chatMessage.trim() || sendChatMutation.isPending}
                className="bg-laa-pink hover:bg-pink-600 px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Gift Panel */}
        {showGiftPanel && (
          <div className="absolute bottom-20 right-4 z-40">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 max-w-sm">
              <GiftCharacters 
                onSelectGift={handleSendGift}
                showPurchaseButton={true}
              />
            </div>
          </div>
        )}

        {/* Beauty Filters Panel */}
        {isStreamer && showFilters && (
          <div className="absolute bottom-20 right-4 z-40">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 max-w-sm">
              <BeautyFilters
                isStreaming={true}
                onFilterChange={(filterId, intensity) => {
                  console.log(`Filter ${filterId} applied with intensity ${intensity}%`);
                }}
                language="ar"
              />
            </div>
          </div>
        )}

      </div>
      
      {/* Love Gift Effect Overlay */}
      <LoveGiftEffect 
        isActive={showLoveEffect}
        language={currentLanguage}
        onComplete={() => setShowLoveEffect(false)}
      />
      
      {/* Supporter Level Up Notification */}
      {supporterLevelUp && (
        <SupporterLevelUpNotification
          isVisible={!!supporterLevelUp}
          newLevel={supporterLevelUp.newLevel}
          oldLevel={supporterLevelUp.oldLevel}
          onComplete={() => setSupporterLevelUp(null)}
        />
      )}
    </div>
  );
}
