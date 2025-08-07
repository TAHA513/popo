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
  scope: 'read:users update:users create:users'
});

// Authentication API client for login/MFA operations
export const authenticationClient = new AuthenticationClient({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
});

// Enable MFA for a user
export async function enableMFAForUser(userId: string) {
  try {
    const result = await managementClient.updateUser(
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

// Get MFA enrollment ticket
export async function getMFAEnrollmentTicket(userId: string) {
  try {
    const ticket = await managementClient.createEmailVerificationTicket({
      user_id: userId,
      result_url: `${process.env.BASE_URL}/mfa-setup-complete`
    });
    return ticket;
  } catch (error) {
    console.error('Error creating MFA enrollment ticket:', error);
    throw error;
  }
}

// Verify MFA code
export async function verifyMFACode(accessToken: string, mfaToken: string, otp: string) {
  try {
    const result = await authenticationClient.oauth.passwordGrant({
      username: '', // Will be handled by MFA flow
      password: '',
      mfa_token: mfaToken,
      otp: otp
    });
    return result;
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    throw error;
  }
}

export { auth0Config };