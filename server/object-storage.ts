import path from 'path';
import fs from 'fs';

// For now, use a more robust local storage approach
// In Replit, we'll create a persistent uploads directory
const uploadsDir = '/tmp/uploads';
const fsPromises = fs.promises;

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
    const objectPath = `/${bucketId}/${directory}/${fileName}`;

    console.log(`🔄 Uploading file to Object Storage: ${objectPath}`);

    // Read the file and copy to object storage path
    const fileData = await fsPromises.readFile(filePath);
    
    // Ensure directory exists
    const dirPath = path.dirname(objectPath);
    await fsPromises.mkdir(dirPath, { recursive: true });
    
    // Write file to object storage
    await fsPromises.writeFile(objectPath, fileData);

    console.log(`✅ File uploaded successfully: ${objectPath}`);

    // Generate public URL for Replit Object Storage
    const publicUrl = isPublic ? 
      `https://storage.googleapis.com${objectPath}` : 
      '';

    // Clean up local file after successful upload
    try {
      await fsPromises.unlink(filePath);
      console.log(`🧹 Cleaned up local file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Could not delete local file: ${filePath}`);
    }

    return {
      filename: fileName,
      publicUrl: publicUrl,
      privateUrl: !isPublic ? publicUrl : undefined
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
    const objectPath = `/${bucketId}/${directory}/${fileName}`;

    console.log(`🔄 Uploading buffer to Object Storage: ${objectPath}`);

    // Ensure directory exists
    const dirPath = path.dirname(objectPath);
    await fsPromises.mkdir(dirPath, { recursive: true });
    
    // Write buffer to object storage
    await fsPromises.writeFile(objectPath, buffer);

    console.log(`✅ Buffer uploaded successfully: ${objectPath}`);

    // Generate public URL for Replit Object Storage
    const publicUrl = isPublic ? 
      `https://storage.googleapis.com${objectPath}` : 
      '';

    return {
      filename: fileName,
      publicUrl: publicUrl,
      privateUrl: !isPublic ? publicUrl : undefined
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