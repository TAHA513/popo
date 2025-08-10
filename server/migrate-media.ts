import { db } from './db';
import { memoryFragments } from '../shared/schema';
import { ObjectStorageService } from './objectStorage';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const objectStorage = new ObjectStorageService();

export async function migrateMediaToCloud() {
  console.log('🔄 بدء نقل الملفات إلى التخزين السحابي...');
  
  try {
    // الحصول على جميع المنشورات الموجودة
    const memories = await db.select().from(memoryFragments);
    console.log(`📊 العثور على ${memories.length} منشور للفحص`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const memory of memories) {
      console.log(`🔍 فحص المنشور ${memory.id}...`);
      
      let updatedMediaUrls: string[] = [];
      let hasChanges = false;
      
      // فحص كل رابط وسائط
      const mediaUrls = Array.isArray(memory.mediaUrls) ? memory.mediaUrls : [];
      for (const mediaUrl of mediaUrls) {
        if (mediaUrl.startsWith('/uploads/') || mediaUrl.startsWith('uploads/')) {
          // هذا ملف محلي، يحتاج للنقل
          const localPath = mediaUrl.startsWith('/') ? mediaUrl.slice(1) : mediaUrl;
          const fullPath = path.join(__dirname, '..', localPath);
          
          try {
            // التحقق من وجود الملف
            await fs.access(fullPath);
            
            // قراءة الملف
            const fileBuffer = await fs.readFile(fullPath);
            const fileName = path.basename(mediaUrl);
            const extension = path.extname(fileName).toLowerCase();
            
            // تحديد نوع المحتوى
            let contentType = 'application/octet-stream';
            if (['.jpg', '.jpeg'].includes(extension)) contentType = 'image/jpeg';
            else if (extension === '.png') contentType = 'image/png';
            else if (extension === '.gif') contentType = 'image/gif';
            else if (extension === '.webp') contentType = 'image/webp';
            else if (extension === '.mp4') contentType = 'video/mp4';
            else if (extension === '.webm') contentType = 'video/webm';
            else if (extension === '.mov') contentType = 'video/quicktime';
            
            // رفع إلى التخزين السحابي
            const newUrl = await objectStorage.uploadToPublicStorage(
              fileBuffer, 
              `memory-${memory.id}-${fileName}`, 
              contentType
            );
            
            updatedMediaUrls.push(newUrl);
            hasChanges = true;
            
            console.log(`✅ تم نقل: ${mediaUrl} -> ${newUrl}`);
            
          } catch (error) {
            console.log(`⚠️ لم يتم العثور على الملف المحلي: ${fullPath}`);
            // الاحتفاظ بالرابط الأصلي
            updatedMediaUrls.push(mediaUrl);
          }
        } else if (mediaUrl.startsWith('/public-objects/') || mediaUrl.startsWith('/api/media/proxy')) {
          // ملف موجود بالفعل في التخزين السحابي
          updatedMediaUrls.push(mediaUrl);
          skippedCount++;
        } else {
          // رابط خارجي أو نوع آخر
          updatedMediaUrls.push(mediaUrl);
        }
      }
      
      // تحديث قاعدة البيانات إذا كانت هناك تغييرات
      if (hasChanges && updatedMediaUrls.length > 0) {
        await db
          .update(memoryFragments)
          .set({ mediaUrls: updatedMediaUrls })
          .where(eq(memoryFragments.id, memory.id));
        
        migratedCount++;
        console.log(`📝 تم تحديث المنشور ${memory.id} في قاعدة البيانات`);
      }
    }
    
    console.log(`🎉 اكتمل النقل!`);
    console.log(`✅ تم نقل ${migratedCount} منشور`);
    console.log(`⏭️ تم تخطي ${skippedCount} ملف (موجود بالفعل في التخزين السحابي)`);
    
    return { migratedCount, skippedCount };
    
  } catch (error) {
    console.error('❌ خطأ في نقل الملفات:', error);
    throw error;
  }
}

// تشغيل النقل إذا تم استدعاء هذا الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMediaToCloud()
    .then((result) => {
      console.log('✅ تم النقل بنجاح:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل النقل:', error);
      process.exit(1);
    });
}