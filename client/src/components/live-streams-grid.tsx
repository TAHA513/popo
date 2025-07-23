import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Gift, Heart, Play } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Stream } from "@/types";
import LazyImage from "@/components/lazy-image";

export default function LiveStreamsGrid() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: streams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['/api/streams'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes (replaces cacheTime in v5)
  });

  const filteredStreams = (streams || []).filter((stream: Stream) => 
    selectedCategory === "all" || stream.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const handleJoinStream = (streamId: number) => {
    setLocation(`/stream/${streamId}`);
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-laa-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading live streams...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12" id="live">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bold text-3xl text-laa-dark">Live Now</h2>
          <div className="flex items-center space-x-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="beauty">Beauty & Fashion</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="talk">Talk Show</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredStreams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Live Streams</h3>
            <p className="text-gray-500 mb-6">
              {selectedCategory === "all" 
                ? "There are no live streams at the moment. Check back later!"
                : `No live streams in the ${selectedCategory} category right now.`}
            </p>
            <Button className="bg-laa-pink hover:bg-pink-600">
              Start Your Stream
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream: Stream) => (
              <Card 
                key={stream.id} 
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => handleJoinStream(stream.id)}
              >
                <div className="relative">
                  <LazyImage 
                    src={stream.thumbnailUrl || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"} 
                    alt={stream.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Live Badge */}
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  </div>
                  
                  {/* Viewer Count */}
                  <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{stream.viewerCount}</span>
                    </div>
                  </div>
                  
                  {/* Gift Animation */}
                  <div className="absolute bottom-3 right-3 floating-gift">
                    <div className="w-8 h-8 bg-laa-pink rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Play className="w-6 h-6 text-laa-pink ml-1" />
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <img 
                      src={`https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1438761681033-6461ffad8d80' : '1507003211169-0a1dd7228f2d'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`}
                      alt="Streamer" 
                      className="w-8 h-8 rounded-full object-cover mr-3"
                    />
                    <span className="font-semibold text-laa-dark truncate">
                      {stream.hostId}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 truncate" title={stream.title}>
                    {stream.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {stream.category}
                    </Badge>
                    <div className="flex items-center space-x-2 text-laa-pink font-semibold">
                      <Gift className="w-4 h-4" />
                      <span>{stream.totalGifts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
