import { useState, useEffect, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
}

class SafeWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();
  private isEnabled = true;

  connect() {
    if (!this.isEnabled) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      // تحسين URL الاتصال لتجنب الأخطاء
      const wsUrl = this.getWebSocketUrl();
      console.log('📡 WebSocket connecting to:', wsUrl);
      
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
          console.warn('Failed to parse WebSocket message, continuing without real-time');
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected');
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = () => {
        console.warn('WebSocket connection issue - will retry');
      };
    } catch (error) {
      console.warn('WebSocket failed to connect, continuing without real-time features');
      this.attemptReconnect();
    }
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isDev = window.location.hostname === 'localhost';
    
    if (isDev) {
      return 'ws://localhost:5000/ws';
    } else {
      // استخدام نفس المضيف والبورت للنشر
      return `${protocol}//${window.location.host}/ws`;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message.data);
      } catch (error) {
        console.warn('Error handling WebSocket message, continuing');
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached - continuing without real-time features');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.warn('Failed to send WebSocket message');
        return false;
      }
    }
    return false;
  }

  on(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
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

  disable() {
    this.isEnabled = false;
    this.disconnect();
  }

  enable() {
    this.isEnabled = true;
    this.connect();
  }
}

const wsManager = new SafeWebSocketManager();

export function useWebSocketSafe() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(wsManager);

  useEffect(() => {
    const ws = wsRef.current;
    
    // محاولة الاتصال بشكل آمن
    try {
      ws.connect();
    } catch (error) {
      console.warn('WebSocket connection failed, continuing without real-time features');
    }

    const checkConnection = () => {
      setIsConnected(ws.isConnected());
    };

    const interval = setInterval(checkConnection, 3000);
    checkConnection();

    return () => {
      clearInterval(interval);
    };
  }, []);

  const sendMessage = (message: any) => {
    try {
      return wsRef.current.send(message);
    } catch (error) {
      console.warn('Failed to send message, continuing without real-time');
      return false;
    }
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
      if (data && typeof data.count === 'number') {
        handler(data.count);
      }
    });
  };

  const onChatMessage = (handler: (message: any, user: any) => void) => {
    return subscribe('chat_message', (data: any) => {
      if (data && data.message && data.user) {
        handler(data.message, data.user);
      }
    });
  };

  const onGiftSent = (handler: (gift: any, sender: any) => void) => {
    return subscribe('gift_sent', (data: any) => {
      if (data && data.gift && data.sender) {
        handler(data.gift, data.sender);
      }
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
    enable: () => wsRef.current.enable(),
    disable: () => wsRef.current.disable(),
  };
}