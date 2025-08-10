import React from 'react';
import EnhancedStreamInterface from './EnhancedStreamInterface';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  const { user } = useAuth();
  const isStreamer = user?.id === stream.hostId;
  
  return <EnhancedStreamInterface stream={stream} isStreamer={isStreamer} />;
}