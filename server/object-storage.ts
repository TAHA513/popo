import { nanoid } from 'nanoid';
import { Storage, File } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs/promises';

// Object Storage Configuration - حل هجين للحفظ في Replit و Render
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const IS_REPLIT = process.env.REPLIT_DEPLOYMENT === "1" || process.env.REPLIT_DEV_DOMAIN;
const FALLBACK_MEDIA_DIR = '/tmp/persistent-media';

export interface UploadResult {
  filename: string;
  publicUrl: string;
}

// إعداد Object Storage Client (Replit only)
let objectStorageClient: Storage | null = null;

if (IS_REPLIT) {
  try {
    objectStorageClient = new Storage({
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
    console.log('🔧 Object Storage configured for Replit');
  } catch (error) {
    console.log('⚠️ Object Storage not available, using fallback');
    objectStorageClient = null;
  }
} else {
  console.log('🔧 Using local file storage for production deployment');
}

// Ensure fallback directory exists
async function ensureFallbackDir() {
  try {
    await fs.mkdir(FALLBACK_MEDIA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// استخدام الـ bucket المُعد مسبقاً
const BUCKET_NAME = 'replit-objstore-b9b8cbbd-6b8d-4fcb-b924-c5e56e084f16';
const PUBLIC_DIR = 'public';
const PRIVATE_DIR = '.private';

/**
 * حفظ ملف في Object Storage - حل نهائي لعدم اختفاء الملفات عند redeploy
 */
export async function uploadFileToStorage(
  filePath: string, 
  fileName: string, 
  isPublic: boolean = true
): Promise<UploadResult> {
  const uniqueFileName = generateUniqueFileName(fileName);

  if (objectStorageClient && IS_REPLIT) {
    try {
      const directory = isPublic ? PUBLIC_DIR : PRIVATE_DIR;
      const objectName = `${directory}/${uniqueFileName}`;
      
      console.log(`🔄 رفع الملف إلى Object Storage: ${objectName}`);

      const bucket = objectStorageClient.bucket(BUCKET_NAME);
      
      await bucket.upload(filePath, {
        destination: objectName,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        }
      });

      const publicUrl = `/public-objects/${uniqueFileName}`;
      console.log(`✅ تم رفع الملف إلى Object Storage: ${publicUrl}`);

      return {
        filename: uniqueFileName,
        publicUrl: publicUrl
      };

    } catch (error) {
      console.error('❌ خطأ في Object Storage، التبديل إلى النسخ المحلي:', error);
    }
  }

  // Fallback to local storage
  try {
    await ensureFallbackDir();
    const targetPath = path.join(FALLBACK_MEDIA_DIR, uniqueFileName);
    
    console.log(`🔄 نسخ الملف محلياً: ${uniqueFileName}`);
    const fileContent = await fs.readFile(filePath);
    await fs.writeFile(targetPath, fileContent);

    const publicUrl = `/media/${uniqueFileName}`;
    console.log(`✅ تم حفظ الملف محلياً: ${publicUrl}`);

    return {
      filename: uniqueFileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في حفظ الملف:', error);
    throw new Error('فشل في حفظ الملف');
  }
}

/**
 * حفظ Buffer مباشرة في Object Storage - حل نهائي لعدم اختفاء الملفات
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  isPublic: boolean = true
): Promise<UploadResult> {
  const uniqueFileName = generateUniqueFileName(fileName);

  if (objectStorageClient && IS_REPLIT) {
    try {
      const directory = isPublic ? PUBLIC_DIR : PRIVATE_DIR;
      const objectName = `${directory}/${uniqueFileName}`;
      
      console.log(`🔄 رفع المحتوى إلى Object Storage: ${objectName}`);

      const bucket = objectStorageClient.bucket(BUCKET_NAME);
      const file = bucket.file(objectName);
      
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000',
        }
      });

      const publicUrl = `/public-objects/${uniqueFileName}`;
      console.log(`✅ تم رفع المحتوى إلى Object Storage: ${publicUrl}`);

      return {
        filename: uniqueFileName,
        publicUrl: publicUrl
      };

    } catch (error) {
      console.error('❌ خطأ في Object Storage، التبديل إلى النسخ المحلي:', error);
    }
  }

  // Fallback to local storage
  try {
    await ensureFallbackDir();
    const targetPath = path.join(FALLBACK_MEDIA_DIR, uniqueFileName);
    
    console.log(`🔄 حفظ المحتوى محلياً: ${uniqueFileName}`);
    await fs.writeFile(targetPath, buffer);

    const publicUrl = `/media/${uniqueFileName}`;
    console.log(`✅ تم حفظ المحتوى محلياً: ${publicUrl}`);

    return {
      filename: uniqueFileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في حفظ المحتوى:', error);
    throw new Error('فشل في حفظ المحتوى');
  }
}

/**
 * إنشاء اسم ملف فريد لتجنب التضارب
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomId = nanoid(8);
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  
  return `${timestamp}_${randomId}_${nameWithoutExt}${extension}`;
}

/**
 * حذف ملف من Object Storage
 */
export async function deleteFileFromStorage(fileName: string): Promise<void> {
  if (objectStorageClient && IS_REPLIT) {
    try {
      const bucket = objectStorageClient.bucket(BUCKET_NAME);
      
      // البحث في المجلد العام
      const publicFile = bucket.file(`${PUBLIC_DIR}/${fileName}`);
      const [publicExists] = await publicFile.exists();
      
      if (publicExists) {
        await publicFile.delete();
        console.log(`🗑️ تم حذف الملف من Object Storage: ${fileName}`);
        return;
      }
      
      // البحث في المجلد الخاص
      const privateFile = bucket.file(`${PRIVATE_DIR}/${fileName}`);
      const [privateExists] = await privateFile.exists();
      
      if (privateExists) {
        await privateFile.delete();
        console.log(`🗑️ تم حذف الملف من Object Storage: ${fileName}`);
        return;
      }
      
    } catch (error) {
      console.error('❌ خطأ في حذف الملف من Object Storage:', error);
    }
  }

  // Fallback to local deletion
  try {
    const localPath = path.join(FALLBACK_MEDIA_DIR, fileName);
    await fs.unlink(localPath);
    console.log(`🗑️ تم حذف الملف محلياً: ${fileName}`);
  } catch (error) {
    console.error('❌ خطأ في حذف الملف محلياً:', error);
    // لا نرمي خطأ في حالة فشل الحذف
  }
}