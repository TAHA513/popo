#!/bin/bash

# سكريبت لنقل البيانات من Replit إلى Render
# Database Migration Script: Replit to Render

echo "🚀 بدء عملية نقل البيانات..."

# التحقق من متغيرات البيئة
if [ -z "$REPLIT_DATABASE_URL" ]; then
    echo "❌ متغير REPLIT_DATABASE_URL غير موجود"
    exit 1
fi

if [ -z "$RENDER_DATABASE_URL" ]; then
    echo "❌ متغير RENDER_DATABASE_URL غير موجود" 
    exit 1
fi

# إنشاء مجلد مؤقت للنسخ الاحتياطية
mkdir -p ./temp_backup

echo "📥 تصدير البيانات من Replit..."
pg_dump $REPLIT_DATABASE_URL > ./temp_backup/replit_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ تم تصدير البيانات بنجاح"
else
    echo "❌ فشل في تصدير البيانات"
    exit 1
fi

echo "📤 استيراد البيانات إلى Render..."
psql $RENDER_DATABASE_URL < ./temp_backup/replit_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ تم استيراد البيانات بنجاح"
    echo "🎉 عملية النقل مكتملة!"
else
    echo "❌ فشل في استيراد البيانات"
    exit 1
fi

# تنظيف الملفات المؤقتة
rm -rf ./temp_backup

echo "🧹 تم تنظيف الملفات المؤقتة"
echo "✨ يمكنك الآن التحقق من تزامن البيانات بين النظامين"