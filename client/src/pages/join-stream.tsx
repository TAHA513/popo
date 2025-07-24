import React, { useRef, useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// ZegoCloud SDK Integration for Viewers
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

export default function JoinStream() {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // تحميل ZegoCloud SDK
  useEffect(() => {
    const loadZegoSDK = () => {
      if (window.ZegoUIKitPrebuilt) {
        setIsInitialized(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js';
      script.onload = () => {
        console.log('✅ ZegoCloud SDK loaded');
        setIsInitialized(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load ZegoCloud SDK');
      };
      document.head.appendChild(script);
    };

    loadZegoSDK();
  }, []);

  // الانضمام للبث كمشاهد
  useEffect(() => {
    if (!isInitialized || !window.ZegoUIKitPrebuilt || !roomId) return;

    const joinAsViewer = async () => {
      try {
        const appID = parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '');
        const serverSecret = import.meta.env.VITE_ZEGOCLOUD_APP_SIGN || '';
        
        if (!appID || !serverSecret) {
          console.error('ZegoCloud credentials missing');
          return;
        }

        const userID = `viewer_${Date.now()}`;
        const userName = `مشاهد_${Math.random().toString(36).substr(2, 5)}`;

        // إنشاء token للمشاهد
        const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userID,
          userName
        );

        // إعداد المشاهد
        const zp = window.ZegoUIKitPrebuilt.create(kitToken);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          
          // الانضمام كمشاهد
          zp.joinRoom({
            container: containerRef.current,
            scenario: {
              mode: window.ZegoUIKitPrebuilt.LiveStreaming,
              config: {
                role: window.ZegoUIKitPrebuilt.Audience, // دور المشاهد
              },
            },
            onJoinRoom: () => {
              console.log('✅ انضم كمشاهد');
            },
            onLeaveRoom: () => {
              console.log('👋 غادر المشاهد');
              setLocation('/');
            },
            onError: (error: any) => {
              console.error('❌ ZegoCloud viewer error:', error);
            }
          });
        }

      } catch (error) {
        console.error('❌ خطأ في الانضمام:', error);
      }
    };

    joinAsViewer();
  }, [isInitialized, roomId, setLocation]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>جاري تحميل البث...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* ZegoCloud Viewer Container */}
      <div ref={containerRef} className="w-full h-screen" />
      
      {/* زر الخروج */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          onClick={() => setLocation('/')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          خروج
        </Button>
      </div>
    </div>
  );
}