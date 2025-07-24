import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Declare ZEGO types
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}

interface LiveStream {
  username: string;
  image: string;
  roomID: string;
  streamID: string;
  isLive: boolean;
}

export default function ZegoLivePage() {
  useEffect(() => {
    // Redirect to secure HTML page for ZEGO implementation
    window.location.href = '/zego-live-secure.html';
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">جاري التوجيه إلى صفحة البث المباشر الآمن...</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">جاري البحث عن البثوث المباشرة...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-5">
      <h1 className="text-3xl font-bold text-center text-cyan-400 mb-8">
        🎥 البثوث المباشرة الآن
      </h1>
      
      {streams.length === 0 ? (
        <div className="text-center text-gray-400 text-xl mt-20">
          لا توجد بثوث مباشرة حالياً
        </div>
      ) : (
        <div className="flex flex-wrap gap-5 justify-center mb-8">
          {streams.map((stream, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 w-60 text-center relative shadow-lg shadow-cyan-500/30"
            >
              <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 text-xs rounded">
                🔴 مباشر
              </div>
              <img
                src={stream.image}
                alt={stream.username}
                className="w-full rounded-lg mb-3"
              />
              <p className="text-lg font-semibold mb-3">{stream.username}</p>
              <button
                onClick={() => playStream(stream.roomID, stream.streamID)}
                className="bg-cyan-400 text-black px-4 py-2 rounded-lg font-bold hover:bg-cyan-300 transition-colors"
              >
                مشاهدة البث
              </button>
            </div>
          ))}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        className="w-full max-w-4xl mx-auto rounded-lg hidden"
        style={{ display: 'none' }}
      />
    </div>
  );
}