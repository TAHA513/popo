// Centralized WebSocket URL helper to prevent localhost:undefined errors
export function getWebSocketUrl(): string {
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Development environment detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:5000/ws';
    }
    
    // Production environment - use current domain
    if (port && port !== '80' && port !== '443') {
      return `${protocol}//${hostname}:${port}/ws`;
    } else {
      return `${protocol}//${hostname}/ws`;
    }
  } catch (error) {
    console.error('Error constructing WebSocket URL:', error);
    // Fallback for any URL construction errors
    return `ws://${window.location.host || 'localhost:5000'}/ws`;
  }
}

// Safe WebSocket connection with error handling
export function createSafeWebSocket(url?: string): WebSocket | null {
  try {
    const wsUrl = url || getWebSocketUrl();
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    // Validate URL before creating WebSocket
    if (!wsUrl || wsUrl.includes('undefined')) {
      console.error('Invalid WebSocket URL detected:', wsUrl);
      return null;
    }
    
    return new WebSocket(wsUrl);
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    return null;
  }
}