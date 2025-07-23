import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocketFixed";
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
  Sparkles,
  MessageCircle
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
  console.log('🎬 StreamingInterface loaded with TikTok style!');
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
    onViewerCountUpdate((count: number) => {
      setViewerCount(count);
    });

    onChatMessage((message: any, messageUser: any) => {
      setChatMessages(prev => [...prev, { ...message, user: messageUser }]);
    });

    onGiftSent((gift: any, sender: any) => {
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
    <div className="fixed inset-0 bg-black z-50 streaming-interface">
      {/* TikTok-Style Full Screen Stream */}
      <div className="relative w-full h-full">
        {/* Video Background - TikTok Style */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black">
          <img 
            src={stream.thumbnailUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"}
            alt="Live Stream" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>
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
            
            <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full live-indicator">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-semibold">مباشر</span>
              <Eye className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{viewerCount}</span>
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
                <h2 className="text-2xl font-bold mb-2 text-right leading-tight drop-shadow-lg">{stream.title}</h2>
                <p className="text-gray-200 text-base text-right drop-shadow-md">{stream.description || 'بث مباشر تفاعلي مع المشاهدين'}</p>
              </div>
              
              {/* Host Profile */}
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
                <div className="text-right">
                  <p className="font-bold text-lg drop-shadow-lg">{stream.hostId}</p>
                  <p className="text-sm text-gray-300 drop-shadow-md">{stream.category}</p>
                </div>
                <div className="relative">
                  <Avatar className="w-12 h-12 border-3 border-white shadow-lg">
                    <AvatarImage src={`https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50`} />
                    <AvatarFallback className="text-sm">H</AvatarFallback>
                  </Avatar>
                  {/* Live indicator on avatar */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - TikTok Style Action Panel */}
          <div className="w-16 md:w-20 flex flex-col justify-center items-center space-y-6 pr-4">
            
            {/* Follow Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-14 h-14 rounded-full bg-laa-pink hover:bg-pink-600 border-2 border-white shadow-2xl tiktok-button relative overflow-hidden"
              >
                <UserPlus className="w-6 h-6 text-white z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 hover:opacity-100 transition-opacity"></div>
              </Button>
              <span className="text-white text-xs mt-2 font-bold drop-shadow-lg">متابعة</span>
            </div>
            
            {/* Heart/Like Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 border-2 border-white shadow-2xl tiktok-button relative overflow-hidden"
              >
                <Heart className="w-6 h-6 text-white z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 opacity-0 hover:opacity-100 transition-opacity"></div>
              </Button>
              <span className="text-white text-xs mt-2 font-bold drop-shadow-lg">إعجاب</span>
              <span className="text-white text-xs font-semibold">1.2K</span>
            </div>
            
            {/* Share Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-white shadow-2xl tiktok-button relative overflow-hidden"
              >
                <Share2 className="w-6 h-6 text-white z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-600 opacity-0 hover:opacity-100 transition-opacity"></div>
              </Button>
              <span className="text-white text-xs mt-2 font-bold drop-shadow-lg">مشاركة</span>
            </div>
            
            {/* Gift Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                onClick={() => setShowGiftPanel(!showGiftPanel)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-white shadow-2xl tiktok-button relative overflow-hidden"
              >
                <GiftIcon className="w-6 h-6 text-white z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 hover:opacity-100 transition-opacity"></div>
              </Button>
              <span className="text-white text-xs mt-2 font-bold drop-shadow-lg">هدية</span>
            </div>
            
            {/* Comment Button */}
            <div className="flex flex-col items-center">
              <Button 
                size="lg"
                className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 border-2 border-white shadow-2xl tiktok-button relative overflow-hidden"
              >
                <MessageCircle className="w-6 h-6 text-white z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 opacity-0 hover:opacity-100 transition-opacity"></div>
              </Button>
              <span className="text-white text-xs mt-2 font-bold drop-shadow-lg">تعليق</span>
              <span className="text-white text-xs font-semibold">48</span>
            </div>

            {/* Beauty Filters Button - Only for streamers */}
            {isStreamer && (
              <div className="flex flex-col items-center">
                <Button 
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 border-2 border-white shadow-2xl tiktok-button relative overflow-hidden ${
                    showFilters ? 'ring-4 ring-pink-400' : ''
                  }`}
                >
                  <Sparkles className="w-6 h-6 text-white z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600 opacity-0 hover:opacity-100 transition-opacity"></div>
                </Button>
                <span className="text-white text-xs mt-2 font-bold drop-shadow-lg">فلاتر</span>
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

        {/* Bottom Chat Panel - TikTok Style */}
        <div className="absolute bottom-4 left-4 right-20 z-30">
          <div className="streaming-chat rounded-2xl p-4 max-h-48 overflow-y-auto">
            {/* Recent Chat Messages */}
            <div className="space-y-3 mb-4">
              {chatMessages.slice(-4).map((message) => (
                <div key={message.id} className="flex items-start space-x-3 text-white">
                  <Avatar className="w-6 h-6 border border-white/30">
                    <AvatarImage src={message.user?.profileImageUrl} />
                    <AvatarFallback className="text-xs bg-laa-pink">
                      {message.user?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-sm text-laa-pink drop-shadow-lg">
                        {message.user?.username || 'مجهول'}
                      </span>
                      {message.user && (
                        <SupporterBadge 
                          level={message.user.supporterLevel || 0}
                          totalGiftsSent={message.user.totalGiftsSent || 0}
                          showText={false}
                          className="scale-75"
                        />
                      )}
                    </div>
                    <p className="text-white text-sm drop-shadow-md">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input - TikTok Style */}
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <Input
                type="text" 
                placeholder="قل شيئاً لطيفاً..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 text-sm bg-white/20 border-white/30 text-white placeholder-white/60 rounded-full px-4 py-2 backdrop-blur-sm"
                disabled={sendChatMutation.isPending}
              />
              <Button 
                type="submit"
                size="sm"
                disabled={!chatMessage.trim() || sendChatMutation.isPending}
                className="bg-gradient-to-r from-laa-pink to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full px-4 shadow-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Gift Panel */}
        {showGiftPanel && (
          <div className="absolute bottom-20 right-4 z-40">
            <div className="gift-panel rounded-lg p-4 max-w-sm">
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
            <div className="gift-panel rounded-lg p-4 max-w-sm">
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
