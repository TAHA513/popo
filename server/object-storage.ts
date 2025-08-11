import { nanoid } from 'nanoid';
import { Storage, File } from '@google-cloud/storage';
import path from 'path';

// Object Storage Configuration - حل نهائي لمشكلة اختفاء الملفات
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export interface UploadResult {
  filename: string;
  publicUrl: string;
}

// إعداد Object Storage Client
const objectStorageClient = new Storage({
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
  try {
    // إنشاء اسم ملف فريد
    const uniqueFileName = generateUniqueFileName(fileName);
    const directory = isPublic ? PUBLIC_DIR : PRIVATE_DIR;
    const objectName = `${directory}/${uniqueFileName}`;
    
    console.log(`🔄 رفع الملف إلى Object Storage: ${objectName}`);

    const bucket = objectStorageClient.bucket(BUCKET_NAME);
    const file = bucket.file(objectName);
    
    // رفع الملف إلى Object Storage (private by default)
    await bucket.upload(filePath, {
      destination: objectName,
      metadata: {
        cacheControl: 'public, max-age=31536000', // cache لمدة سنة
      }
    });

    const publicUrl = `/public-objects/${uniqueFileName}`;
    console.log(`✅ تم رفع الملف إلى Object Storage: ${publicUrl}`);

    return {
      filename: uniqueFileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في رفع الملف إلى Object Storage:', error);
    throw new Error('فشل في رفع الملف إلى Object Storage');
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
  try {
    // إنشاء اسم ملف فريد
    const uniqueFileName = generateUniqueFileName(fileName);
    const directory = isPublic ? PUBLIC_DIR : PRIVATE_DIR;
    const objectName = `${directory}/${uniqueFileName}`;
    
    console.log(`🔄 رفع المحتوى إلى Object Storage: ${objectName}`);

    const bucket = objectStorageClient.bucket(BUCKET_NAME);
    const file = bucket.file(objectName);
    
    // رفع Buffer إلى Object Storage (private by default)
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000', // cache لمدة سنة
      }
    });

    const publicUrl = `/public-objects/${uniqueFileName}`;
    console.log(`✅ تم رفع المحتوى إلى Object Storage: ${publicUrl}`);

    return {
      filename: uniqueFileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في رفع المحتوى إلى Object Storage:', error);
    throw new Error('فشل في رفع المحتوى إلى Object Storage');
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
    
    console.log(`⚠️ الملف غير موجود في Object Storage: ${fileName}`);
    
  } catch (error) {
    console.error('❌ خطأ في حذف الملف من Object Storage:', error);
    // لا نرمي خطأ في حالة فشل الحذف
  }
}