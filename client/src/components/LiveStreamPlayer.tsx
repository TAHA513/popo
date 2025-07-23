import { useEffect, useRef, useState } from 'react';
import { Stream } from '@/types';

interface LiveStreamPlayerProps {
  stream: Stream;
  isStreamer: boolean;
}

export default function LiveStreamPlayer({ stream, isStreamer }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamStatus, setStreamStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    const initializePlayer = async () => {
      if (!videoRef.current) return;

      try {
        if (isStreamer) {
          // For streamers, show their own camera feed
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true; // Avoid feedback
          setStreamStatus('connected');
        } else {
          // For viewers - immediately show connected state
          setStreamStatus('connected');
        }
      } catch (error) {
        console.error('❌ Error initializing stream player:', error);
        setStreamStatus('error');
      }
    };

    initializePlayer();

    return () => {
      if (videoRef.current?.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream.id, isStreamer]);

  if (streamStatus === 'loading') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold mb-2">🔴 جاري الاتصال بالبث</p>
          <p className="text-lg font-semibold">{stream.title}</p>
          <p className="text-sm opacity-75 mt-2">انتظر قليلاً...</p>
        </div>
      </div>
    );
  }

  if (streamStatus === 'error') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-6xl mb-4">⚠️</p>
          <p className="text-xl font-bold mb-2">خطأ في البث</p>
          <p className="text-sm opacity-75">تعذر تحميل البث المباشر</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {isStreamer ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        // For viewers - show actual live stream content
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-2xl">
              <span className="text-5xl">🔴</span>
            </div>
            <p className="text-3xl font-bold mb-4">البث المباشر</p>
            <p className="text-xl font-semibold mb-4">{stream.title}</p>
            <p className="text-sm opacity-75 mb-6">
              البث المباشر نشط الآن
            </p>
            <div className="bg-red-600 px-6 py-3 rounded-full flex items-center justify-center mx-auto w-fit">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-3"></div>
              <span className="text-white text-lg font-bold">مباشر الآن</span>
            </div>
            <p className="text-xs opacity-50 mt-4">
              ملاحظة: لعرض الفيديو الحقيقي، نحتاج خدمة بث متخصصة
            </p>
          </div>
        </div>
      )}
      
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none"></div>
    </div>
  );
}