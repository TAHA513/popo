import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Video, Hash, X, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import MemoryCard from "@/components/memory-card";
import { Link } from "wouter";
import VerificationBadge from "@/components/ui/verification-badge";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "الذكريات الجميلة",
    "البث المباشر",
    "الهدايا",
  ]);

  // البحث في الذكريات
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['/api/memories/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/memories/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  // البحث في المستخدمين
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  // البحث في البثوث المباشرة
  const { data: streams = [], isLoading: streamsLoading } = useQuery({
    queryKey: ['/api/streams/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/streams/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !searchHistory.includes(query.trim())) {
      setSearchHistory(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const removeFromHistory = (item: string) => {
    setSearchHistory(prev => prev.filter(h => h !== item));
  };

  const isLoading = memoriesLoading || usersLoading || streamsLoading;
  const hasResults = memories.length > 0 || users.length > 0 || streams.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SimpleNavigation />
      
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b sticky top-16 z-10">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن الذكريات، الأشخاص، أو البثوث..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 rtl:pr-10 rtl:pl-4 pr-10 py-3 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 rtl:left-2 rtl:right-auto top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 h-auto rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {!searchQuery ? (
          /* Search History & Suggestions */
          <div className="space-y-6">
            {searchHistory.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-800">عمليات البحث الأخيرة</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(item)}
                        className="rounded-full bg-gray-100 hover:bg-purple-100 border-gray-200"
                      >
                        {item}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromHistory(item)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-red-500 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">اقتراحات البحث</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: "🎬", title: "الذكريات المتداولة", query: "trending" },
                  { icon: "⭐", title: "المحتوى المميز", query: "featured" },
                  { icon: "🎁", title: "الهدايا والمكافآت", query: "gifts" },
                  { icon: "🌸", title: "حديقة LaaBoBo", query: "garden" },
                ].map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div 
                        className="flex items-center gap-3"
                        onClick={() => setSearchQuery(suggestion.query)}
                      >
                        <span className="text-2xl">{suggestion.icon}</span>
                        <div>
                          <h3 className="font-medium text-gray-800">{suggestion.title}</h3>
                          <p className="text-sm text-gray-600">اكتشف المحتوى الجديد</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : hasResults ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="all">الكل ({memories.length + users.length + streams.length})</TabsTrigger>
                  <TabsTrigger value="memories">الذكريات ({memories.length})</TabsTrigger>
                  <TabsTrigger value="users">الأشخاص ({users.length})</TabsTrigger>
                  <TabsTrigger value="streams">البثوث ({streams.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="space-y-8">
                    {users.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          الأشخاص
                        </h3>
                        <div className="space-y-3">
                          {users.slice(0, 3).map((user: any) => (
                            <Link key={user.id} href={`/user/${user.id}`}>
                              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                      {user.profileImageUrl ? (
                                        <img 
                                          src={user.profileImageUrl} 
                                          alt={user.username || "صورة المستخدم"} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parentDiv = e.currentTarget.parentElement;
                                            if (parentDiv) {
                                              parentDiv.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-purple-100"><svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg></div>';
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                          <Users className="w-6 h-6 text-purple-500" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{user.firstName || user.username}</h4>
                                        {user.isVerified && (
                                          <VerificationBadge size="sm" badge={user.verificationBadge || 'LaaBoBo'} />
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">@{user.username}</p>
                                      {user.bio && <p className="text-sm text-gray-600 mt-1">{user.bio}</p>}
                                    </div>
                                    <Badge variant="secondary">{user.followersCount || 0} متابع</Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {memories.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          الذكريات
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {memories.slice(0, 6).map((memory: any) => (
                            <MemoryCard key={memory.id} memory={memory} />
                          ))}
                        </div>
                      </div>
                    )}

                    {streams.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse"></div>
                          البثوث المباشرة
                        </h3>
                        <div className="space-y-3">
                          {streams.slice(0, 3).map((stream: any) => (
                            <Card key={stream.id} className="hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                                    <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                      <Video className="w-8 h-8 text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{stream.title}</h4>
                                    <p className="text-sm text-gray-600">@{stream.username}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="destructive" className="animate-pulse">مباشر</Badge>
                                      <span className="text-sm text-gray-600">{stream.viewerCount || 0} مشاهد</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="memories">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {memories.map((memory: any) => (
                      <MemoryCard key={memory.id} memory={memory} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="users">
                  <div className="space-y-3">
                    {users.map((user: any) => (
                      <Link key={user.id} href={`/user/${user.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                {user.profileImageUrl ? (
                                  <img 
                                    src={user.profileImageUrl} 
                                    alt={user.username || "صورة المستخدم"} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parentDiv = e.currentTarget.parentElement;
                                      if (parentDiv) {
                                        parentDiv.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-purple-100"><svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                    <Users className="w-6 h-6 text-purple-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{user.firstName || user.username}</h4>
                                  {user.isVerified && (
                                    <VerificationBadge size="sm" badge={user.verificationBadge || 'LaaBoBo'} />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">@{user.username}</p>
                                {user.bio && <p className="text-sm text-gray-600 mt-1">{user.bio}</p>}
                              </div>
                              <Badge variant="secondary">{user.followersCount || 0} متابع</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="streams">
                  <div className="space-y-3">
                    {streams.map((stream: any) => (
                      <Card key={stream.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <Video className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{stream.title}</h4>
                              <p className="text-sm text-gray-600">@{stream.username}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="destructive" className="animate-pulse">مباشر</Badge>
                                <span className="text-sm text-gray-600">{stream.viewerCount || 0} مشاهد</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-600">لم نجد أي نتائج لبحثك "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mt-2">جرب البحث بكلمات مختلفة أو تأكد من الإملاء</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}