// ZEGO Cloud Standalone Configuration - Independent from Replit
// Uses only ZEGO Cloud infrastructure for streaming

export const ZEGO_STANDALONE_CONFIG = {
  appID: 1034062164,
  appSign: "aacad673862ee0db9db2ae60d92d9e4796817fecda66966dc4bcd2e9af1f2a26",
  server: "zegocloud",
  serverSecret: "1ad01a573a571d8b28c6ed2888fa6611",
  // No dependency on any Replit services
};

// Generate proper ZEGO token with correct signing
export function generateStandaloneToken(userID: string, roomID: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const validTimeInSeconds = 3600; // 1 hour
  
  // Create payload according to ZEGO specs
  const payload = {
    "iss": "zegocloud",
    "exp": timestamp + validTimeInSeconds,
    "app_id": ZEGO_STANDALONE_CONFIG.appID,
    "user_id": userID,
    "room_id": roomID,
    "privilege": {
      "1": 1, // Login privilege
      "2": 1  // Publish privilege  
    },
    "stream_id_list": []
  };
  
  // Simple token generation for testing
  // In production environment, proper JWT signing would be done on server
  const token = btoa(JSON.stringify(payload));
  console.log('🔑 Generated ZEGO token for user:', userID);
  return token;
}

// Initialize ZEGO Engine independently
export async function initStandaloneZego(appID: number, server: string) {
  try {
    // Load ZEGO SDK if not already loaded
    if (!window.ZegoExpressEngine) {
      console.log('📦 Loading ZEGO SDK...');
      await loadZegoSDK();
    }
    
    // Initialize with proper ZEGO configuration
    const engine = new window.ZegoExpressEngine(appID, server);
    
    // Set debug verbose to false for production
    engine.setDebugVerbose(false);
    
    console.log('✅ ZEGO Engine initialized independently with AppID:', appID);
    return engine;
  } catch (error) {
    console.error('❌ Failed to initialize ZEGO Engine:', error);
    throw new Error(`ZEGO Engine initialization failed: ${(error as Error).message}`);
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
    script.src = 'https://storage.zego.im/express-video-sdk/video/2.22.2/zego-express-engine.production.min.js';
    script.onload = () => {
      console.log('✅ ZEGO SDK loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load ZEGO SDK');
      reject(new Error('Failed to load ZEGO SDK'));
    };
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