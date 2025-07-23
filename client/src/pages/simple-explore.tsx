import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User,
  Search
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleExplore() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // المنشورات العامة
  const { data: memories = [] } = useQuery<any[]>({
    queryKey: ['/api/memories/public'], 
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-40">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">استكشاف</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* الفيديوهات والصور فقط */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {memories.map((memory: any) => (
              <div key={`memory-${memory.id}`} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {memory.imageUrl ? (
                  memory.imageUrl.includes('.mp4') || memory.imageUrl.includes('.webm') ? (
                    <video 
                      src={memory.imageUrl}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={memory.imageUrl}
                      alt="صورة"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}