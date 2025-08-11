
// @ts-ignore
import B2 from 'backblaze-b2';
import { nanoid } from 'nanoid';
import path from 'path';

// Backblaze B2 Cloud Storage Service
export class BackblazeService {
  private b2: any;
  private bucketName: string;
  private bucketId: string;
  private initialized = false;

  constructor() {
    this.bucketName = process.env.B2_BUCKET_NAME || '';
    this.bucketId = process.env.B2_BUCKET_ID || '';
    
    if (this.isAvailable()) {
      this.b2 = new B2({
        applicationKeyId: process.env.B2_APPLICATION_KEY_ID || '',
        applicationKey: process.env.B2_APPLICATION_KEY || ''
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized || !this.isAvailable()) return;
    
    try {
      console.log('🔄 Initializing Backblaze B2...');
      await this.b2.authorize();
      console.log('✅ Backblaze B2 authorized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Backblaze B2 authorization failed:', error);
      throw new Error('Failed to initialize Backblaze B2');
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Backblaze B2 not configured');
    }

    await this.initialize();
    
    try {
      console.log(`📤 Uploading ${fileName} to Backblaze B2...`);
      
      // Get upload URL
      const uploadUrlResponse = await this.b2.getUploadUrl({
        bucketId: this.bucketId
      });

      // Upload file
      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrlResponse.data.uploadUrl,
        uploadAuthToken: uploadUrlResponse.data.authorizationToken,
        fileName: fileName,
        data: buffer,
        contentType: contentType
      });

      // Generate public URL
      const publicUrl = `/api/media/${fileName}`;
      
      console.log(`✅ File uploaded successfully: ${fileName}`);
      console.log(`🔗 Public URL: ${publicUrl}`);
      return publicUrl;
      
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error);
      throw new Error(`Failed to upload file to Backblaze B2: ${error}`);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    if (!this.isAvailable()) return;

    await this.initialize();
    
    try {
      console.log(`🗑️ Deleting ${fileName} from Backblaze B2...`);
      
      // Get file info first
      const listResponse = await this.b2.listFileNames({
        bucketId: this.bucketId,
        startFileName: fileName,
        maxFileCount: 1
      });

      const file = listResponse.data.files.find((f: any) => f.fileName === fileName);
      if (file) {
        await this.b2.deleteFileVersion({
          fileId: file.fileId,
          fileName: fileName
        });
        console.log(`✅ File deleted successfully: ${fileName}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to delete ${fileName}:`, error);
      // Don't throw error for delete operations
    }
  }

  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Clean filename for B2 compatibility
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${timestamp}_${randomId}_${cleanBaseName}${ext}`;
  }

  isAvailable(): boolean {
    return !!(
      process.env.B2_APPLICATION_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET_NAME &&
      process.env.B2_BUCKET_ID
    );
  }

  // Expose b2 instance for direct API calls
  get b2Instance() {
    return this.b2;
  }
}

// Export singleton instance
export const backblazeService = new BackblazeService();

// Export class for direct instantiation if needed
export { BackblazeService as BackblazeB2Service };
