import React from 'react';
import ZegoStreamingInterface from '@/components/ZegoStreamingInterface';

export default function SimpleLiveStreaming() {
  // Use the new ZEGO streaming interface for publishing
  return <ZegoStreamingInterface mode="publisher" />;
}