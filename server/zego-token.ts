import crypto from 'crypto';

// ZEGO Token generation for secure authentication
export function generateZegoToken(appId: number, serverSecret: string, userId: string, effectiveTimeInSeconds: number = 7200): string {
  if (!serverSecret || !userId) {
    throw new Error('Server secret and user ID are required');
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expiredTime = currentTime + effectiveTimeInSeconds;

  // Create the payload
  const payload = {
    iss: appId,
    exp: expiredTime,
    sub: userId,
    iat: currentTime
  };

  // Encode payload to base64
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Create signature
  const signature = crypto
    .createHmac('sha256', serverSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// API endpoint to get token for frontend
export async function getZegoTokenForUser(userId: string): Promise<string> {
  const appId = parseInt(process.env.VITE_ZEGOCLOUD_APP_ID || '1034062164');
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  
  if (!serverSecret) {
    throw new Error('ZEGO Server Secret not configured');
  }

  return generateZegoToken(appId, serverSecret, userId);
}