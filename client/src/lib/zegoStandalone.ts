// ZEGO Cloud Standalone Configuration - Independent from Replit
// Uses only ZEGO Cloud infrastructure for streaming

export const ZEGO_STANDALONE_CONFIG = {
  appID: 1034062164,
  appSign: "aacad673862ee0db9db2ae60d92d9e4796817fecda66966dc4bcd2e9af1f2a26",
  server: "wss://webliveroom1034062164-api.coolzcloud.com/ws",
  // No dependency on any Replit services
};

// Generate client-side token without server dependency
export function generateStandaloneToken(userID: string, roomID: string): string {
  // Simple client-side token generation for ZEGO
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.floor(Math.random() * 1000000);
  
  // Create a simple token based on ZEGO requirements
  const payload = {
    app_id: ZEGO_STANDALONE_CONFIG.appID,
    user_id: userID,
    room_id: roomID,
    privilege: {
      1: 1, // Login privilege
      2: 1  // Publish privilege
    },
    stream_id_list: [],
    iat: timestamp,
    exp: timestamp + 3600 // 1 hour expiration
  };
  
  // For testing purposes, return a base64 encoded payload
  // In production, this would be properly signed with ServerSecret
  return btoa(JSON.stringify(payload));
}

// Initialize ZEGO Engine independently
export async function initStandaloneZego(appID: number, server: string) {
  try {
    // Load ZEGO SDK if not already loaded
    if (!window.ZegoExpressEngine) {
      await loadZegoSDK();
    }
    
    const engine = new window.ZegoExpressEngine(appID, server);
    console.log('✅ ZEGO Engine initialized independently');
    return engine;
  } catch (error) {
    console.error('❌ Failed to initialize ZEGO Engine:', error);
    throw error;
  }
}

// Load ZEGO SDK dynamically
function loadZegoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ZegoExpressEngine) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/zego-express-engine-webrtc@2.25.0/index.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ZEGO SDK'));
    document.head.appendChild(script);
  });
}

// Create room and user objects
export function createZegoUser(userID: string, userName: string) {
  return {
    userID,
    userName
  };
}

export function createZegoRoom(roomID: string, roomName: string) {
  return {
    roomID,
    roomName
  };
}

// Declare global ZEGO types
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}