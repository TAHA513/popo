import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

export default function LiveViewer() {
  const [, setLocation] = useLocation();
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<string[]>([]);
  const [streamTitle, setStreamTitle] = useState('بث مباشر');
  const [isConnected, setIsConnected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to live stream via WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live-stream-ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Viewer connected to live stream');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'join_stream', viewerId: 'viewer_' + Date.now() }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Viewer received:', data);
      
      switch (data.type) {
        case 'stream_data':
          setStreamTitle(data.title || 'بث مباشر');
          setViewerCount(data.viewerCount || 0);
          setLikes(data.likes || 0);
          break;
        case 'viewer_count':
          setViewerCount(data.count);
          break;
        case 'like':
          setLikes(prev => prev + 1);
          break;
        case 'comment':
          setComments(prev => [...prev.slice(-10), data.message]);
          break;
        case 'stream_ended':
          setIsConnected(false);
          alert('انتهى البث المباشر');
          setLocation('/');
          break;
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from live stream');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [setLocation]);

  const sendLike = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'like' }));
    }
  };

  const sendComment = (message: string) => {
    if (wsRef.current && isConnected && message.trim()) {
      wsRef.current.send(JSON.stringify({ type: 'comment', message }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Stream Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-red-500' : 'bg-gray-500'}`}></div>
              <span className={`font-semibold ${isConnected ? 'text-red-400' : 'text-gray-400'}`}>
                {isConnected ? 'مباشر' : 'غير متصل'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{streamTitle}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main video area */}
          <div className="lg:col-span-3">
            <div className="relative bg-black rounded-lg overflow-hidden">
              {isConnected ? (
                <div className="w-full h-96 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📹</div>
                    <h3 className="text-2xl font-bold mb-2">البث المباشر</h3>
                    <p className="text-gray-200">متصل مع المضيف</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">📴</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-400">البث غير متاح</h3>
                    <p className="text-gray-500">في انتظار الاتصال...</p>
                  </div>
                </div>
              )}
              
              {/* Viewer interaction buttons */}
              <div className="absolute bottom-4 right-4 flex flex-col space-y-3">
                <button
                  onClick={sendLike}
                  disabled={!isConnected}
                  className="p-3 rounded-full bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm transition-all disabled:opacity-50"
                >
                  ❤️
                </button>
                <button
                  onClick={() => sendComment('👏')}
                  disabled={!isConnected}
                  className="p-3 rounded-full bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-sm transition-all disabled:opacity-50"
                >
                  👏
                </button>
                <button
                  onClick={() => sendComment('🔥')}
                  disabled={!isConnected}
                  className="p-3 rounded-full bg-orange-500/80 hover:bg-orange-600/80 backdrop-blur-sm transition-all disabled:opacity-50"
                >
                  🔥
                </button>
              </div>
            </div>
          </div>

          {/* Stats and chat sidebar */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">إحصائيات البث</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">👁️ المشاهدين</span>
                  <span className="font-bold text-blue-400">{viewerCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">❤️ الإعجابات</span>
                  <span className="font-bold text-red-400">{likes}</span>
                </div>
              </div>
            </div>

            {/* Live comments */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">التعليقات المباشرة</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm">لا توجد تعليقات بعد</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="text-sm text-gray-200 bg-white/5 rounded p-2">
                      {comment}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={sendLike}
                  disabled={!isConnected}
                  className="bg-red-500/80 hover:bg-red-600/80 py-2 px-3 rounded text-sm font-medium transition-all disabled:opacity-50"
                >
                  ❤️ إعجاب
                </button>
                <button
                  onClick={() => sendComment('رائع!')}
                  disabled={!isConnected}
                  className="bg-blue-500/80 hover:bg-blue-600/80 py-2 px-3 rounded text-sm font-medium transition-all disabled:opacity-50"
                >
                  💬 رائع
                </button>
                <button
                  onClick={() => sendComment('مذهل!')}
                  disabled={!isConnected}
                  className="bg-green-500/80 hover:bg-green-600/80 py-2 px-3 rounded text-sm font-medium transition-all disabled:opacity-50"
                >
                  ⭐ مذهل
                </button>
                <button
                  onClick={() => setLocation('/')}
                  className="bg-gray-600/80 hover:bg-gray-700/80 py-2 px-3 rounded text-sm font-medium transition-all"
                >
                  🏠 الرئيسية
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}