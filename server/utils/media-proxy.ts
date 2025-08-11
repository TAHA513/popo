// وكيل الوسائط لحل مشكلة CORS وتحسين تحميل المحتوى من مصادر خارجية
import axios from 'axios';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface MediaProxyCache {
  [key: string]: {
    data: Buffer;
    contentType: string;
    timestamp: number;
    ttl: number;
  };
}

export class MediaProxy {
  private static cache: MediaProxyCache = {};
  private static readonly CACHE_TTL = 3600000; // ساعة واحدة
  private static readonly MAX_CACHE_SIZE = 100; // حد أقصى 100 ملف مخزن
  private static readonly SUPPORTED_DOMAINS = [
    'cdn.laabob.com',
    'storage.laabob.com',
    'media.laabob.com',
    'images.laabob.com',
    'videos.laabob.com',
    // أضف المزيد من الدومينات المسموحة حسب الحاجة
  ];

  // التحقق من صحة الرابط
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.SUPPORTED_DOMAINS.includes(urlObj.hostname) || 
             urlObj.hostname.endsWith('.laabob.com') ||
             urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // تنظيف الكاش
  static cleanupCache(): void {
    const now = Date.now();
    const keys = Object.keys(this.cache);
    
    // إزالة الملفات المنتهية الصلاحية
    for (const key of keys) {
      if (now - this.cache[key].timestamp > this.cache[key].ttl) {
        delete this.cache[key];
      }
    }

    // إزالة أقدم الملفات إذا تجاوز الحد الأقصى
    const remainingKeys = Object.keys(this.cache);
    if (remainingKeys.length > this.MAX_CACHE_SIZE) {
      const sortedKeys = remainingKeys.sort((a, b) => 
        this.cache[a].timestamp - this.cache[b].timestamp
      );
      
      const toDelete = sortedKeys.slice(0, remainingKeys.length - this.MAX_CACHE_SIZE);
      for (const key of toDelete) {
        delete this.cache[key];
      }
    }
  }

  // جلب الوسائط عبر الوكيل
  static async proxyMedia(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'عنوان URL مطلوب' });
        return;
      }

      // التحقق من صحة الرابط
      if (!this.isValidUrl(url)) {
        res.status(403).json({ error: 'رابط غير مسموح' });
        return;
      }

      const cacheKey = Buffer.from(url).toString('base64');
      
      // التحقق من الكاش أولاً
      if (this.cache[cacheKey]) {
        const cached = this.cache[cacheKey];
        const now = Date.now();
        
        if (now - cached.timestamp < cached.ttl) {
          res.set({
            'Content-Type': cached.contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.send(cached.data);
          return;
        } else {
          delete this.cache[cacheKey];
        }
      }

      // جلب الملف من المصدر الأصلي
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 ثوان
        headers: {
          'User-Agent': 'LaaBoBo-Media-Proxy/1.0',
        },
      });

      const data = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // حفظ في الكاش
      this.cache[cacheKey] = {
        data,
        contentType,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL,
      };

      // إعداد الهيدرات
      res.set({
        'Content-Type': contentType,
        'Content-Length': data.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Proxy-Cache': 'MISS',
      });

      res.send(data);

      // تنظيف الكاش بشكل دوري
      if (Math.random() < 0.01) {
        this.cleanupCache();
      }

    } catch (error: any) {
      console.error('خطأ في وكيل الوسائط:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          res.status(502).json({ error: 'لا يمكن الوصول للمصدر الأصلي' });
        } else if (error.response?.status === 404) {
          res.status(404).json({ error: 'الملف غير موجود' });
        } else {
          res.status(500).json({ error: 'خطأ في جلب الوسائط' });
        }
      } else {
        res.status(500).json({ error: 'خطأ في الخادم' });
      }
    }
  }

  // إنشاء رابط وكيل للوسائط
  static createProxyUrl(originalUrl: string, baseUrl?: string): string {
    if (!originalUrl || this.isLocalUrl(originalUrl)) {
      return originalUrl;
    }

    const base = baseUrl || '';
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${base}/api/media/proxy?url=${encodedUrl}`;
  }

  // التحقق من الروابط المحلية
  static isLocalUrl(url: string): boolean {
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }

  // تحسين جودة الصورة (اختياري)
  static createOptimizedUrl(originalUrl: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): string {
    if (!originalUrl || this.isLocalUrl(originalUrl)) {
      return originalUrl;
    }

    const params = new URLSearchParams();
    params.append('url', originalUrl);
    
    if (options?.width) params.append('w', options.width.toString());
    if (options?.height) params.append('h', options.height.toString());
    if (options?.quality) params.append('q', options.quality.toString());
    if (options?.format) params.append('f', options.format);

    return `/api/media/optimize?${params.toString()}`;
  }
}