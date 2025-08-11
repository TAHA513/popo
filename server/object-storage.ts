import path from 'path';
import fs from 'fs';

// استخدام مجلد uploads ثابت ودائم
const uploadsDir = './uploads';

export interface UploadResult {
  filename: string;
  publicUrl: string;
}

// التأكد من وجود مجلد uploads
async function ensureUploadsDir() {
  try {
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    console.log('📁 مجلد uploads جاهز');
  } catch (error) {
    // المجلد موجود بالفعل
  }
}

/**
 * حفظ الملف بشكل دائم
 */
export async function uploadFileToStorage(
  filePath: string, 
  fileName: string, 
  isPublic: boolean = true
): Promise<UploadResult> {
  try {
    await ensureUploadsDir();
    
    const finalPath = path.join(uploadsDir, fileName);
    console.log(`💾 حفظ الملف: ${fileName}`);

    // نسخ الملف للمكان الدائم
    await fs.promises.copyFile(filePath, finalPath);
    
    // حذف الملف المؤقت
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // تجاهل أخطاء التنظيف
    }

    const publicUrl = `/uploads/${fileName}`;
    console.log(`✅ تم حفظ الملف: ${publicUrl}`);

    return {
      filename: fileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في حفظ الملف:', error);
    throw new Error('فشل في حفظ الملف');
  }
}

/**
 * حفظ المحتوى مباشرة بشكل دائم
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  isPublic: boolean = true
): Promise<UploadResult> {
  try {
    await ensureUploadsDir();
    
    const finalPath = path.join(uploadsDir, fileName);
    console.log(`💾 حفظ المحتوى: ${fileName}`);

    // كتابة المحتوى للمكان الدائم
    await fs.promises.writeFile(finalPath, buffer);

    const publicUrl = `/uploads/${fileName}`;
    console.log(`✅ تم حفظ المحتوى: ${publicUrl}`);

    return {
      filename: fileName,
      publicUrl: publicUrl
    };

  } catch (error) {
    console.error('❌ خطأ في حفظ المحتوى:', error);
    throw new Error('فشل في حفظ الملف');
  }
}

/**
 * حذف ملف من التخزين
 */
export async function deleteFileFromStorage(fileName: string): Promise<void> {
  try {
    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.unlink(filePath);
    console.log(`🗑️ تم حذف الملف: ${fileName}`);
  } catch (error) {
    console.error('❌ خطأ في حذف الملف:', error);
    // لا نرمي خطأ في حالة فشل الحذف
  }
}

/**
 * التحقق من وجود ملف
 */
export async function fileExistsInStorage(fileName: string): Promise<boolean> {
  try {
    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
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