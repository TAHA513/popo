import { ObjectStorageService, objectStorageClient } from './objectStorage';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const objectStorage = new ObjectStorageService();

export async function migrateExistingFiles() {
  console.log('🔄 بدء نقل الملفات الموجودة إلى التخزين السحابي...');
  
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // فحص مجلد uploads
    let files: string[] = [];
    try {
      files = await fs.readdir(uploadsDir);
      console.log(`📊 العثور على ${files.length} ملف في مجلد uploads`);
    } catch (error) {
      console.log('⚠️ لا يوجد مجلد uploads أو فارغ');
      return { migratedCount: 0, skippedCount: 0 };
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const filename of files) {
      const fullPath = path.join(uploadsDir, filename);
      
      try {
        const stats = await fs.stat(fullPath);
        
        // تخطي المجلدات
        if (stats.isDirectory()) {
          continue;
        }
        
        console.log(`🔍 معالجة الملف: ${filename}`);
        
        // قراءة الملف
        const fileBuffer = await fs.readFile(fullPath);
        const extension = path.extname(filename).toLowerCase();
        
        // تحديد نوع المحتوى
        let contentType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(extension)) contentType = 'image/jpeg';
        else if (extension === '.png') contentType = 'image/png';
        else if (extension === '.gif') contentType = 'image/gif';
        else if (extension === '.webp') contentType = 'image/webp';
        else if (extension === '.mp4') contentType = 'video/mp4';
        else if (extension === '.webm') contentType = 'video/webm';
        else if (extension === '.mov') contentType = 'video/quicktime';
        
        // رفع إلى التخزين السحابي (مجلد خاص)
        const privateDir = objectStorage.getPrivateObjectDir();
        const cloudPath = `${privateDir}/legacy-uploads/${filename}`;
        
        const { bucketName, objectName } = parseObjectPath(cloudPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        await file.save(fileBuffer, {
          metadata: {
            contentType: contentType,
          },
        });
        
        const cloudUrl = `/api/media/legacy-uploads/${filename}`;
        
        console.log(`✅ تم رفع: ${filename} -> ${cloudUrl}`);
        migratedCount++;
        
        // إنشاء ملف txt بالرابط الجديد للمرجعية
        const referenceFile = path.join(uploadsDir, `${filename}.cloud-url.txt`);
        await fs.writeFile(referenceFile, cloudUrl);
        
      } catch (error) {
        console.log(`❌ خطأ في معالجة ${filename}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`🎉 اكتمل النقل!`);
    console.log(`✅ تم رفع ${migratedCount} ملف بنجاح`);
    console.log(`❌ فشل في ${skippedCount} ملف`);
    
    return { migratedCount, skippedCount };
    
  } catch (error) {
    console.error('❌ خطأ عام في النقل:', error);
    throw error;
  }
}

// تشغيل النقل إذا تم استدعاء هذا الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExistingFiles()
    .then((result) => {
      console.log('✅ تم النقل بنجاح:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل النقل:', error);
      process.exit(1);
    });
}