import { promises as fs } from 'fs';
import path from 'path';
import { Response } from 'express';

// Hybrid Storage: Local + Database fallback
export class HybridStorageService {
  constructor() {}

  // Upload file using both local and database storage
  async uploadFile(filename: string, buffer: Buffer, mimetype: string): Promise<string> {
    try {
      // 1. Save locally (primary)
      const localPath = path.join('uploads', filename);
      await fs.writeFile(localPath, buffer);
      console.log(`✅ File saved locally: ${filename}`);
      
      // 2. Save to database as backup (base64) - skip if DB not available
      try {
        const { db } = await import('./db');
        const { fileStorage } = await import('../shared/schema');
        const base64Data = buffer.toString('base64');
        
        await db.insert(fileStorage).values({
          filename,
          data: base64Data,
          mimetype,
          size: buffer.length,
          uploadedAt: new Date()
        }).onConflictDoUpdate({
          target: fileStorage.filename,
          set: {
            data: base64Data,
            mimetype,
            size: buffer.length,
            uploadedAt: new Date()
          }
        });
        
        console.log(`💾 File backed up to database: ${filename}`);
      } catch (dbError: any) {
        console.log(`⚠️ Database backup skipped (local storage sufficient): ${dbError.message}`);
      }
      
      return filename;
    } catch (error) {
      console.error('Hybrid storage upload failed:', error);
      throw error;
    }
  }

  // Download/serve file with intelligent fallback
  async downloadObject(filename: string, res: Response): Promise<void> {
    try {
      // 1. Try local file first (fastest)
      const localPath = path.join('uploads', filename);
      try {
        await fs.access(localPath);
        console.log(`📁 Serving from local: ${filename}`);
        const fileBuffer = await fs.readFile(localPath);
        const mimetype = this.getMimeType(filename);
        
        res.set({
          'Content-Type': mimetype,
          'Cache-Control': 'public, max-age=86400'
        });
        
        res.send(fileBuffer);
        return;
      } catch (localError) {
        console.log(`🔍 Local file not found: ${filename}, trying database...`);
      }

      // 2. Try database backup (skip if not available)
      try {
        const { db } = await import('./db');
        const { fileStorage } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [fileRecord] = await db.select().from(fileStorage)
          .where(eq(fileStorage.filename, filename)).limit(1);
          
        if (fileRecord) {
          console.log(`💾 Serving from database: ${filename}`);
          const buffer = Buffer.from(fileRecord.data, 'base64');
          
          res.set({
            'Content-Type': fileRecord.mimetype,
            'Cache-Control': 'public, max-age=86400'
          });
          
          // Restore to local for next time
          try {
            await fs.writeFile(localPath, buffer);
            console.log(`🔄 File restored to local: ${filename}`);
          } catch (restoreError: any) {
            console.log(`⚠️ Could not restore to local: ${restoreError.message}`);
          }
          
          res.send(buffer);
          return;
        }
      } catch (dbError: any) {
        console.log(`⚠️ Database not available, trying external source: ${dbError.message}`);
      }

      // 3. Try external fallback (production environment)
      try {
        const externalUrl = `https://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev/uploads/${filename}`;
        console.log(`🌐 Trying external source: ${externalUrl}`);
        
        const response = await fetch(externalUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const mimetype = this.getMimeType(filename);
          res.set({
            'Content-Type': mimetype,
            'Cache-Control': 'public, max-age=86400'
          });
          
          // Cache locally and in database
          try {
            await fs.writeFile(localPath, buffer);
            console.log(`💾 External file cached locally: ${filename}`);
          } catch (cacheError: any) {
            console.log(`⚠️ Could not cache externally fetched file: ${cacheError.message}`);
          }
          
          res.send(buffer);
          return;
        }
      } catch (externalError: any) {
        console.log(`❌ External source failed: ${externalError.message}`);
      }
      
      // 4. Send placeholder if all else fails
      console.log(`📷 Sending placeholder for: ${filename}`);
      res.redirect('https://via.placeholder.com/400x300/cccccc/666666?text=صورة+غير+متوفرة');
      
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Get MIME type from filename
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export const hybridStorage = new HybridStorageService();