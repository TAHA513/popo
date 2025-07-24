import { useState, useEffect } from 'react';

export default function LiveStatus() {
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLiveStreams = () => {
      // Connect to WebSocket to get live stream status
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-stream-ws`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Connected to check live streams');
        ws.send(JSON.stringify({ type: 'get_active_streams' }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'active_streams') {
          setStreams(data.streams || []);
          setIsLoading(false);
        }
      };
      
      ws.onclose = () => {
        setIsLoading(false);
      };

      return () => ws.close();
    };

    checkLiveStreams();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p>جاري البحث عن البثوث المباشرة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">البثوث المباشرة</h1>
          <p className="text-gray-300">
            {streams.length > 0 
              ? `يوجد ${streams.length} بث مباشر الآن`
              : 'لا توجد بثوث مباشرة حالياً'
            }
          </p>
        </div>

        {streams.length === 0 ? (
          <div className="text-center">
            <div className="text-6xl mb-6">📺</div>
            <h2 className="text-2xl font-bold mb-4">لا توجد بثوث مباشرة</h2>
            <p className="text-gray-400 mb-8">كن أول من يبدأ بث مباشر!</p>
            <a
              href="/simple-live"
              className="inline-block bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 py-3 px-8 rounded-lg font-bold transition-all duration-200"
            >
              🔴 ابدأ بث مباشر
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <div key={stream.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 font-semibold">مباشر</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3">{stream.title}</h3>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>👁️ المشاهدون</span>
                    <span className="font-bold text-blue-400">{stream.viewerCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>❤️ الإعجابات</span>
                    <span className="font-bold text-red-400">{stream.likes}</span>
                  </div>
                </div>

                <a
                  href="/live-viewer"
                  className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  انضم للبث
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}