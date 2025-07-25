import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Generate ZEGO authentication token
router.post('/zego-token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const appId = process.env.VITE_ZEGOCLOUD_APP_ID;
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appId || !serverSecret) {
      console.error('Missing ZEGO credentials');
      return res.status(500).json({ error: 'ZEGO configuration missing' });
    }

    // Token payload
    const payload = {
      iss: parseInt(appId),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
      iat: Math.floor(Date.now() / 1000),
      aud: 'zego',
      uid: userId,
      nonce: Math.floor(Math.random() * 1000000)
    };

    // Generate JWT token
    const token = jwt.sign(payload, serverSecret, { algorithm: 'HS256' });

    console.log('✅ ZEGO token generated for user:', userId);
    
    res.json({ 
      token,
      appId: parseInt(appId),
      userId 
    });

  } catch (error) {
    console.error('❌ Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;