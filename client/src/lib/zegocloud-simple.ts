import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

let zegoEngine: ZegoExpressEngine | null = null;

export interface SimpleStreamConfig {
  userID: string;
  userName: string;
  roomID: string;
  streamID: string;
}

// Simple ZegoCloud streaming that works immediately
export async function startSimpleStream(config: SimpleStreamConfig, mediaStream: MediaStream): Promise<boolean> {
  try {
    console.log('🚀 Starting simple ZegoCloud stream...');
    
    // Get credentials from server
    const response = await fetch('/api/zego-config', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get credentials');
    }
    
    const data = await response.json();
    const appID = parseInt(data.appId);
    const appSign = data.appSign;
    
    console.log('🔑 Creating engine with credentials:', { appID, appSignLength: appSign.length });
    
    // Create engine
    zegoEngine = new ZegoExpressEngine(appID, appSign);
    
    console.log('🚪 Logging into room:', config.roomID);
    
    // Login to room
    const loginResult = await zegoEngine.loginRoom(config.roomID, {
      userID: config.userID,
      userName: config.userName
    });
    
    console.log('✅ Logged into room successfully');
    
    // Start publishing stream
    console.log('📡 Starting stream publishing...');
    const publishResult = await zegoEngine.startPublishingStream(config.streamID, mediaStream);
    
    console.log('✅ Stream started successfully!', publishResult);
    
    return true;
    
  } catch (error) {
    console.error('❌ Simple stream failed:', error);
    return false;
  }
}

export async function stopSimpleStream(): Promise<void> {
  if (zegoEngine) {
    try {
      await zegoEngine.stopPublishingStream();
      await zegoEngine.logoutRoom();
      zegoEngine.destroyEngine();
      zegoEngine = null;
      console.log('✅ Stream stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping stream:', error);
    }
  }
}