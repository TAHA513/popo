import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// Initialize Google Cloud Storage for Replit Object Storage
const storage = new Storage();

// Get bucket configuration from environment variables
const bucketId = process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-b9b8cbbd-6b8d-4fcb-b924-c5e56e084f16';
const bucket = storage.bucket(bucketId);

export interface UploadResult {
  filename: string;
  publicUrl: string;
  privateUrl?: string;
}

/**
 * Upload a file to Object Storage
 * @param filePath - Local file path
 * @param fileName - Desired filename in storage
 * @param isPublic - Whether the file should be publicly accessible
 * @returns Upload result with URLs
 */
export async function uploadFileToStorage(
  filePath: string, 
  fileName: string, 
  isPublic: boolean = true
): Promise<UploadResult> {
  try {
    // Determine the directory based on visibility
    const directory = isPublic ? 'public' : '.private';
    const destination = `${directory}/${fileName}`;

    console.log(`🔄 Uploading file to Object Storage: ${destination}`);

    // Upload file to the bucket
    const [file] = await bucket.upload(filePath, {
      destination,
      metadata: {
        cacheControl: 'public, max-age=3600', // 1 hour cache
      },
    });

    console.log(`✅ File uploaded successfully: ${destination}`);

    // Generate URLs
    const publicUrl = isPublic ? 
      `https://storage.googleapis.com/${bucketId}/${destination}` : 
      '';

    const privateUrl = !isPublic ? 
      await generateSignedUrl(destination) : 
      undefined;

    // Clean up local file after successful upload
    try {
      await fs.promises.unlink(filePath);
      console.log(`🧹 Cleaned up local file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Could not delete local file: ${filePath}`);
    }

    return {
      filename: fileName,
      publicUrl: publicUrl || privateUrl || '',
      privateUrl
    };

  } catch (error) {
    console.error('❌ Error uploading file to Object Storage:', error);
    throw new Error('فشل في رفع الملف إلى التخزين السحابي');
  }
}

/**
 * Upload buffer directly to Object Storage
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  isPublic: boolean = true
): Promise<UploadResult> {
  try {
    const directory = isPublic ? 'public' : '.private';
    const destination = `${directory}/${fileName}`;

    console.log(`🔄 Uploading buffer to Object Storage: ${destination}`);

    const file = bucket.file(destination);
    
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=3600',
      },
    });

    console.log(`✅ Buffer uploaded successfully: ${destination}`);

    const publicUrl = isPublic ? 
      `https://storage.googleapis.com/${bucketId}/${destination}` : 
      '';

    const privateUrl = !isPublic ? 
      await generateSignedUrl(destination) : 
      undefined;

    return {
      filename: fileName,
      publicUrl: publicUrl || privateUrl || '',
      privateUrl
    };

  } catch (error) {
    console.error('❌ Error uploading buffer to Object Storage:', error);
    throw new Error('فشل في رفع الملف إلى التخزين السحابي');
  }
}

/**
 * Generate a signed URL for private files
 */
async function generateSignedUrl(filePath: string, expirationMinutes: number = 60): Promise<string> {
  try {
    const file = bucket.file(filePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + (expirationMinutes * 60 * 1000), // Convert minutes to milliseconds
    });
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw new Error('فشل في إنشاء رابط الملف');
  }
}

/**
 * Delete a file from Object Storage
 */
export async function deleteFileFromStorage(fileName: string, isPublic: boolean = true): Promise<void> {
  try {
    const directory = isPublic ? 'public' : '.private';
    const filePath = `${directory}/${fileName}`;
    
    const file = bucket.file(filePath);
    await file.delete();
    
    console.log(`🗑️ File deleted from Object Storage: ${filePath}`);
  } catch (error) {
    console.error('❌ Error deleting file from Object Storage:', error);
    // Don't throw error for deletion failures
  }
}

/**
 * Check if a file exists in Object Storage
 */
export async function fileExistsInStorage(fileName: string, isPublic: boolean = true): Promise<boolean> {
  try {
    const directory = isPublic ? 'public' : '.private';
    const filePath = `${directory}/${fileName}`;
    
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    return exists;
  } catch (error) {
    console.error('❌ Error checking file existence:', error);
    return false;
  }
}

/**
 * Generate a unique filename with timestamp and random suffix
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const randomSuffix = Math.random().toString(36).substring(7);
  return `${timestamp}-${randomSuffix}${ext}`;
}