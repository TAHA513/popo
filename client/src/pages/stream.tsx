import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import NewStreamingInterface from "@/components/NewStreamingInterface";

type StreamPageParams = {
  id: string;
};

export default function StreamPage() {
  const { id } = useParams<StreamPageParams>();

  const { data: stream, isLoading, error } = useQuery({
    queryKey: ['/api/streams', id],
    queryFn: async () => {
      const response = await fetch(`/api/streams/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('فشل في تحميل البث');
      }
      return response.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-white text-lg">جاري تحميل البث...</div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">البث غير متاح</h2>
          <p className="text-white/80">لم نتمكن من العثور على هذا البث</p>
        </div>
      </div>
    );
  }

  return <NewStreamingInterface stream={stream} />;
}