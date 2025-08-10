#!/usr/bin/env node

// Script to run media migration
async function runMigration() {
  try {
    console.log('🔄 بدء نقل الملفات القديمة إلى التخزين السحابي...');
    
    // استيراد الوحدة
    const { migrateMediaToCloud } = await import('../server/migrate-media.js');
    
    // تشغيل النقل
    const result = await migrateMediaToCloud();
    
    console.log('✅ تم اكتمال النقل بنجاح!');
    console.log(`📊 النتائج: نقل ${result.migratedCount} منشور، تخطي ${result.skippedCount} ملف`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ فشل في النقل:', error.message);
    process.exit(1);
  }
}

runMigration();