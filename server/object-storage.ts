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

// نظام التخزين المتدرج
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
  
  // الأولوية الوحيدة: Backblaze B2 (مصدر التخزين الأساسي)
  if (backblazeService.isAvailable()) {
    try {
      const uniqueFileName = backblazeService.generateFileName(fileName);
      const publicUrl = await backblazeService.uploadFile(buffer, uniqueFileName, contentType || 'application/octet-stream');
      console.log(`✅ تم رفع الملف بنجاح إلى Backblaze B2: ${uniqueFileName}`);
      return { filename: uniqueFileName, publicUrl, storageType: StorageType.BACKBLAZE_B2 };
    } catch (error) {
      console.error('❌ خطأ في Backblaze B2:', error);
      throw new Error(`فشل في رفع الملف إلى Backblaze B2: ${error.message}`);
    }
  } else {
    console.error('❌ Backblaze B2 غير متاح - تأكد من إعداد المفاتيح');
    throw new Error('Backblaze B2 غير متاح - يرجى إعداد مفاتيح API');
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