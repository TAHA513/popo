import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

export interface ZegoStreamConfig {
  userID: string;
  userName: string;
  roomID: string;
  streamID: string;
}

// ZegoCloud configuration - loaded from secure server endpoint
let ZEGO_APP_ID: number | null = null;
let zegoEngine: ZegoExpressEngine | null = null;

// Initialize with secure configuration from server
export async function initializeZegoConfig() {
  try {
    const response = await fetch('/api/zego-config', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    ZEGO_APP_ID = parseInt(data.appId || '0');
    console.log('🔒 ZegoCloud secure config initialized successfully');
  } catch (error) {
    console.error('❌ Failed to load secure ZegoCloud config:', error);
    throw new Error('فشل في تحميل إعدادات البث الآمنة');
  }
}

// Validate stream with server before starting
export async function validateStreamSecurity(zegoStreamId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/streams/validate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zegoStreamId: zegoStreamId
      })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.validated === true;
  } catch (error) {
    console.error('Stream validation failed:', error);
    return false;
  }
}

// Create ZegoCloud Engine
export function createZegoEngine(): ZegoExpressEngine {
  if (!ZEGO_APP_ID) {
    throw new Error('ZegoCloud App ID not configured');
  }

  zegoEngine = new ZegoExpressEngine(ZEGO_APP_ID, 'wss://webliveroom-api.zego.im/ws');
  console.log('🔧 ZegoCloud Engine created successfully');
  return zegoEngine;
}

// Login to room
export async function loginRoom(engine: ZegoExpressEngine, config: ZegoStreamConfig): Promise<void> {
  try {
    const user = {
      userID: config.userID,
      userName: config.userName,
    };

    await engine.loginRoom(config.roomID, user);
    console.log('✅ Successfully logged into room:', config.roomID);
  } catch (error) {
    console.error('❌ Failed to login room:', error);
    throw new Error('فشل في الدخول إلى غرفة البث');
  }
}

// Start publishing stream
export async function startPublishing(engine: ZegoExpressEngine, streamID: string, videoElement?: HTMLVideoElement): Promise<void> {
  try {
    // Get user media
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // Display local video if element provided
    if (videoElement) {
      videoElement.srcObject = localStream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
    }

    // Start publishing stream
    await engine.startPublishingStream(streamID, localStream);
    console.log('✅ Started publishing stream:', streamID);
  } catch (error) {
    console.error('❌ Failed to start publishing:', error);
    throw new Error('فشل في بدء البث المباشر');
  }
}

// Stop publishing stream
export async function stopPublishing(engine: ZegoExpressEngine, streamID: string): Promise<void> {
  try {
    await engine.stopPublishingStream(streamID);
    console.log('✅ Stopped publishing stream:', streamID);
  } catch (error) {
    console.error('❌ Failed to stop publishing:', error);
  }
}

// Logout from room
export async function logoutRoom(engine: ZegoExpressEngine): Promise<void> {
  try {
    await engine.logoutRoom();
    console.log('✅ Logged out from room');
  } catch (error) {
    console.error('❌ Failed to logout room:', error);
  }
}

// Destroy engine
export async function destroyEngine(engine: ZegoExpressEngine): Promise<void> {
  try {
    await engine.destroyEngine();
    zegoEngine = null;
    console.log('✅ ZegoCloud Engine destroyed');
  } catch (error) {
    console.error('❌ Failed to destroy engine:', error);
  }
}

// Utility functions
export function generateStreamID(userID: string): string {
  return `stream_${userID}_${Date.now()}`;
}

export function generateRoomID(streamTitle: string): string {
  const sanitized = streamTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `room_${sanitized}_${Date.now()}`;
}

// Room event listener
export function onRoomStateChanged(engine: ZegoExpressEngine, callback: (roomID: string, state: string, errorCode: number) => void): void {
  engine.on('roomStateChanged', callback);
}

// Stream update listener
export function onRoomStreamUpdate(engine: ZegoExpressEngine, callback: (roomID: string, updateType: string, streamList: any[]) => void): void {
  engine.on('roomStreamUpdate', (roomID: string, updateType: string, streamList: any[]) => {
    console.log(`🔄 Stream update in room ${roomID}: ${updateType}`, streamList);
    if (updateType === "ADD") {
      console.log("➕ New stream added");
    } else if (updateType === "DELETE") {
      console.log("➖ Stream removed");
    }
    callback(roomID, updateType, streamList);
  });
}