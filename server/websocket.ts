import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

interface StreamData {
  title: string;
  hostId: string;
  viewers: Set<WebSocket>;
  likes: number;
  comments: string[];
}

class LiveStreamingServer {
  private wss: WebSocketServer;
  private streams: Map<string, StreamData> = new Map();
  private connections: Map<WebSocket, { type: 'host' | 'viewer'; streamId?: string }> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/live-stream-ws' // Use specific path to avoid conflicts
    });
    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('WebSocket Live Streaming Server initialized on /live-stream-ws');
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    console.log('New WebSocket connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    console.log('WebSocket message received:', message);

    switch (message.type) {
      case 'start_stream':
        this.startStream(ws, message);
        break;
      case 'join_stream':
        this.joinStream(ws, message);
        break;
      case 'like':
        this.handleLike(ws);
        break;
      case 'comment':
        this.handleComment(ws, message);
        break;
      case 'end_stream':
        this.endStream(ws);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startStream(ws: WebSocket, message: any) {
    const streamId = `stream_${Date.now()}`;
    const streamData: StreamData = {
      title: message.title || 'بث مباشر',
      hostId: message.hostId || 'unknown',
      viewers: new Set(),
      likes: 0,
      comments: []
    };

    this.streams.set(streamId, streamData);
    this.connections.set(ws, { type: 'host', streamId });

    console.log(`Stream started: ${streamId}`);
    
    // Notify host that stream started
    ws.send(JSON.stringify({
      type: 'stream_started',
      streamId,
      message: 'تم بدء البث المباشر بنجاح'
    }));

    // Broadcast to all potential viewers that a new stream is available
    this.broadcastToAll({
      type: 'new_stream_available',
      streamId,
      title: streamData.title
    });
  }

  private joinStream(ws: WebSocket, message: any) {
    // For simplicity, auto-join the latest active stream
    const activeStreams = Array.from(this.streams.entries());
    
    if (activeStreams.length > 0) {
      const [streamId, streamData] = activeStreams[activeStreams.length - 1];
      
      streamData.viewers.add(ws);
      this.connections.set(ws, { type: 'viewer', streamId });

      console.log(`Viewer joined stream: ${streamId}`);

      // Send current stream data to new viewer
      ws.send(JSON.stringify({
        type: 'stream_data',
        title: streamData.title,
        viewerCount: streamData.viewers.size,
        likes: streamData.likes
      }));

      // Notify all viewers of updated viewer count
      this.broadcastToStream(streamId, {
        type: 'viewer_count',
        count: streamData.viewers.size
      });

      // Notify host of new viewer
      this.notifyHost(streamId, {
        type: 'viewer_joined',
        viewerCount: streamData.viewers.size
      });
    } else {
      // No active streams
      ws.send(JSON.stringify({
        type: 'no_active_streams',
        message: 'لا توجد بثوث مباشرة حالياً'
      }));
    }
  }

  private handleLike(ws: WebSocket) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.streamId) return;

    const streamData = this.streams.get(connection.streamId);
    if (!streamData) return;

    streamData.likes++;

    // Broadcast like to all viewers and host
    this.broadcastToStream(connection.streamId, {
      type: 'like',
      totalLikes: streamData.likes
    });

    console.log(`Like received for stream ${connection.streamId}, total: ${streamData.likes}`);
  }

  private handleComment(ws: WebSocket, message: any) {
    const connection = this.connections.get(ws);
    if (!connection || !connection.streamId) return;

    const streamData = this.streams.get(connection.streamId);
    if (!streamData) return;

    const comment = message.message || '';
    if (comment.trim()) {
      streamData.comments.push(comment);
      
      // Keep only last 50 comments
      if (streamData.comments.length > 50) {
        streamData.comments = streamData.comments.slice(-50);
      }

      // Broadcast comment to all viewers and host
      this.broadcastToStream(connection.streamId, {
        type: 'comment',
        message: comment
      });

      console.log(`Comment received for stream ${connection.streamId}: ${comment}`);
    }
  }

  private endStream(ws: WebSocket) {
    const connection = this.connections.get(ws);
    if (!connection || connection.type !== 'host' || !connection.streamId) return;

    const streamId = connection.streamId;
    const streamData = this.streams.get(streamId);
    
    if (streamData) {
      // Notify all viewers that stream ended
      streamData.viewers.forEach(viewer => {
        viewer.send(JSON.stringify({
          type: 'stream_ended',
          message: 'انتهى البث المباشر'
        }));
      });

      // Remove stream
      this.streams.delete(streamId);
      console.log(`Stream ended: ${streamId}`);
    }

    this.connections.delete(ws);
  }

  private handleDisconnection(ws: WebSocket) {
    const connection = this.connections.get(ws);
    if (!connection) return;

    if (connection.type === 'host' && connection.streamId) {
      // Host disconnected, end the stream
      this.endStream(ws);
    } else if (connection.type === 'viewer' && connection.streamId) {
      // Viewer disconnected
      const streamData = this.streams.get(connection.streamId);
      if (streamData) {
        streamData.viewers.delete(ws);
        
        // Update viewer count
        this.broadcastToStream(connection.streamId, {
          type: 'viewer_count',
          count: streamData.viewers.size
        });

        this.notifyHost(connection.streamId, {
          type: 'viewer_left',
          viewerCount: streamData.viewers.size
        });
      }
    }

    this.connections.delete(ws);
  }

  private broadcastToStream(streamId: string, message: any) {
    const streamData = this.streams.get(streamId);
    if (!streamData) return;

    const messageStr = JSON.stringify(message);
    
    // Send to all viewers
    streamData.viewers.forEach(viewer => {
      if (viewer.readyState === WebSocket.OPEN) {
        viewer.send(messageStr);
      }
    });
  }

  private notifyHost(streamId: string, message: any) {
    // Find host connection for this stream
    for (const [ws, connection] of Array.from(this.connections.entries())) {
      if (connection.type === 'host' && connection.streamId === streamId) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
        break;
      }
    }
  }

  private broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    Array.from(this.connections.entries()).forEach(([ws, connection]) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  public getActiveStreams() {
    return Array.from(this.streams.entries()).map(([id, data]) => ({
      id,
      title: data.title,
      hostId: data.hostId,
      viewerCount: data.viewers.size,
      likes: data.likes
    }));
  }
}

export default LiveStreamingServer;