import React from 'react';
import RealLiveStream from './RealLiveStream';
import { Stream } from '@/types';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  return <RealLiveStream stream={stream} />;
}