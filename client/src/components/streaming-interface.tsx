import { useState, useEffect, useRef } from "react";
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
  Gift as GiftIcon
} from "lucide-react";
import { Stream, ChatMessage, Gift, GiftCharacter } from "@/types";
import GiftCharacters from "./gift-characters";

interface StreamingInterfaceProps {
  stream: Stream;
}

interface ExtendedChatMessage extends Omit<ChatMessage, 'user'> {
  user?: {
    id: string;
    username?: string;
    profileImageUrl?: string;
  };
}

export default function StreamingInterface({ stream }: StreamingInterfaceProps) {
  const { user } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ExtendedChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
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

  // Join stream on mount
  useEffect(() => {
    if (user && isConnected) {
      joinStream(stream.id, user.id);
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
        sentAt: new Date().toISOString(),
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
      });
    }
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="flex flex-col h-full">
        {/* Stream Header */}
        <div className="bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full pulse-ring"></div>
              <span className="font-semibold text-red-500">LIVE</span>
              <span className="text-gray-600">|</span>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="font-semibold">{viewerCount} viewers</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button size="sm" className="bg-laa-pink hover:bg-pink-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Follow
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Stream Area */}
        <div className="flex-1 flex">
          {/* Video Stream */}
          <div className="flex-1 relative bg-black">
            <img 
              src={stream.thumbnailUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"}
              alt="Live Stream" 
              className="w-full h-full object-cover"
            />
            
            {/* Gift Animations Overlay */}
            <div className="absolute inset-0 pointer-events-none">
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

            {/* Stream Controls */}
            <div className="absolute bottom-4 left-4 flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat & Gifts Sidebar */}
          <div className="w-80 bg-white flex flex-col">
            {/* Stream Info */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={`https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50`} />
                  <AvatarFallback>H</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{stream.hostId}</h3>
                  <p className="text-sm text-gray-600">{stream.category}</p>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2">{stream.title}</h4>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Started 23 minutes ago</span>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-laa-pink/10 text-laa-pink">
                    <GiftIcon className="w-3 h-3 mr-1" />
                    {stream.totalGifts}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-600">
                    <Heart className="w-3 h-3 mr-1" />
                    1.2K
                  </Badge>
                </div>
              </div>
            </div>

            {/* Live Chat */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b">
                <h4 className="font-semibold text-sm">Live Chat</h4>
              </div>
              
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-3"
              >
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={message.user?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {message.user?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-laa-pink">
                          {message.user?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.sentAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    type="text" 
                    placeholder="Type a message..." 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 text-sm"
                    disabled={sendChatMutation.isPending}
                  />
                  <Button 
                    type="submit"
                    size="sm"
                    disabled={!chatMessage.trim() || sendChatMutation.isPending}
                    className="bg-laa-pink hover:bg-pink-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Gift Panel */}
            <div className="border-t">
              <div className="p-3">
                <Button
                  onClick={() => setShowGiftPanel(!showGiftPanel)}
                  className="w-full bg-laa-purple hover:bg-purple-600"
                >
                  <GiftIcon className="w-4 h-4 mr-2" />
                  Send Gift
                </Button>
              </div>
              
              {showGiftPanel && (
                <div className="p-3 border-t bg-gray-50">
                  <GiftCharacters 
                    onSelectGift={handleSendGift}
                    showPurchaseButton={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
