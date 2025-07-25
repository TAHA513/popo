import React from 'react';
import { useRoute } from 'wouter';
import ZegoStreamingInterface from '@/components/ZegoStreamingInterface';

export default function ZegoViewer() {
  const [match, params] = useRoute('/zego-viewer/:streamId/:roomId/:title/:publisherName');
  
  if (!match || !params) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">البث غير متاح</h3>
          <p>معرف البث غير صحيح</p>
        </div>
      </div>
    );
  }

  const streamData = {
    streamID: params.streamId,
    roomID: params.roomId,
    title: decodeURIComponent(params.title),
    publisherName: decodeURIComponent(params.publisherName)
  };

  return <ZegoStreamingInterface mode="viewer" streamData={streamData} />;
}