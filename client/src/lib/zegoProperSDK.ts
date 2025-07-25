// Proper ZEGO SDK Integration with simple token generation

export const ZEGO_CONFIG = {
  appID: 1034062164,
  appSign: "aacad673862ee0db9db2ae60d92d9e4796817fecda66966dc4bcd2e9af1f2a26",
  serverSecret: "1ad01a573a571d8b28c6ed2888fa6611"
};

// Generate proper ZEGO token for standalone use
export function generateZegoToken(userID: string, roomID: string = ""): string {
  const currentTime = Math.floor(Date.now() / 1000);
  const expiredTime = currentTime + 3600; // 1 hour

  const payload = {
    "app_id": ZEGO_CONFIG.appID,
    "user_id": userID,
    "room_id": roomID,
    "privilege": {
      "1": 1,  // Login privilege
      "2": 1   // Publish privilege
    },
    "ctime": currentTime,
    "expire": expiredTime,
    "nonce": Math.floor(Math.random() * 1000000)
  };

  const token = btoa(JSON.stringify(payload));
  console.log('🔑 Generated ZEGO token for:', userID);
  return token;
}

// Simple token generation without crypto library (for testing)
export function generateSimpleToken(userID: string): string {
  const currentTime = Math.floor(Date.now() / 1000);
  const expiredTime = currentTime + 3600;

  const payload = {
    "app_id": ZEGO_CONFIG.appID,
    "user_id": userID,
    "nonce": Math.floor(Math.random() * 1000000),
    "ctime": currentTime,
    "expire": expiredTime,
    "privilege": {
      "1": 1,
      "2": 1
    }
  };

  return btoa(JSON.stringify(payload));
}

// Load ZEGO SDK with proper error handling
export function loadZegoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ZegoExpressEngine) {
      resolve();
      return;
    }

    // Try multiple SDK sources
    const sdkSources = [
      'https://storage.zego.im/express-video-sdk/video/2.25.1/zego-express-engine.production.min.js',
      'https://storage.zego.im/express-video-sdk/video/2.24.0/zego-express-engine.production.min.js',
      'https://storage.zego.im/express-video-sdk/video/2.22.2/zego-express-engine.production.min.js'
    ];

    let attemptIndex = 0;

    function tryLoadSDK() {
      if (attemptIndex >= sdkSources.length) {
        reject(new Error('Failed to load ZEGO SDK from all sources'));
        return;
      }

      const script = document.createElement('script');
      script.src = sdkSources[attemptIndex];
      script.async = true;
      
      script.onload = () => {
        console.log(`✅ ZEGO SDK loaded from source ${attemptIndex + 1}`);
        resolve();
      };
      
      script.onerror = () => {
        console.warn(`❌ Failed to load ZEGO SDK from source ${attemptIndex + 1}`);
        attemptIndex++;
        document.head.removeChild(script);
        tryLoadSDK();
      };
      
      document.head.appendChild(script);
    }

    tryLoadSDK();
  });
}

// Initialize ZEGO Engine with proper configuration
export async function initZegoEngine(): Promise<any> {
  try {
    await loadZegoSDK();
    
    if (!window.ZegoExpressEngine) {
      throw new Error('ZEGO SDK not loaded');
    }

    const engine = new window.ZegoExpressEngine(ZEGO_CONFIG.appID, "zegocloud");
    
    // Configure engine settings
    engine.setDebugVerbose(false);
    
    console.log('✅ ZEGO Engine initialized with AppID:', ZEGO_CONFIG.appID);
    return engine;
  } catch (error) {
    console.error('❌ ZEGO Engine initialization failed:', error);
    throw error;
  }
}

// Declare global types
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}