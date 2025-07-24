// ZegoCloud Live Streaming Integration
// تكامل ZegoCloud للبث المباشر

export interface ZegoStreamConfig {
  appId: string;
  appSign: string;
  userId: string;
  userName: string;
  roomId: string;
  streamTitle: string;
}

export interface ZegoStreamResponse {
  success: boolean;
  streamUrl?: string;
  playUrl?: string;
  error?: string;
}

export class ZegoCloudService {
  private appId: string;
  private appSign: string;
  private zg: any = null;

  constructor(appId: string, appSign: string) {
    this.appId = appId;
    this.appSign = appSign;
  }

  // تهيئة ZegoCloud SDK
  async initializeSDK(): Promise<boolean> {
    try {
      // تحميل ZegoCloud SDK ديناميكياً
      if (!window.ZegoExpressEngine) {
        const script = document.createElement('script');
        script.src = 'https://zego-zjs.netlify.app/zego-express-engine-webrtc/index.js';
        script.onload = () => {
          console.log('✅ ZegoCloud SDK loaded successfully');
        };
        document.head.appendChild(script);
        
        // انتظار تحميل SDK
        await new Promise(resolve => {
          const checkSDK = () => {
            if (window.ZegoExpressEngine) {
              resolve(true);
            } else {
              setTimeout(checkSDK, 100);
            }
          };
          checkSDK();
        });
      }

      // إنشاء ZegoExpressEngine instance
      this.zg = new window.ZegoExpressEngine(parseInt(this.appId), 'https://webliveroom-api.zego.im/ws');
      console.log('✅ ZegoCloud engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ZegoCloud:', error);
      return false;
    }
  }

  // بدء البث المباشر
  async startLiveStream(config: ZegoStreamConfig): Promise<ZegoStreamResponse> {
    try {
      if (!this.zg) {
        const initialized = await this.initializeSDK();
        if (!initialized) {
          return { success: false, error: 'فشل في تهيئة ZegoCloud' };
        }
      }

      // تسجيل الدخول إلى الغرفة
      const loginResult = await this.zg.loginRoom(
        config.roomId,
        {
          userID: config.userId,
          userName: config.userName
        }
      );

      if (loginResult) {
        console.log('✅ Successfully joined room:', config.roomId);
        
        // الحصول على وسائط المستخدم
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });

        // بدء النشر
        const publishResult = await this.zg.startPublishingStream(
          `stream_${config.roomId}_${config.userId}`,
          stream
        );

        if (publishResult) {
          const streamUrl = `https://webliveroom-api.zego.im/stream_${config.roomId}_${config.userId}`;
          const playUrl = `https://webliveroom-api.zego.im/play_${config.roomId}_${config.userId}`;
          
          return {
            success: true,
            streamUrl,
            playUrl
          };
        }
      }

      return { success: false, error: 'فشل في بدء البث' };
    } catch (error) {
      console.error('❌ Error starting live stream:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  }

  // إيقاف البث المباشر
  async stopLiveStream(roomId: string, streamId: string): Promise<boolean> {
    try {
      if (this.zg) {
        await this.zg.stopPublishingStream(streamId);
        await this.zg.logoutRoom(roomId);
        console.log('✅ Live stream stopped successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error stopping live stream:', error);
      return false;
    }
  }

  // مشاهدة البث المباشر
  async watchLiveStream(roomId: string, streamId: string, videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      if (!this.zg) {
        const initialized = await this.initializeSDK();
        if (!initialized) return false;
      }

      // تسجيل الدخول كمشاهد
      const loginResult = await this.zg.loginRoom(roomId, {
        userID: `viewer_${Date.now()}`,
        userName: `مشاهد_${Date.now()}`
      });

      if (loginResult) {
        // بدء مشاهدة البث
        const remoteStream = await this.zg.startPlayingStream(streamId);
        if (remoteStream && videoElement) {
          videoElement.srcObject = remoteStream;
          videoElement.play();
          console.log('✅ Started watching live stream');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error watching live stream:', error);
      return false;
    }
  }

  // إحصائيات البث
  async getStreamStats(streamId: string): Promise<any> {
    try {
      if (this.zg) {
        return await this.zg.getPublishStreamQuality(streamId);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting stream stats:', error);
      return null;
    }
  }
}

// تصدير instance جاهز
export const zegoService = new ZegoCloudService(
  process.env.VITE_ZEGOCLOUD_APP_ID || '',
  process.env.VITE_ZEGOCLOUD_APP_SIGN || ''
);

// إضافة types للـ Window
declare global {
  interface Window {
    ZegoExpressEngine: any;
  }
}