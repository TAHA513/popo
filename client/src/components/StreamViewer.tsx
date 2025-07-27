import React from 'react';
import DirectStreamViewer from './DirectStreamViewer';
import { Stream } from '@/types';

interface StreamViewerProps {
  stream: Stream;
}

export default function StreamViewer({ stream }: StreamViewerProps) {
  return <DirectStreamViewer stream={stream} />;
}