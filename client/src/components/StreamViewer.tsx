import React from 'react';
import ZegoStreamViewer from './ZegoStreamViewer';
import { Stream } from '@/types';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  return <ZegoStreamViewer stream={stream} />;
}