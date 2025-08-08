import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, User, Video, ArrowLeft, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import VerificationBadge from "@/components/ui/verification-badge";

export default function SearchPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "users" | "videos">("all");
  
  // البحث في المستخدمين
  const { data: searchUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length > 0 && (activeTab === "all" || activeTab === "users"),
    queryFn: async () => {
      if (!searchQuery) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // البحث في المحتوى/الفيديوهات
  const { data: searchMemories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/search', searchQuery],
    enabled: searchQuery.length > 0 && (activeTab === "all" || activeTab === "videos"),
    queryFn: async () => {
      if (!searchQuery) return [];
      const response = await fetch(`/api/memories/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const handleUserClick = (userId: string) => {
    setLocation(`/profile-redesign/${userId}`);
  };

  const handleMemoryClick = (memoryId: string) => {
    setLocation(`/single-video/${memoryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with search */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن أشخاص أو فيديوهات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-full border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                dir="rtl"
              />
            </div>
          </div>
          
          {/* Search Tabs */}
          {searchQuery.length > 0 && (
            <div className="flex gap-2 mt-3">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
                className="rounded-full"
              >
                الكل
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("users")}
                className="rounded-full"
              >
                <Users className="w-4 h-4 ml-1" />
                أشخاص
              </Button>
              <Button
                variant={activeTab === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("videos")}
                className="rounded-full"
              >
                <Video className="w-4 h-4 ml-1" />
                فيديوهات
              </Button>
            </div>
          )}
        </div>
        <div className="h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Search Results */}
        {searchQuery.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">ابحث عن أي شيء</h3>
            <p className="text-gray-500">ابحث عن الأشخاص والفيديوهات والمحتوى</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Users Results */}
            {(activeTab === "all" || activeTab === "users") && searchUsers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  الأشخاص
                </h3>
                <div className="space-y-2">
                  {searchUsers.map((foundUser: any) => (
                    <Card key={foundUser.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4" onClick={() => handleUserClick(foundUser.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            {foundUser.profileImageUrl ? (
                              <img 
                                src={foundUser.profileImageUrl} 
                                alt="Profile" 
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{foundUser.firstName || foundUser.username}</h4>
                              {foundUser.isVerified && (
                                <VerificationBadge 
                                  size="sm" 
                                  badge={foundUser.verificationBadge || 'LaaBoBo'} 
                                />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">@{foundUser.username}</p>
                            {foundUser.bio && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{foundUser.bio}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Videos/Memories Results */}
            {(activeTab === "all" || activeTab === "videos") && searchMemories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  الفيديوهات والمحتوى
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {searchMemories.map((memory: any) => (
                    <Card key={memory.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-0" onClick={() => handleMemoryClick(memory.id)}>
                        <div className="relative">
                          {memory.mediaUrl && (
                            <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100">
                              {memory.mediaType === 'video' ? (
                                <div className="relative w-full h-full">
                                  <video 
                                    src={memory.mediaUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                    <Play className="w-8 h-8 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={memory.mediaUrl} 
                                  alt="Memory" 
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-sm font-medium line-clamp-2">{memory.caption || memory.description}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {memory.memoryType}
                              </Badge>
                              {memory.user && (
                                <p className="text-xs text-gray-500">@{memory.user.username}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery.length > 0 && 
             ((activeTab === "all" && searchUsers.length === 0 && searchMemories.length === 0) ||
              (activeTab === "users" && searchUsers.length === 0) ||
              (activeTab === "videos" && searchMemories.length === 0)) && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-500">جرب البحث بكلمات مختلفة</p>
              </div>
            )}

            {/* Loading States */}
            {(usersLoading || memoriesLoading) && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">جاري البحث...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}