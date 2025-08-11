import { nanoid } from 'nanoid';
import { Storage, File } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs/promises';
import { backblazeService } from './backblaze-storage';

// Object Storage Configuration - حل متقدم: Backblaze B2 → Replit Object Storage → Local Files
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const IS_REPLIT = process.env.REPLIT_DEPLOYMENT === "1" || process.env.REPLIT_DEV_DOMAIN;
// استخدام مسار آمن للحفظ الدائم في Render
const FALLBACK_MEDIA_DIR = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'public', 'media')
  : '/tmp/persistent-media';

// نظام التخزين مع أولوية Backblaze B2
export enum StorageType {
  BACKBLAZE_B2 = 'backblaze-b2',
  REPLIT_OBJECT_STORAGE = 'replit-object-storage', 
  LOCAL_FILES = 'local-files'
}

export interface UploadResult {
  filename: string;
  publicUrl: string;
  storageType: StorageType;
  // إضافة معرف الملف في حالة Backblaze URLs
  originalUrl?: string;
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


// Upload file with Backblaze B2 priority
export async function uploadFileToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  console.log(`📤 بدء رفع الملف: ${filename}`);

  // Strategy 1: Try Backblaze B2 first (PRIORITY)
  if (backblazeService.isAvailable()) {
    try {
      console.log('🎯 محاولة الرفع إلى Backblaze B2...');
      const generatedFilename = backblazeService.generateFileName(filename);
      const publicUrl = await backblazeService.uploadFile(buffer, generatedFilename, contentType);
      
      console.log(`✅ تم الرفع بنجاح إلى Backblaze B2: ${generatedFilename}`);
      return {
        filename: generatedFilename,
        publicUrl,
        storageType: StorageType.BACKBLAZE_B2
      };
    } catch (error) {
      console.error('❌ فشل الرفع إلى Backblaze B2:', error);
    }
  }

