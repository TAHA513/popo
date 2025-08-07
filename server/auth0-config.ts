// Simple MFA Configuration without Auth0 dependency
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Simple MFA configuration using built-in TOTP
const mfaConfig = {
  serviceName: process.env.TOTP_SERVICE_NAME || 'LaaBoBo',
  issuer: process.env.TOTP_ISSUER || 'LaaBoBo Platform',
  encryptionSecret: process.env.MFA_ENCRYPTION_SECRET || 'default_secret_change_me'
};

// Generate TOTP secret for user
export function generateMFASecret(username: string) {
  const secret = speakeasy.generateSecret({
    name: `${mfaConfig.serviceName} (${username})`,
    issuer: mfaConfig.issuer,
    length: 32
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
    qr_code_url: null // Will be generated separately
  };
}

// Generate QR code for secret
export async function generateQRCode(otpauth_url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauth_url);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Verify TOTP token
export function verifyTOTP(secret: string, token: string, window: number = 2): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window
  });
}

// Generate backup codes
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export { mfaConfig };