import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

// مجلد دائم خارج نطاق المشروع - لن يتأثر بـ redeploy
const PERSISTENT_MEDIA_DIR = '/tmp/media';

export interface UploadResult {
  filename: string;
  publicUrl: string;
}

// ضمان وجود مجلد الوسائط الدائم
async function ensurePersistentMediaDir() {
  try {
    await fs.promises.mkdir(PERSISTENT_MEDIA_DIR, { recursive: true });
  } catch (error) {
    // المجلد موجود بالفعل
  }
}

/**
 * حفظ الملف بشكل دائم في مجلد آمن - لن يختفي عند redeploy
 */
export async function uploadFileToStorage(
  filePath: string, 
  fileName: string, 
  isPublic: boolean = true
): Promise<UploadResult> {
  try {
    await ensurePersistentMediaDir();
    
    // إنشاء اسم ملف فريد لتجنب التضارب
    const uniqueFileName = `${nanoid()}_${fileName}`;
    const finalPath = path.join(PERSISTENT_MEDIA_DIR, uniqueFileName);
    
    console.log(`🔄 نسخ الملف للمجلد الدائم: ${uniqueFileName}`);

    // نسخ الملف للمجلد الدائم
    await fs.promises.copyFile(filePath, finalPath);
    
    // حذف الملف المؤقت
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // تجاهل أخطاء التنظيف
    }

    const publicUrl = `/media/${uniqueFileName}`;
    console.log(`✅ تم حفظ الملف في المجلد الدائم: ${publicUrl}`);

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
 * حفظ المحتوى مباشرة بشكل دائم في مجلد آمن
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  isPublic: boolean = true
): Promise<UploadResult> {
  try {
    await ensurePersistentMediaDir();
    
    // إنشاء اسم ملف فريد
    const uniqueFileName = `${nanoid()}_${fileName}`;
    const finalPath = path.join(PERSISTENT_MEDIA_DIR, uniqueFileName);
    
    console.log(`🔄 حفظ المحتوى في المجلد الدائم: ${uniqueFileName}`);

    // كتابة المحتوى للمجلد الدائم
    await fs.promises.writeFile(finalPath, buffer);

    const publicUrl = `/media/${uniqueFileName}`;
    console.log(`✅ تم حفظ المحتوى في المجلد الدائم: ${publicUrl}`);

    return {
      filename: uniqueFileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في حفظ المحتوى:', error);
    throw new Error('فشل في حفظ الملف');
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
 * حذف ملف من المجلد الدائم
 */
export async function deleteFileFromStorage(fileName: string): Promise<void> {
  try {
    const filePath = path.join(PERSISTENT_MEDIA_DIR, fileName);
    await fs.promises.unlink(filePath);
    console.log(`🗑️ تم حذف الملف: ${fileName}`);
  } catch (error) {
    console.error('❌ خطأ في حذف الملف:', error);
    // لا نرمي خطأ في حالة فشل الحذف
  }
}

