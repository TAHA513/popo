import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { uploadFileToStorage } from '../object-storage.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Share target handler for PWA
const shareSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
});

router.post('/share', upload.array('media'), async (req, res) => {
  try {
    console.log('📤 PWA Share received:', {
      body: req.body,
      files: req.files ? (req.files as Express.Multer.File[]).length : 0
    });

    const shareData = shareSchema.parse(req.body);
    const files = req.files as Express.Multer.File[];
    
    const uploadedFiles = [];
    
    // Upload shared files if any
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await uploadFileToStorage(file.buffer, file.originalname, file.mimetype);
          uploadedFiles.push(result);
          console.log('📁 Shared file uploaded:', result.filename);
        } catch (error) {
          console.error('❌ Failed to upload shared file:', error);
        }
      }
    }

    // Create a memory/post with shared content
    const shareContent = {
      text: shareData.text || shareData.title || 'محتوى مشارك من التطبيق',
      url: shareData.url,
      media: uploadedFiles,
      isShared: true,
      sharedAt: new Date().toISOString(),
    };

    console.log('✅ Share content processed:', shareContent);

    // Redirect to create memory page with pre-filled data
    const params = new URLSearchParams({
      shared: 'true',
      text: shareContent.text,
      ...(shareContent.url && { url: shareContent.url }),
    });

    res.redirect(`/?${params.toString()}`);
  } catch (error) {
    console.error('❌ Share processing failed:', error);
    res.status(500).json({ error: 'فشل في معالجة المحتوى المشارك' });
  }
});

// Handle protocol links (web+laabolive://)
router.get('/handle/:data', (req, res) => {
  try {
    const data = decodeURIComponent(req.params.data);
    console.log('🔗 Protocol handler received:', data);
    
    // Parse the protocol data and redirect appropriately
    if (data.startsWith('user/')) {
      const username = data.replace('user/', '');
      res.redirect(`/profile/${username}`);
    } else if (data.startsWith('memory/')) {
      const memoryId = data.replace('memory/', '');
      res.redirect(`/memory/${memoryId}`);
    } else if (data.startsWith('stream/')) {
      const streamId = data.replace('stream/', '');
      res.redirect(`/stream/${streamId}`);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('❌ Protocol handler failed:', error);
    res.redirect('/');
  }
});

export default router;