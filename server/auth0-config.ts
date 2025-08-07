// Auth0 Configuration for Two-Factor Authentication
import { ManagementClient, AuthenticationClient } from 'auth0';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Auth0 configuration - these will need to be set in environment variables
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  audience: process.env.AUTH0_AUDIENCE || '',
};

// Management API client for user operations
export const managementClient = new ManagementClient({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  clientSecret: auth0Config.clientSecret,
});

// Authentication API client for login/MFA operations
export const authenticationClient = new AuthenticationClient({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
});

// Enable MFA for a user
export async function enableMFAForUser(userId: string) {
  try {
    const result = await managementClient.users.update(
      { id: userId },
      { 
        app_metadata: { 
          mfa_enabled: true 
        }
      }
    );
    return result;
  } catch (error) {
    console.error('Error enabling MFA:', error);
    throw error;
  }
}

// Get user profile from Auth0
export async function getAuth0User(userId: string) {
  try {
    const user = await managementClient.users.get({ id: userId });
    return user;
  } catch (error) {
    console.error('Error getting Auth0 user:', error);
    throw error;
  }
}

// Generate TOTP secret for MFA
export function generateTOTPSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `LaaBoBo (${email})`,
    issuer: 'LaaBoBo',
    length: 32
  });
  
  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url
  };
}

// Verify TOTP code
export function verifyTOTPCode(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
}

export { auth0Config };