import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function WatchStreamPage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/live-chat');
  }, [setLocation]);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
        <p className="text-lg">جاري التحويل للدردشة المباشرة...</p>
      </div>
    </div>
  );
}