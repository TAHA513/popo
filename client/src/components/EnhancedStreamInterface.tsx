import React, { useState, useEffect } from 'react';
import { Stream } from '@/types';
import NewLiveStreamer from './NewLiveStreamer';
import NewLiveViewer from './NewLiveViewer';

interface EnhancedStreamInterfaceProps {
  stream: Stream;
  isStreamer: boolean;
}

export default function EnhancedStreamInterface({ stream, isStreamer }: EnhancedStreamInterfaceProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    // Simulate connection process
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">جاري الاتصال بالبث...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-red-400">
          <p>خطأ في الاتصال بالبث</p>
          <button 
            onClick={() => setConnectionStatus('connecting')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return isStreamer ? (
    <NewLiveStreamer stream={stream} onClose={() => window.history.back()} />
  ) : (
    <NewLiveViewer stream={stream} onClose={() => window.history.back()} />
  );
}