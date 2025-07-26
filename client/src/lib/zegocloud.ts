import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

// ZegoCloud configuration
let ZEGO_APP_ID: number = 0;
let ZEGO_SERVER_SECRET: string = '';

// Initialize with app ID from server
export async function initializeZegoConfig() {
  try {
    const response = await fetch('/api/zego-config');
    const data = await response.json();
    ZEGO_APP_ID = parseInt(data.appId || '0');
    ZEGO_SERVER_SECRET = data.serverSecret || '';
    console.log('ZegoCloud config initialized:', { appId: ZEGO_APP_ID });
  } catch (error) {
    console.error('Failed to load ZegoCloud config:', error);
  }
}

let zegoEngine: ZegoExpressEngine | null = null;

export interface ZegoStreamConfig {
  userID: string;
  userName: string;
  roomID: string;
  streamID: string;
}

export class ZegoStreamManager {
  private engine: ZegoExpressEngine | null = null;
  private isInitialized = false;

  async initialize(config: ZegoStreamConfig): Promise<void> {
    if (this.isInitialized && this.engine) {
      return;
    }

    try {
      // Create ZegoExpressEngine instance
      this.engine = new ZegoExpressEngine(ZEGO_APP_ID, 'wss://webliveroom-api.zego.im/ws');
      
      console.log('ZegoCloud App ID:', ZEGO_APP_ID);

      this.isInitialized = true;
      console.log('ZegoCloud Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ZegoCloud:', error);
      throw new Error('فشل في تهيئة خدمة البث المباشر');
    }
  }

  async loginRoom(config: ZegoStreamConfig): Promise<void> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }

    try {
      const user = {
        userID: config.userID,
        userName: config.userName,
      };

      await this.engine.loginRoom(config.roomID, user);
      console.log('Logged into room:', config.roomID);
    } catch (error) {
      console.error('Failed to login room:', error);
      throw new Error('فشل في الدخول إلى غرفة البث');
    }
  }

  async startPublishing(streamID: string, videoElement?: HTMLVideoElement): Promise<void> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }

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
      await this.engine.startPublishingStream(streamID, localStream);
      console.log('Started publishing stream:', streamID);
    } catch (error) {
      console.error('Failed to start publishing:', error);
      throw new Error('فشل في بدء البث المباشر');
    }
  }

  async stopPublishing(streamID: string): Promise<void> {
    if (!this.engine) {
      return;
    }

    try {
      await this.engine.stopPublishingStream(streamID);
      console.log('Stopped publishing stream:', streamID);
    } catch (error) {
      console.error('Failed to stop publishing:', error);
    }
  }

  async startPlaying(streamID: string, videoElement: HTMLVideoElement): Promise<void> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }

    try {
      const remoteStream = await this.engine.startPlayingStream(streamID);
      videoElement.srcObject = remoteStream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      console.log('Started playing stream:', streamID);
    } catch (error) {
      console.error('Failed to start playing:', error);
      throw new Error('فشل في تشغيل البث');
    }
  }

  async stopPlaying(streamID: string): Promise<void> {
    if (!this.engine) {
      return;
    }

    try {
      await this.engine.stopPlayingStream(streamID);
      console.log('Stopped playing stream:', streamID);
    } catch (error) {
      console.error('Failed to stop playing:', error);
    }
  }

  async logoutRoom(): Promise<void> {
    if (!this.engine) {
      return;
    }

    try {
      await this.engine.logoutRoom();
      console.log('Logged out from room');
    } catch (error) {
      console.error('Failed to logout room:', error);
    }
  }

  async destroy(): Promise<void> {
    if (!this.engine) {
      return;
    }

    try {
      await this.engine.destroyEngine();
      this.engine = null;
      this.isInitialized = false;
      console.log('ZegoCloud Engine destroyed');
    } catch (error) {
      console.error('Failed to destroy engine:', error);
    }
  }

  // Event listeners
  onRoomStateChanged(callback: (roomID: string, state: string, errorCode: number) => void): void {
    if (this.engine) {
      this.engine.on('roomStateChanged', callback);
    }
  }

  onStreamAdded(callback: (roomID: string, streamList: any[]) => void): void {
    if (this.engine) {
      this.engine.on('streamAdded', callback);
    }
  }

  onStreamRemoved(callback: (roomID: string, streamList: any[]) => void): void {
    if (this.engine) {
      this.engine.on('streamRemoved', callback);
    }
  }
}

// Create singleton instance
export const zegoStreamManager = new ZegoStreamManager();

// Utility functions
export function generateStreamID(userID: string): string {
  return `stream_${userID}_${Date.now()}`;
}

export function generateRoomID(streamTitle: string): string {
  const sanitized = streamTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `room_${sanitized}_${Date.now()}`;
}