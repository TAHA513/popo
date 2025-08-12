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
  private downloadUrl: string = '';
  private lastUploadedUrl: string = '';
  private authToken: string | null = null; // Add authToken property
  private apiUrl: string | null = null; // Add apiUrl property

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
      const authResponse = await this.b2.authorize();
      
      // Check for transaction cap exceeded
      if (authResponse.status === 403 && authResponse.data?.code === 'transaction_cap_exceeded') {
        console.error('💰 B2 Transaction cap exceeded - service temporarily unavailable');
        this.initialized = false;
        throw new Error('B2_TRANSACTION_CAP_EXCEEDED');
      }
      
      // Assign values from authResponse
      this.authToken = authResponse.data.authorizationToken;
      this.apiUrl = authResponse.data.apiUrl;
      this.downloadUrl = authResponse.data.downloadUrl || 'https://f005.backblazeb2.com';
      console.log('✅ Backblaze B2 authorized successfully');
      console.log('🔗 Download URL:', this.downloadUrl);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Backblaze B2 authorization failed:', error);
      
      // Check if it's a transaction cap error
      if (error instanceof Error && error.message === 'B2_TRANSACTION_CAP_EXCEEDED') {
        this.initialized = false;
        throw new Error('B2_TRANSACTION_CAP_EXCEEDED');
      }
      
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as any;
        if (responseError.response?.data?.code === 'transaction_cap_exceeded') {
          this.initialized = false;
          throw new Error('B2_TRANSACTION_CAP_EXCEEDED');
        }
      }
      
      this.initialized = false;
      throw new Error('Failed to initialize Backblaze B2');
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Backblaze B2 not configured');
    }

    try {
      await this.initialize();
    } catch (error) {
      if (error instanceof Error && error.message === 'B2_TRANSACTION_CAP_EXCEEDED') {
        console.log('💰 B2 transaction cap exceeded - falling back to local storage');
        throw new Error('B2_TRANSACTION_CAP_EXCEEDED');
      }
      throw error;
    }

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

      console.log('📤 Upload response:', {
        fileName: uploadResponse.data.fileName,
        fileId: uploadResponse.data.fileId
      });

      console.log('✅ File uploaded successfully:', fileName);
      return `/api/media/b2/${fileName}`;

    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error);
      
      // Check for transaction cap exceeded during upload
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as any;
        if (responseError.response?.data?.code === 'transaction_cap_exceeded') {
          console.log('💰 B2 transaction cap exceeded during upload - falling back');
          throw new Error('B2_TRANSACTION_CAP_EXCEEDED');
        }
      }
      
      throw new Error(`Failed to upload file to Backblaze B2: ${error}`);
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    try {
      await this.initialize();

      // Since the bucket is private, we need to create an authorized URL
      const downloadAuthResponse = await this.b2.getDownloadAuthorization({
        bucketId: this.bucketId,
        fileNamePrefix: '', // Allow all files
        validDurationInSeconds: 86400 // 24 hours
      });

      const authToken = downloadAuthResponse.data.authorizationToken;
      const authorizedUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}?Authorization=${authToken}`;
      
      console.log('🔗 Created authorized URL for:', fileName);
      return authorizedUrl;
      
    } catch (error) {
      console.error('❌ Error getting authorized file URL:', error);
      // Fallback: try direct URL (might work for some configurations)
      const fallbackUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;
      console.log('🔄 Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
  }

  async getFileUrlWithAuth(fileName: string): Promise<string> {
    try {
      await this.initialize();

      // Check if file exists first
      const listResponse = await this.b2.listFileNames({
        bucketId: this.bucketId,
        startFileName: fileName,
        maxFileCount: 10
      });

      const file = listResponse.data.files.find((f: any) => f.fileName === fileName);
      if (!file) {
        console.log(`❌ File not found in B2: ${fileName}`);
        // Try with public URL anyway (in case the file exists but isn't returned in list)
        return `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;
      }

      console.log('📁 File found in B2:', file.fileName);

      // For private files, create authorized URL
      try {
        const downloadAuthResponse = await this.b2.getDownloadAuthorization({
          bucketId: this.bucketId,
          fileNamePrefix: fileName,
          validDurationInSeconds: 86400 // 24 hours
        });

        const authToken = downloadAuthResponse.data.authorizationToken;
        const authorizedUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}?Authorization=${authToken}`;
        
        console.log('🔗 Authorized B2 URL created for:', fileName);
        return authorizedUrl;
      } catch (authError) {
        console.log('⚠️ Auth failed, using public URL:', authError);
        return `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;
      }

    } catch (error) {
      console.error('❌ Error getting authorized file URL:', error);
      // Fallback: direct public URL
      const fallbackUrl = `${this.downloadUrl}/file/${this.bucketName}/${fileName}`;
      console.log('🔄 Using fallback URL:', fallbackUrl);
      return fallbackUrl;
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
    const hasCredentials = !!(
      process.env.B2_APPLICATION_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET_NAME &&
      process.env.B2_BUCKET_ID
    );
    
    // If we previously failed with transaction cap, mark as unavailable
    if (hasCredentials && this.initialized === false) {
      return false;
    }
    
    return hasCredentials;
  }

  // Method to check if B2 is temporarily unavailable due to transaction cap
  isTransactionCapExceeded(): boolean {
    return this.initialized === false && !!(
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

  // Get the last uploaded URL for debugging
  get lastUrl() {
    return this.lastUploadedUrl;
  }
}

// Export singleton instance
export const backblazeService = new BackblazeService();