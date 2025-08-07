import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage, ChatMessage, Gift } from '@/types';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isDev = window.location.hostname === 'localhost';
    
    let wsUrl;
    if (isDev) {
      wsUrl = 'ws://localhost:5000/ws';
    } else {
      // For production Replit environment - ensure we have a valid host
      const host = window.location.host || window.location.hostname + ':5000';
      wsUrl = `${protocol}//${host}/ws`;
    }
    
    console.log('WebSocket connecting to:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.warn('WebSocket connection issue - will retry if needed');
        // Continue without breaking the application
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
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

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached - continuing without real-time features');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`WebSocket reconnect attempt (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, message not sent');
      return false;
    }
  }

  private handleMessage(message: any) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }
}

export const wsManager = new WebSocketManager();

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(wsManager);

  useEffect(() => {
    const ws = wsRef.current;
    ws.connect();

    const checkConnection = () => {
      setIsConnected(ws['ws']?.readyState === WebSocket.OPEN);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => {
      clearInterval(interval);
    };
  }, []);

  const joinStream = (streamId: number, userId?: string) => {
    wsRef.current.send({
      type: 'join_stream',
      streamId,
      userId,
    });
  };

  const leaveStream = () => {
    wsRef.current.send({
      type: 'leave_stream',
    });
  };

  const sendChatMessage = (text: string, user: any) => {
    wsRef.current.send({
      type: 'chat_message',
      text,
      user,
    });
  };

  const onViewerCountUpdate = (handler: (count: number) => void) => {
    wsRef.current.onMessage('viewer_count_update', (data) => {
      handler(data.count);
    });
  };

  const onChatMessage = (handler: (message: ChatMessage, user: any) => void) => {
    wsRef.current.onMessage('chat_message', (data) => {
      handler(data.message, data.user);
    });
  };

  const onGiftSent = (handler: (gift: Gift, sender: any) => void) => {
    wsRef.current.onMessage('gift_sent', (data) => {
      handler(data.gift, data.sender);
    });
  };

  return {
    isConnected,
    joinStream,
    leaveStream,
    sendChatMessage,
    onViewerCountUpdate,
    onChatMessage,
    onGiftSent,
  };
}
