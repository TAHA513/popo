import React from 'react';
import SimpleZegoStream from './SimpleZegoStream';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  const { user } = useAuth();
  const isStreamer = user?.id === stream.hostId;
  
  return <SimpleZegoStream stream={stream} isStreamer={isStreamer} />;
}