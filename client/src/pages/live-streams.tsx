import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Play, Users, Eye, MessageCircle, Clock, Heart, Video, Radio, Sparkles, Gift } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import { GiftShop } from "@/components/gift-shop";

export default function LiveStreams() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const previewRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [selectedStreamForGift, setSelectedStreamForGift] = useState<any>(null);
  const [showGiftShop, setShowGiftShop] = useState(false);
  
  // جلب البثوث المباشرة
  const { data: streams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'], 
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">البثوث المباشرة</h1>
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0"
            >
              <Radio className="w-5 h-5 ml-2" />
              ابدأ البث
            </Button>
          </div>
        </div>
      </div>

      {/* Streaming Promo */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Card className="mb-6 bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">🔴 البث المباشر متاح الآن</h3>
                <p className="text-sm text-white/90">شارك محتواك وتفاعل مع المتابعين</p>
              </div>
              <Button 
                className="bg-white text-red-600 hover:bg-gray-100 font-medium px-6 py-2 rounded-full"
                onClick={() => setLocation('/start-stream')}
              >
                <Radio className="w-4 h-4 mr-2" />
                ابدأ البث
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Streams Grid */}
      <div className="max-w-4xl mx-auto px-4">
        {streams.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد بثوث مباشرة حالياً</h3>
            <p className="text-gray-500 mb-6">كن أول من يبدأ البث واكسب المشاهدين!</p>
            <Button 
              onClick={() => setLocation('/start-stream')}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
            >
              <Radio className="w-5 h-5 ml-2" />
              ابدأ البث الآن
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {streams.map((stream: any) => (
              <Card 
                key={stream.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                onClick={() => setLocation(`/stream/${stream.id}`)}
              >
                <div className="relative">
                  {/* Stream Preview */}
                  <div 
                    ref={el => previewRefs.current[`preview-${stream.id}`] = el}
                    className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden"
                  >
                    {/* Live Badge */}
                    {stream.isLive && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-bold">مباشر</span>
                        </div>
                      </div>
                    )}

                    {/* Viewer Count */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 rtl:space-x-reverse">
                        <Users className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-medium">{stream.viewerCount || 0}</span>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>

                    {/* Fallback gradient when no stream */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20"></div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{stream.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {stream.hostName || stream.hostUsername || (stream.hostId ? `المضيف: ${stream.hostId}` : 'مضيف مجهول')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stream Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{stream.viewerCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>دردشة</span>
                      </div>
                    </div>
                    
                    {user && stream.hostId !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-pink-600 hover:from-pink-100 hover:to-purple-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStreamForGift(stream);
                          setShowGiftShop(true);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        هدية
                      </Button>
                    )}
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Gift Shop Modal */}
      {showGiftShop && selectedStreamForGift && (
        <GiftShop
          isOpen={showGiftShop}
          onClose={() => {
            setShowGiftShop(false);
            setSelectedStreamForGift(null);
          }}
          receiverId={selectedStreamForGift.hostId}
          receiverName={selectedStreamForGift.hostName || selectedStreamForGift.hostUsername || 'مجهول'}
          streamId={selectedStreamForGift.id}
          onGiftSent={(gift) => {
            console.log('Gift sent:', gift);
          }}
        />
      )}

      <BottomNavigation />
    </div>
  );
}