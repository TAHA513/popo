// Centralized WebSocket URL helper - always use production for unified data
export function getWebSocketUrl(): string {
  try {
    // Always use production WebSocket for unified data access
    const productionWsUrl = 'wss://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev/ws';
    console.log('🔗 Using unified production WebSocket:', productionWsUrl);
    return productionWsUrl;
  } catch (error) {
    console.error('Error constructing WebSocket URL:', error);
    // Fallback to production WebSocket
    return 'wss://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev/ws';
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