  // Strategy 2: Fallback to Replit Object Storage
  if (IS_REPLIT) {
    try {
      console.log('🔄 محاولة الرفع إلى Replit Object Storage...');
      const timestamp = Date.now();
      const randomId = nanoid(8);
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const generatedFilename = `${timestamp}_${randomId}_${cleanBaseName}${ext}`;

      const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/objects/${generatedFilename}`, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (response.ok) {
        const publicUrl = `/api/media/${generatedFilename}`;
        console.log(`✅ تم الرفع بنجاح إلى Replit Object Storage: ${generatedFilename}`);
        return {
          filename: generatedFilename,
          publicUrl,
          storageType: StorageType.REPLIT_OBJECT_STORAGE
        };
      }
    } catch (error) {
      console.error('❌ فشل الرفع إلى Replit Object Storage:', error);
    }
  }

  // Strategy 3: Final fallback to local files
  try {
    console.log('📁 محاولة الحفظ محلياً...');
    await fs.mkdir(FALLBACK_MEDIA_DIR, { recursive: true });
    
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const generatedFilename = `${timestamp}_${randomId}_${cleanBaseName}${ext}`;
    
    const filePath = path.join(FALLBACK_MEDIA_DIR, generatedFilename);
    await fs.writeFile(filePath, buffer);
    
    const publicUrl = `/api/media/${generatedFilename}`;
    console.log(`✅ تم الحفظ محلياً: ${generatedFilename}`);
    return {
      filename: generatedFilename,
      publicUrl,
      storageType: StorageType.LOCAL_FILES
    };
  } catch (error) {
    console.error('❌ فشل الحفظ محلياً:', error);
    throw new Error('فشل في رفع الملف إلى جميع أنظمة التخزين');
  }
}

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
 * حفظ ملف buffer في النظام المتدرج: Backblaze B2 → Replit Object Storage → Local Files
 */
export async function uploadFileToStorage(
  buffer: Buffer, 
  fileName: string, 
  contentType?: string
): Promise<UploadResult> {
  console.log(`🔄 بدء رفع الملف: ${fileName}`);
  
  // المحاولة الأولى: Backblaze B2 (الأولوية الأولى)
  if (backblazeService.isAvailable()) {
    try {
      const uniqueFileName = backblazeService.generateFileName(fileName);
      const publicUrl = await backblazeService.uploadFile(buffer, uniqueFileName, contentType || 'application/octet-stream');
      console.log(`✅ تم رفع الملف بنجاح إلى Backblaze B2: ${uniqueFileName}`);
      return { filename: uniqueFileName, publicUrl, storageType: StorageType.BACKBLAZE_B2 };
    } catch (error) {
      console.error('❌ خطأ في Backblaze B2، التحويل إلى Object Storage:', error);
    }
  }
  
  // المحاولة الثانية: Replit Object Storage
  if (IS_REPLIT && objectStorageClient) {
    try {
      const uniqueFileName = generateUniqueFileName(fileName);
      const bucket = objectStorageClient.bucket(BUCKET_NAME);
      const file = bucket.file(`${PUBLIC_DIR}/${uniqueFileName}`);
      
      await file.save(buffer, {
        metadata: {
          contentType: contentType || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000',
        }
      });
      
      const publicUrl = `/api/media/${uniqueFileName}`;
      console.log(`✅ تم رفع الملف بنجاح إلى Replit Object Storage: ${uniqueFileName}`);
      return { filename: uniqueFileName, publicUrl, storageType: StorageType.REPLIT_OBJECT_STORAGE };
    } catch (error) {
      console.error('❌ خطأ في Object Storage، التحويل إلى التخزين المحلي:', error);
    }
  }
  
  // المحاولة الأخيرة: التخزين المحلي
  try {
    await ensureFallbackDir();
    const uniqueFileName = generateUniqueFileName(fileName);
    const targetPath = path.join(FALLBACK_MEDIA_DIR, uniqueFileName);
    
    console.log(`🔄 حفظ الملف محلياً: ${uniqueFileName}`);
    await fs.writeFile(targetPath, buffer);

    const publicUrl = `/api/media/${uniqueFileName}`;
    console.log(`✅ تم حفظ الملف محلياً: ${publicUrl}`);

    return {
      filename: uniqueFileName,
      publicUrl: publicUrl,
      storageType: StorageType.LOCAL_FILES
    };

  } catch (error) {
    console.error('❌ خطأ في حفظ الملف:', error);
    throw new Error('فشل في حفظ الملف');
  }
}

/**
 * حفظ Buffer مباشرة في Object Storage - حل نهائي لعدم اختفاء الملفات
 * مع ضمان التزامن بين البيئات
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  isPublic: boolean = true
): Promise<UploadResult> {
  const uniqueFileName = generateUniqueFileName(fileName);
  console.log(`🔄 بدء رفع الملف: ${uniqueFileName} في البيئة: ${IS_REPLIT ? 'Replit' : 'Production'}`);

  let objectStorageSuccess = false;
  let localStorageSuccess = false;

  // Strategy 1: Try Object Storage (works in both environments if configured)
  if (objectStorageClient) {
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

      objectStorageSuccess = true;
      console.log(`✅ تم رفع المحتوى إلى Object Storage: ${uniqueFileName}`);

    } catch (error) {
      console.error('❌ خطأ في Object Storage:', error);
    }
  } else {
    console.log('⚠️ Object Storage غير متوفر');
  }

  // Strategy 2: Always try local storage as backup/primary
  try {
    await ensureFallbackDir();
    const targetPath = path.join(FALLBACK_MEDIA_DIR, uniqueFileName);
    
    console.log(`🔄 حفظ المحتوى محلياً: ${uniqueFileName}`);
    await fs.writeFile(targetPath, buffer);
    
    localStorageSuccess = true;
    console.log(`✅ تم حفظ المحتوى محلياً: ${uniqueFileName}`);

  } catch (error) {
    console.error('❌ خطأ في حفظ المحتوى محلياً:', error);
  }

  // Determine success and return appropriate URL
  if (objectStorageSuccess || localStorageSuccess) {
    const publicUrl = `/api/media/${uniqueFileName}`;
    
    console.log(`✅ نجح رفع الملف - Object Storage: ${objectStorageSuccess}, Local: ${localStorageSuccess}`);
    
    return {
      filename: uniqueFileName,
      publicUrl: publicUrl,
      storageType: objectStorageSuccess ? StorageType.REPLIT_OBJECT_STORAGE : StorageType.LOCAL_FILES
    };
  } else {
    console.error('❌ فشل في حفظ الملف في جميع الطرق المتاحة');
    throw new Error('فشل في حفظ المحتوى في جميع أنظمة التخزين');
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