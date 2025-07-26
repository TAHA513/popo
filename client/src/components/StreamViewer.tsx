import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Radio, Volume2 } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  const { user } = useAuth();
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const isStreamer = user?.id === stream.hostId;

  useEffect(() => {
    // Simulate dynamic viewer count for engagement
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Main Stream Display */}
      <div className="w-full h-full relative">
        {/* Live Stream Simulation for Viewers */}
        <div className="w-full h-full bg-gradient-to-br from-purple-800 via-pink-600 to-blue-700 relative overflow-hidden">
          {/* Animated background layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-blue-500/10 to-purple-500/10 animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Central streamer representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white relative">
              {/* Large profile avatar */}
              <div className="w-48 h-48 bg-white/95 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-8 border-white/50 relative">
                <span className="text-7xl font-bold text-purple-600">
                  {((stream as any).hostName || stream.hostId || 'S')[0]?.toUpperCase()}
                </span>
                
                {/* Speaking indicator */}
                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-ping"></div>
                <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-green-400 rounded-full border-4 border-white"></div>
              </div>
              
              {/* Streamer info */}
              <h1 className="text-4xl font-bold mb-4">{(stream as any).hostName || 'مضيف البث'}</h1>
              <h2 className="text-2xl mb-3">{stream.title || 'بث مباشر'}</h2>
              <p className="text-xl opacity-90 mb-6">يتحدث مباشرة الآن</p>
              
              {/* Live status indicators */}
              <div className="flex items-center justify-center gap-6 text-lg mb-8">
                <div className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-full">
                  <Radio className="w-6 h-6 animate-pulse" />
                  <span className="font-semibold">بث مباشر</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/80 px-4 py-2 rounded-full">
                  <Volume2 className="w-6 h-6" />
                  <span className="font-semibold">صوت نشط</span>
                </div>
              </div>
              
              {/* Stream description */}
              {stream.description && (
                <p className="text-lg opacity-80 max-w-md mx-auto">
                  {stream.description}
                </p>
              )}
            </div>
          </div>

          {/* Floating particles for visual appeal */}
          <div className="absolute top-16 left-16 w-6 h-6 bg-white/40 rounded-full animate-bounce"></div>
          <div className="absolute top-24 right-24 w-4 h-4 bg-yellow-300/50 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-24 w-4 h-4 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-28 right-20 w-3 h-3 bg-pink-300/60 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/3 left-12 w-3 h-3 bg-blue-300/50 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-12 w-4 h-4 bg-green-300/40 rounded-full animate-bounce" style={{animationDelay: '2.5s'}}></div>
        </div>

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            {/* Close button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              className="bg-red-600/90 hover:bg-red-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
            >
              <X className="w-7 h-7" />
            </Button>

            {/* Stream status */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-red-600/90 backdrop-blur-sm px-5 py-3 rounded-full flex items-center space-x-3 rtl:space-x-reverse shadow-lg">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-lg font-bold">مباشر</span>
              </div>
              
              <div className="bg-black/60 backdrop-blur-sm px-4 py-3 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg">
                <Eye className="w-5 h-5 text-white" />
                <span className="text-white text-lg font-bold">{viewerCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom overlay with stream info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white text-2xl font-bold mb-2">{stream.title || 'بث مباشر'}</h2>
            {stream.description && (
              <p className="text-white/90 text-lg mb-3">{stream.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-sm">
                <span>المضيف: {(stream as any).hostName || 'مضيف البث'}</span>
                <span className="mx-2">•</span>
                <span>التصنيف: {stream.category || 'بث سريع'}</span>
              </div>
              <div className="text-white/80 text-sm">
                بدأ منذ {Math.floor((Date.now() - new Date(stream.startedAt!).getTime()) / 60000)} دقيقة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}