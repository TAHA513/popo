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

// Get Management API token
async function getManagementToken() {
  try {
    const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        audience: auth0Config.audience || `https://${auth0Config.domain}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ خطأ في الحصول على token:', error);
    throw error;
  }
}

// Send password reset email using Auth0 Database Connection API
export async function sendPasswordResetEmail(email: string) {
  try {
    console.log('🔍 إرسال رسالة إعادة التعيين عبر Auth0 لـ:', email);
    
    // Use Auth0 Database Connection API directly 
    const response = await fetch(`https://${auth0Config.domain}/dbconnections/change_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: auth0Config.clientId,
        email: email,
        connection: 'Username-Password-Authentication'
      })
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.description || errorData.message || errorMessage;
        console.log('📊 تفاصيل خطأ Auth0:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('📊 Auth0 Response Status:', response.status, response.statusText);
      }
      
      // If user not found, don't throw error - return success for security
      if (response.status === 404 || errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
        console.log('⚠️ المستخدم غير موجود في Auth0، إرجاع نجاح للأمان');
        return { success: true, message: 'Password reset email sent (user not in Auth0)' };
      }
      
      throw new Error(`Auth0 API Error: ${errorMessage}`);
    }

    // Auth0 change_password endpoint returns a simple message
    const result = await response.text();
    console.log('✅ تم إرسال رسالة إعادة التعيين عبر Auth0 بنجاح!');
    return { success: true, message: result };
  } catch (error) {
    console.error('❌ خطأ في إرسال رسالة Auth0:', error);
    throw error;
  }
}

// Create Auth0 user using Database Connection signup
export async function createAuth0User(email: string, password: string) {
  try {
    console.log('🔄 إنشاء مستخدم جديد في Auth0 عبر Database Connection:', email);
    
    const response = await fetch(`https://${auth0Config.domain}/dbconnections/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: auth0Config.clientId,
        connection: 'Username-Password-Authentication',
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.description || errorData.message || errorMessage;
        console.log('📊 تفاصيل خطأ إنشاء المستخدم:', JSON.stringify(errorData, null, 2));
        
        // If user already exists, that's fine
        if (errorData.code === 'user_exists' || errorMessage.includes('already exists')) {
          console.log('✅ المستخدم موجود مسبقاً في Auth0');
          return { success: true, message: 'User already exists' };
        }
      } catch (e) {
        console.log('📊 Auth0 Signup Response Status:', response.status, response.statusText);
      }
      
      throw new Error(`Auth0 Signup Error: ${errorMessage}`);
    }

    const result = await response.json();
    console.log('✅ تم إنشاء مستخدم جديد في Auth0:', result.email || email);
    return { success: true, user: result };
  } catch (error) {
    console.error('❌ خطأ في إنشاء مستخدم Auth0:', error);
    throw error;
  }
}

// Update Auth0 user password
export async function updateAuth0UserPassword(userId: string, newPassword: string) {
  try {
    const result = await managementClient.users.update(
      { id: userId },
      { password: newPassword }
    );
    return result;
  } catch (error) {
    console.error('Error updating Auth0 user password:', error);
    throw error;
  }
}

export { auth0Config };