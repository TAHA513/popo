import React from 'react';
import LiveStreamPlayer from './LiveStreamPlayer';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  const { user } = useAuth();
  const isStreamer = user?.id === stream.hostId;
  
  return <LiveStreamPlayer stream={stream} isStreamer={isStreamer} />;
}