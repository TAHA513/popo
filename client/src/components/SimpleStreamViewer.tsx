import React from 'react';
import type { Stream } from '../types/index';

interface SimpleStreamViewerProps {
  stream: Stream;
}

export default function SimpleStreamViewer({ stream }: SimpleStreamViewerProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <div className="text-center text-white max-w-md mx-auto px-8">
        {/* Live indicator with animation */}
        <div className="flex items-center justify-center mb-12">
          <div className="w-6 h-6 bg-red-600 rounded-full mr-3 animate-pulse shadow-lg"></div>
          <span className="text-red-400 text-2xl font-bold tracking-wider">مباشر</span>
        </div>
        
        {/* Main stream visual */}
        <div className="relative mb-12">
          <div className="w-48 h-48 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <span className="text-8xl">🔴</span>
          </div>
          {/* Pulse ring animation */}
          <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping"></div>
        </div>
        
        {/* Stream info */}
        <div className="space-y-6">
          <h2 className="text-4xl font-bold mb-4 text-right leading-tight">{stream.title}</h2>
          {stream.description && (
            <p className="text-xl opacity-80 text-right leading-relaxed">{stream.description}</p>
          )}
          
          {/* Live stats */}
          <div className="flex items-center justify-center space-x-6 text-lg">
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
              <span className="mr-2">👁️</span>
              <span className="font-semibold">{stream.viewerCount || 0} مشاهد</span>
            </div>
          </div>
          
          {/* Live message */}
          <div className="mt-8 p-6 bg-red-600/20 rounded-xl border border-red-500/30 backdrop-blur-sm">
            <p className="text-xl font-bold text-red-300 mb-2">🔴 البث المباشر نشط</p>
            <p className="text-base opacity-80">انضم للدردشة وأرسل الهدايا للمبث</p>
            <div className="mt-4 flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-green-400 font-semibold">متصل الآن</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}