// Enhanced Cloud Storage System for LaaBoBo - asaad111 Style Implementation
import { Storage } from "@google-cloud/storage";
import { promises as fs } from 'fs';
import path from 'path';

const BUCKET_ID = "replit-objstore-b9b8cbbd-6b8d-4fcb-b924-c5e56e084f16";
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Cloud storage client for stable cross-environment storage
export const cloudStorage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class StableStorageService {
  private bucket = cloudStorage.bucket(BUCKET_ID);

  // Upload file with stable naming like asaad111
  async uploadStableFile(
    fileBuffer: Buffer,
    stableFilename: string,
    isPublic: boolean = true
  ): Promise<string> {
    const objectPath = isPublic ? `public/${stableFilename}` : `.private/${stableFilename}`;
    const file = this.bucket.file(objectPath);
    
    // Upload to cloud storage
    await file.save(fileBuffer);
    
    // Return stable cloud path that works across all environments
    return `/${BUCKET_ID}/${objectPath}`;
  }

  // Get stable cloud path for existing files
  getStableCloudPath(filename: string, isPublic: boolean = true): string {
    const objectPath = isPublic ? `public/${filename}` : `.private/${filename}`;
    return `/${BUCKET_ID}/${objectPath}`;
  }

  // Save to both local and cloud for maximum stability
  async saveStableFile(
    fileBuffer: Buffer,
    stableFilename: string,
    isPublic: boolean = true
  ): Promise<{ localPath: string; cloudPath: string }> {
    // Save locally for immediate access
    const localPath = path.join('uploads', stableFilename);
    await fs.writeFile(localPath, fileBuffer);
    
    // Upload to cloud for cross-environment stability
    const cloudPath = await this.uploadStableFile(fileBuffer, stableFilename, isPublic);
    
    return { localPath: `/uploads/${stableFilename}`, cloudPath };
  }

  // Generate stable filename based on user and type
  generateStableFilename(
    userId: string, 
    username: string, 
    type: 'profile' | 'cover' | 'memory' | 'general',
    extension: string,
    extra?: string
  ): string {
    const timestamp = Date.now();
    const cleanUsername = username?.replace(/[^a-zA-Z0-9]/g, '') || 'user';
    
    switch (type) {
      case 'profile':
        return `profile-${userId}-${cleanUsername}${extension}`;
      case 'cover':
        return `cover-${userId}-${cleanUsername}${extension}`;
      case 'memory':
        return `memory-${userId}-${cleanUsername}-${timestamp}${extra ? `-${extra}` : ''}${extension}`;
      case 'general':
        return `file-${userId}-${cleanUsername}-${timestamp}${extension}`;
      default:
        return `${type}-${userId}-${cleanUsername}-${timestamp}${extension}`;
    }
  }
}

// Export singleton instance
export const stableStorage = new StableStorageService();