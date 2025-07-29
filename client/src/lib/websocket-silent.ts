import { useEffect, useRef, useState } from 'react';

// نسخة صامتة من WebSocket تتجنب الأخطاء في الكونسول
class SilentWebSocketManager {
  private ws: WebSocket | null = null;
  private isEnabled = false;

  connect() {
    // لا نحاول الاتصال إذا لم يتم تفعيل WebSocket
    if (!this.isEnabled) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const isDev = window.location.hostname === 'localhost';
      
      let wsUrl;
      if (isDev) {
        // Ensure we have a valid port for development
        const port = window.location.port || '5000';
        wsUrl = `ws://localhost:${port}/ws`;
      } else {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
      };
      
      this.ws.onerror = () => {
        // لا نعرض أخطاء في الكونسول
      };
      
      this.ws.onclose = () => {
        // لا نحاول إعادة الاتصال تلقائياً
      };
    } catch (error) {
      // تجاهل الأخطاء صامتاً
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  enable() {
    this.isEnabled = true;
    this.connect();
  }

  disable() {
    this.isEnabled = false;
    this.disconnect();
  }
}

const silentWsManager = new SilentWebSocketManager();

export function useSilentWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // لا نحاول الاتصال تلقائياً لتجنب الأخطاء
    const checkConnection = () => {
      setIsConnected(silentWsManager.isConnected());
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    isConnected: false, // دائماً false لتجنب الاعتماد على WebSocket
    sendMessage: () => false,
    subscribe: () => () => {},
    disconnect: () => silentWsManager.disconnect(),
    // وظائف إضافية للتوافق مع الكود الموجود
    joinStream: () => false,
    leaveStream: () => false,
    sendChatMessage: () => false,
    onViewerCountUpdate: () => () => {},
    onChatMessage: () => () => {},
    onGiftSent: () => () => {},
  };
}