import React from 'react';
import type { Stream } from '../types/index';

interface SimpleStreamViewerProps {
  stream: Stream;
}

export default function SimpleStreamViewer({ stream }: SimpleStreamViewerProps) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <div className="text-center text-white">
        {/* Live indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-4 h-4 bg-red-600 rounded-full mr-2 animate-pulse"></div>
          <span className="text-red-600 text-xl font-bold">LIVE</span>
        </div>
        
        {/* Stream info */}
        <div className="w-40 h-40 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <span className="text-6xl">🎥</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">{stream.title}</h2>
        <p className="text-lg opacity-75 mb-4">{stream.description}</p>
        
        {/* Viewer count */}
        <div className="flex items-center justify-center text-sm opacity-60">
          <span className="mr-2">👁️</span>
          <span>{stream.viewerCount} مشاهد</span>
        </div>
      </div>
    </div>
  );
}