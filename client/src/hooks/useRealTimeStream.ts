import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebSocketSafe } from './useWebSocketSafe';

interface StreamConnection {
  streamId: number;
  isStreamer: boolean;
  mediaStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export function useRealTimeStream() {
  const [connections, setConnections] = useState<Map<string, StreamConnection>>(new Map());
  const [isStreamingVideo, setIsStreamingVideo] = useState(false);
  const [viewerStreams, setViewerStreams] = useState<Map<string, MediaStream>>(new Map());
  const { sendMessage, subscribe, isConnected } = useWebSocketSafe();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // إعداد MediaStream للصاميم
  const initializeStreamerCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('❌ خطأ في الوصول للكاميرا:', error);
      throw error;
    }
  }, []);

  // بدء البث كصاميمر
  const startStreaming = useCallback(async (streamId: number) => {
    try {
      const stream = await initializeStreamerCamera();
      setIsStreamingVideo(true);
      
      // إرسال إشارة بدء البث عبر WebSocket
      sendMessage({
        type: 'start_live_stream',
        streamId,
        streamerData: {
          hasVideo: true,
          hasAudio: true
        }
      });
      
      console.log('✅ تم بدء البث المباشر:', streamId);
      return stream;
    } catch (error) {
      console.error('❌ فشل في بدء البث:', error);
      throw error;
    }
  }, [initializeStreamerCamera, sendMessage]);

  // إيقاف البث
  const stopStreaming = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsStreamingVideo(false);
    
    sendMessage({
      type: 'stop_live_stream'
    });
    
    console.log('🛑 تم إيقاف البث المباشر');
  }, [localStream, sendMessage]);

  // انضمام كمشاهد للبث
  const joinStreamAsViewer = useCallback((streamId: number, userId: string) => {
    sendMessage({
      type: 'join_live_stream',
      streamId,
      userId,
      role: 'viewer'
    });
    
    console.log('👁️ انضمام للبث كمشاهد:', streamId);
  }, [sendMessage]);

  // مغادرة البث كمشاهد  
  const leaveStreamAsViewer = useCallback(() => {
    sendMessage({
      type: 'leave_live_stream'
    });
    
    console.log('🚪 مغادرة البث المباشر');
  }, [sendMessage]);

  // استقبال إشارات البث المباشر
  useEffect(() => {
    const unsubscribeLiveStream = subscribe('live_stream_data', (data: any) => {
      console.log('📺 استقبال بيانات البث المباشر:', data);
      
      if (data.type === 'video_frame' && data.streamId) {
        // في التطبيق الحقيقي، هنا سنعالج إطارات الفيديو
        // لكن للبساطة، سنستخدم نهج مختلف
      }
    });

    const unsubscribeStreamStart = subscribe('stream_started', (data: any) => {
      console.log('🎬 بدأ بث جديد:', data);
    });

    const unsubscribeStreamEnd = subscribe('stream_ended', (data: any) => {
      console.log('🔚 انتهى البث:', data);
      // تنظيف الاتصالات
      setViewerStreams(new Map());
    });

    return () => {
      unsubscribeLiveStream();
      unsubscribeStreamStart();
      unsubscribeStreamEnd();
    };
  }, [subscribe]);

  // تنظيف الموارد عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      connections.forEach(conn => {
        if (conn.peerConnection) {
          conn.peerConnection.close();
        }
      });
    };
  }, [localStream, connections]);

  return {
    // للصاميمر
    localVideoRef,
    localStream,
    isStreamingVideo,
    startStreaming,
    stopStreaming,
    initializeStreamerCamera,
    
    // للمشاهدين
    viewerStreams,
    joinStreamAsViewer,
    leaveStreamAsViewer,
    
    // معلومات عامة
    isConnected,
    connections
  };
}