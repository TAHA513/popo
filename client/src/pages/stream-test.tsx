import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Button } from '@/components/ui/button';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';

export default function StreamTestPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomId] = useState(`test_room_${Date.now()}`);

  const startHostTest = async () => {
    if (!user || !streamContainerRef.current) return;

    try {
      const config = await apiRequest('/api/zego-config', 'GET');
      
      const hostUserId = `host_${user.id}_${Date.now()}`;
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        hostUserId,
        user.username || 'مذيع'
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      await zp.joinRoom({
        container: streamContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          }
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        layout: "Auto",
        maxUsers: 10,
        onJoinRoom: () => {
          console.log('✅ Host test started successfully!');
          setIsHost(true);
        }
      });

    } catch (error) {
      console.error('❌ Host test failed:', error);
    }
  };

  const startViewerTest = async () => {
    if (!user || !streamContainerRef.current) return;

    try {
      const config = await apiRequest('/api/zego-config', 'GET');
      
      const viewerUserId = `viewer_${user.id}_${Date.now()}`;
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        viewerUserId,
        user.username || 'مشاهد'
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      await zp.joinRoom({
        container: streamContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Audience,
          }
        },
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        layout: "Auto",
        maxUsers: 10,
        onJoinRoom: () => {
          console.log('✅ Viewer test started successfully!');
        }
      });

    } catch (error) {
      console.error('❌ Viewer test failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-4">🧪 اختبار البث المباشر</h1>
          <p className="text-gray-300 mb-4">
            Room ID: <span className="text-blue-400 font-mono">{roomId}</span>
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Button 
              onClick={startHostTest}
              className="bg-red-600 hover:bg-red-700"
            >
              🎥 اختبار كمذيع
            </Button>
            <Button 
              onClick={startViewerTest}
              className="bg-blue-600 hover:bg-blue-700"
            >
              👁️ اختبار كمشاهد
            </Button>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              🏠 العودة
            </Button>
          </div>
        </div>

        {/* حاوية الاختبار */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div 
            ref={streamContainerRef}
            className="w-full min-h-[400px] bg-black rounded-lg"
          />
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>💡 افتح نافذتين: واحدة كمذيع والثانية كمشاهد لاختبار البث</p>
          <p>🔗 شارك Room ID مع أصدقائك للانضمام كمشاهدين</p>
        </div>
      </div>
    </div>
  );
}