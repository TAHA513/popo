// ZEGO Cloud Configuration
export const ZEGO_CONFIG = {
  appID: parseInt(import.meta.env.VITE_ZEGOCLOUD_APP_ID || '1034062164'),
  appSign: import.meta.env.VITE_ZEGOCLOUD_APP_SIGN || '',
  server: import.meta.env.VITE_ZEGO_SERVER || 'https://frozenway-default-rtdb.europe-west1.firebasedatabase.app/', // fallback server
};

// ZEGO Express Engine interface
declare global {
  interface Window {
    ZegoExpressEngine: any;
    zg: any;
  }
}

export interface ZegoUser {
  userID: string;
  userName: string;
}

export interface ZegoRoom {
  roomID: string;
  config?: {
    userUpdate?: boolean;
    maxMemberCount?: number;
  };
}

export interface ZegoStream {
  streamID: string;
  extraInfo?: string;
}

// Initialize ZEGO Express Engine
export const initZegoEngine = async (appID: number, server: string) => {
  try {
    if (window.ZegoExpressEngine) {
      console.log('✅ ZEGO Engine already loaded');
      return window.ZegoExpressEngine;
    }

    // Dynamically load ZEGO Express Engine
    await loadZegoScript();
    
    if (!window.ZegoExpressEngine) {
      throw new Error('ZEGO Express Engine not found after loading script');
    }

    console.log('✅ ZEGO Express Engine loaded successfully');
    return window.ZegoExpressEngine;
  } catch (error) {
    console.error('❌ Failed to initialize ZEGO Engine:', error);
    throw error;
  }
};

// Load ZEGO script dynamically
const loadZegoScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="zego-express-engine"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/zego-express-engine-webrtc@3.11.0/index.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ZEGO script'));
    document.head.appendChild(script);
  });
};

// Generate ZEGO token from server
export const generateZegoToken = async (userID: string): Promise<string> => {
  try {
    const response = await fetch('/api/zego/token', {
      method: 'GET',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate ZEGO token');
    }

    const data = await response.json();
    console.log('✅ ZEGO token received from server');
    return data.token;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    throw error;
  }
};