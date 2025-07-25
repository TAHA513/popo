import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuthFixed';
import ZegoLivePublisher from './ZegoLivePublisher';
import ZegoLiveViewer from './ZegoLiveViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface ZegoStreamingInterfaceProps {
  mode: 'publisher' | 'viewer';
  streamData?: {
    streamID: string;
    roomID: string;
    title: string;
    publisherName: string;
  };
}

export default function ZegoStreamingInterface({ mode, streamData }: ZegoStreamingInterfaceProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [streamTitle, setStreamTitle] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [currentStreamData, setCurrentStreamData] = useState(streamData);

  useEffect(() => {
    if (mode === 'viewer' && streamData) {
      setIsReady(true);
      setCurrentStreamData(streamData);
    }
  }, [mode, streamData]);

  const handleStartStream = () => {
    if (!streamTitle.trim()) {
      return;
    }

    const newStreamData = {
      streamID: `stream_${user?.id}_${Date.now()}`,
      roomID: `room_${user?.id}_${Date.now()}`,
      title: streamTitle,
      publisherName: user?.firstName || user?.username || 'مستخدم'
    };

    setCurrentStreamData(newStreamData);
    setIsReady(true);
  };

  const handleEndStream = () => {
    setIsReady(false);
    setCurrentStreamData(undefined);
    setStreamTitle('');
    setLocation('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold mb-2">تسجيل الدخول مطلوب</h3>
            <p className="text-gray-600 mb-4">يجب تسجيل الدخول لاستخدام البث المباشر</p>
            <Button onClick={() => setLocation('/login')} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show stream setup for publisher mode
  if (mode === 'publisher' && !isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-center mb-6 text-white">
              🔴 بدء بث مباشر
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عنوان البث
                </label>
                <Input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="أدخل عنوان البث..."
                  className="bg-gray-800 border-gray-700 text-white"
                  maxLength={50}
                />
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                <p className="text-yellow-400 text-sm text-center">
                  ⚠️ يرجى التأكد من محتوى البث مناسب وآمن لجميع المشاهدين
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleStartStream}
                  disabled={!streamTitle.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  بدء البث 🔴
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show ZEGO components when ready
  if (isReady && currentStreamData) {
    if (mode === 'publisher') {
      return (
        <ZegoLivePublisher
          streamTitle={currentStreamData.title}
          roomID={currentStreamData.roomID}
          onStreamEnd={handleEndStream}
        />
      );
    } else if (mode === 'viewer') {
      return (
        <ZegoLiveViewer
          streamID={currentStreamData.streamID}
          roomID={currentStreamData.roomID}
          streamTitle={currentStreamData.title}
          publisherName={currentStreamData.publisherName}
          onBack={() => setLocation('/')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>جاري التحضير...</p>
      </div>
    </div>
  );
}