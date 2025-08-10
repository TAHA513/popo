import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Initialize Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ 
    secure: true 
  });
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
  bytes: number;
}

export function uploadToCloudinary(fileBuffer: Buffer, options: {
  folder?: string;
  resourceType?: 'auto' | 'image' | 'video' | 'raw';
  publicId?: string;
} = {}): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'laabobo-media',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId,
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type as 'image' | 'video' | 'raw',
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

export function isCloudinaryEnabled(): boolean {
  return !!process.env.CLOUDINARY_URL;
}

export function deleteFromCloudinary(publicId: string): Promise<any> {
  return cloudinary.uploader.destroy(publicId);
}