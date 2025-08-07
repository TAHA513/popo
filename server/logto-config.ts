import { LogtoExpressConfig } from '@logto/express';

// Logto configuration for LaaBoBo
export const logtoConfig: LogtoExpressConfig = {
  endpoint: 'https://xcijil.logto.app/',
  appId: '9lh53x5ejoufbdyho0uar',
  appSecret: 'mVEiFXUw2kN0ufLmJtLzyxbUPI4een5l',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? `https://${process.env.REPL_SLUG || 'laabobobo'}.${process.env.REPL_OWNER || 'replituser'}.replit.app`
    : 'http://localhost:5000',
  resources: [],
  scopes: ['openid', 'profile', 'email'],
};

// Resource mapping for API authorization if needed
export const resourceScopes = {
  api: 'https://api.laabobobo.com',
  scopes: ['read:profile', 'write:profile', 'manage:account']
};

console.log('🔐 Logto تم تكوين إعدادات');