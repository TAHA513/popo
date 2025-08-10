// Migration script to fix media URLs in database
// Run with: node migrate-media-urls.js

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { memoryFragments, users } from './shared/schema.ts';
import { eq, ne, or } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function migrateMediaUrls() {
  console.log('🔄 Starting media URL migration...');
  
  try {
    // Update memory fragments media URLs
    const memories = await db.select().from(memoryFragments);
    let updatedMemories = 0;
    
    for (const memory of memories) {
      if (memory.mediaUrls && Array.isArray(memory.mediaUrls)) {
        const hasOldPaths = memory.mediaUrls.some(url => url.includes('/uploads/'));
        
        if (hasOldPaths) {
          const updatedUrls = memory.mediaUrls.map(url => 
            url.replace(/^.*\/uploads\//, '')
          );
          
          await db
            .update(memoryFragments)
            .set({ mediaUrls: updatedUrls })
            .where(eq(memoryFragments.id, memory.id));
            
          updatedMemories++;
          console.log(`✅ Updated memory ${memory.id}: ${JSON.stringify(updatedUrls)}`);
        }
      }
    }
    
    // Update user profile and cover images
    const allUsers = await db.select().from(users);
    let updatedUsers = 0;
    
    for (const user of allUsers) {
      const updates = {};
      
      if (user.profileImageUrl && user.profileImageUrl.includes('/uploads/')) {
        updates.profileImageUrl = user.profileImageUrl.replace(/^.*\/uploads\//, '');
      }
      
      if (user.coverImageUrl && user.coverImageUrl.includes('/uploads/')) {
        updates.coverImageUrl = user.coverImageUrl.replace(/^.*\/uploads\//, '');
      }
      
      if (Object.keys(updates).length > 0) {
        await db
          .update(users)
          .set(updates)
          .where(eq(users.id, user.id));
        updatedUsers++;
        console.log(`✅ Updated user ${user.id} images: ${JSON.stringify(updates)}`);
      }
    }
    
    console.log(`✅ Migration completed!`);
    console.log(`   - Updated ${updatedMemories} memory fragments`);
    console.log(`   - Updated ${updatedUsers} user profiles`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrateMediaUrls();