import { db } from './db';
import { memoryFragments } from '../shared/schema';
import { eq, like } from 'drizzle-orm';

export async function updateLegacyUrls() {
  console.log('🔄 بدء تحديث روابط المنشورات القديمة...');
  
  try {
    // الحصول على جميع المنشورات
    const memories = await db.select().from(memoryFragments);
    
    console.log(`📊 العثور على ${memories.length} منشور يحتوي على روابط قديمة`);
    
    let updatedCount = 0;
    
    for (const memory of memories) {
      let updatedMediaUrls: string[] = [];
      let hasChanges = false;
      
      const mediaUrls = Array.isArray(memory.mediaUrls) ? memory.mediaUrls : [];
      
      for (const mediaUrl of mediaUrls) {
        if (mediaUrl.startsWith('/uploads/') || mediaUrl.startsWith('uploads/')) {
          // تحويل إلى رابط legacy uploads
          const filename = mediaUrl.split('/').pop() || '';
          const newUrl = `/api/media/legacy-uploads/${filename}`;
          updatedMediaUrls.push(newUrl);
          hasChanges = true;
          console.log(`🔄 تحديث: ${mediaUrl} -> ${newUrl}`);
        } else {
          // الاحتفاظ بالرابط كما هو
          updatedMediaUrls.push(mediaUrl);
        }
      }
      
      // تحديث قاعدة البيانات إذا كانت هناك تغييرات
      if (hasChanges && updatedMediaUrls.length > 0) {
        await db
          .update(memoryFragments)
          .set({ mediaUrls: updatedMediaUrls })
          .where(eq(memoryFragments.id, memory.id));
        
        updatedCount++;
        console.log(`✅ تم تحديث المنشور ${memory.id}`);
      }
    }
    
    console.log(`🎉 اكتمل التحديث!`);
    console.log(`✅ تم تحديث ${updatedCount} منشور`);
    
    return { updatedCount };
    
  } catch (error) {
    console.error('❌ خطأ في تحديث الروابط:', error);
    throw error;
  }
}

// تشغيل التحديث إذا تم استدعاء هذا الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  updateLegacyUrls()
    .then((result) => {
      console.log('✅ تم التحديث بنجاح:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل التحديث:', error);
      process.exit(1);
    });
}