#!/usr/bin/env tsx

/**
 * Migration script to move existing local media files to Cloudinary
 * and update database URLs to absolute paths
 */

import { db } from '../server/db';
import { memoryFragments } from '../shared/schema';
import { uploadToCloudinary, isCloudinaryEnabled } from '../server/cloudinary';
import fs from 'fs/promises';
import path from 'path';
import { eq } from 'drizzle-orm';

async function migrateMediaToCloudinary() {
  console.log('🚀 Starting Cloudinary migration...');

  if (!isCloudinaryEnabled()) {
    console.error('❌ CLOUDINARY_URL not configured. Please set it first.');
    process.exit(1);
  }

  try {
    // Get all memories with local media URLs
    const memories = await db
      .select()
      .from(memoryFragments)
      .where(eq(memoryFragments.isActive, true));

    console.log(`📋 Found ${memories.length} memories to check`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const memory of memories) {
      console.log(`\n📁 Processing memory ${memory.id}...`);

      // Parse media URLs
      let mediaUrls: string[] = [];
      try {
        mediaUrls = JSON.parse(memory.mediaUrls || '[]');
      } catch (e) {
        if (memory.mediaUrls) {
          mediaUrls = [memory.mediaUrls];
        }
      }

      const updatedMediaUrls: string[] = [];
      let hasUpdates = false;

      for (const mediaUrl of mediaUrls) {
        // Skip URLs that are already external
        if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
          console.log(`  ⏭️  Skipping external URL: ${mediaUrl}`);
          updatedMediaUrls.push(mediaUrl);
          continue;
        }

        // Process local URLs
        const localPath = path.join(process.cwd(), 'uploads', path.basename(mediaUrl));
        
        try {
          // Check if local file exists
          await fs.access(localPath);
          
          // Read file and upload to Cloudinary
          console.log(`  📤 Uploading: ${path.basename(mediaUrl)}`);
          const fileBuffer = await fs.readFile(localPath);
          
          const cloudinaryResult = await uploadToCloudinary(fileBuffer, {
            folder: 'laabobo-migrated',
            resourceType: 'auto'
          });

          console.log(`  ✅ Uploaded to: ${cloudinaryResult.secure_url}`);
          updatedMediaUrls.push(cloudinaryResult.secure_url);
          hasUpdates = true;
          
        } catch (fileError) {
          console.log(`  ⚠️  File not found locally: ${localPath}, keeping original URL`);
          updatedMediaUrls.push(mediaUrl);
        }
      }

      // Update thumbnail URL if needed
      let updatedThumbnailUrl = memory.thumbnailUrl;
      if (memory.thumbnailUrl && !memory.thumbnailUrl.startsWith('http')) {
        const thumbnailIndex = mediaUrls.findIndex(url => url.includes(path.basename(memory.thumbnailUrl || '')));
        if (thumbnailIndex >= 0 && updatedMediaUrls[thumbnailIndex]) {
          updatedThumbnailUrl = updatedMediaUrls[thumbnailIndex];
          hasUpdates = true;
        }
      }

      // Update database if we have changes
      if (hasUpdates) {
        await db
          .update(memoryFragments)
          .set({
            mediaUrls: JSON.stringify(updatedMediaUrls),
            thumbnailUrl: updatedThumbnailUrl,
            updatedAt: new Date()
          })
          .where(eq(memoryFragments.id, memory.id));

        console.log(`  💾 Updated database for memory ${memory.id}`);
        migratedCount++;
      } else {
        console.log(`  ⏭️  No changes needed for memory ${memory.id}`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   📊 Migrated: ${migratedCount} memories`);
    console.log(`   ⏭️  Skipped: ${skippedCount} memories`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMediaToCloudinary()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateMediaToCloudinary };