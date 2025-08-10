// Enhanced Media Proxy for asaad111-style Cross-Environment Access
import { Request, Response } from "express";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const objectStorageService = new ObjectStorageService();

// Enhanced media proxy that works like asaad111's system
export async function handleMediaProxy(req: Request, res: Response) {
  const filePath = req.params.filePath;
  
  try {
    // 1. First try local storage
    const localPath = path.join('uploads', filePath);
    try {
      const fileBuffer = await fs.readFile(localPath);
      
      // Determine content type
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                         ext === '.png' ? 'image/png' :
                         ext === '.gif' ? 'image/gif' :
                         ext === '.webp' ? 'image/webp' :
                         ext === '.mp4' ? 'video/mp4' :
                         ext === '.mov' ? 'video/quicktime' :
                         'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
      return res.send(fileBuffer);
    } catch (localError) {
      console.log(`📁 Local file not found: ${filePath}, trying cloud storage...`);
    }

    // 2. Try cloud storage (asaad111-style bucket)
    try {
      const cloudFile = await objectStorageService.searchPublicObject(filePath);
      if (cloudFile) {
        console.log(`☁️ Found in cloud storage: ${filePath}`);
        return objectStorageService.downloadObject(cloudFile, res);
      }
    } catch (cloudError) {
      console.log(`☁️ Cloud storage failed for: ${filePath}`);
    }

    // 3. Try external sources (cross-environment access like asaad111)
    const externalSources = [
      'https://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev',
      'https://laaobo-live.replit.app',
      'https://1b55549b-93b4-46b6-8001-5e03b21de90a-00-23pnvjej2vpkb.riker.replit.dev'
    ];

    for (const baseUrl of externalSources) {
      try {
        const externalUrl = `${baseUrl}/uploads/${filePath}`;
        console.log(`🔍 Trying external source: ${externalUrl}`);
        
        const response = await axios.get(externalUrl, {
          responseType: 'arraybuffer',
          timeout: 3000,
          headers: {
            'User-Agent': 'LaaBoBo-MediaSync/1.0'
          }
        });

        if (response.status === 200) {
          console.log(`✅ Found externally: ${externalUrl}`);
          
          // Cache locally for future use
          try {
            await fs.writeFile(localPath, response.data);
            console.log(`💾 Cached locally: ${filePath}`);
          } catch (cacheError) {
            console.log(`⚠️ Could not cache locally: ${filePath}`);
          }
          
          // Determine content type from external response or file extension
          const contentType = response.headers['content-type'] || (() => {
            const ext = path.extname(filePath).toLowerCase();
            return ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                   ext === '.png' ? 'image/png' :
                   ext === '.gif' ? 'image/gif' :
                   ext === '.webp' ? 'image/webp' :
                   ext === '.mp4' ? 'video/mp4' :
                   ext === '.mov' ? 'video/quicktime' :
                   'application/octet-stream';
          })();
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(response.data);
        }
      } catch (error) {
        console.log(`❌ External source failed: ${baseUrl}/uploads/${filePath}`);
      }
    }

    // 4. File not found anywhere
    console.log(`❌ Media file not found anywhere: ${filePath}`);
    return res.status(404).json({ 
      error: 'File not found',
      message: 'الملف غير موجود في أي من المصادر المتاحة'
    });

  } catch (error) {
    console.error(`❌ Media proxy error for ${filePath}:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'خطأ في جلب الملف'
    });
  }
}