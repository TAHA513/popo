import { useState, useEffect, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.cleanup();

    try {
      // تحسين اتصال WebSocket للعمل في بيئة Replit
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      let wsUrl;
      if (isDev) {
        // للتطوير المحلي
        wsUrl = 'ws://localhost:5000/ws';
      } else {
        // لبيئة Replit الإنتاجية
        const host = window.location.host;
        if (!host) {
          console.warn('⚠️ Unable to determine WebSocket host, skipping connection');
          return;
        }
        wsUrl = `${protocol}//${host}/ws`;
      }

      console.log('🔗 WebSocket connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.warn('⚠️ WebSocket error - will attempt reconnect if needed:', error);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ Max WebSocket reconnect attempts reached - continuing without real-time features');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`🔄 WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    this.cleanup();
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message.data);
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error);
      }
    });
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
        return false;
      }
    }
    console.warn('⚠️ WebSocket not connected, cannot send message');
    return false;
  }

  on(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  off(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const wsManager = new WebSocketManager();

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(wsManager);

  useEffect(() => {
    const ws = wsRef.current;

    // محاولة الاتصال
    try {
      ws.connect();
    } catch (error) {
      console.warn('WebSocket connection failed, continuing without real-time features');
    }

    const checkConnection = () => {
      setIsConnected(ws.isConnected());
    };

    const interval = setInterval(checkConnection, 2000);
    checkConnection();

    return () => {
      clearInterval(interval);
    };
  }, []);

  const sendMessage = (message: any) => {
    return wsRef.current.send(message);
  };

  const subscribe = (type: string, handler: Function) => {
    wsRef.current.on(type, handler);
    return () => wsRef.current.off(type, handler);
  };

  const joinStream = (streamId: number, userId?: string) => {
    return sendMessage({
      type: 'join_stream',
      streamId,
      userId,
    });
  };

  const leaveStream = () => {
    return sendMessage({
      type: 'leave_stream',
    });
  };

  const sendChatMessage = (text: string, user: any) => {
    return sendMessage({
      type: 'chat_message',
      text,
      user,
    });
  };

  const onViewerCountUpdate = (handler: (count: number) => void) => {
    return subscribe('viewer_count_update', (data: any) => {
      handler(data.count);
    });
  };

  const onChatMessage = (handler: (message: any, user: any) => void) => {
    return subscribe('chat_message', (data: any) => {
      handler(data.message, data.user);
    });
  };

  const onGiftSent = (handler: (gift: any, sender: any) => void) => {
    return subscribe('gift_sent', (data: any) => {
      handler(data.gift, data.sender);
    });
  };

  return {
    isConnected,
    sendMessage,
    subscribe,
    disconnect: () => wsRef.current.disconnect(),
    joinStream,
    leaveStream,
    sendChatMessage,
    onViewerCountUpdate,
    onChatMessage,
    onGiftSent,
  };
}