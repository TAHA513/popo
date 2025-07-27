import React from 'react';
import FullScreenLiveStream from './FullScreenLiveStream';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  const { user } = useAuth();
  const isStreamer = user?.id === stream.hostId;
  
  return <FullScreenLiveStream stream={stream} isStreamer={isStreamer} />;
}