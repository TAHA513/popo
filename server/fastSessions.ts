import { nanoid } from 'nanoid';
import type { Express, RequestHandler } from 'express';
import type { User } from '../shared/schema';
import cookieParser from 'cookie-parser';

// Fast in-memory session store - much faster than PostgreSQL
const sessionStore = new Map<string, {
  userId: string;
  user: User;
  createdAt: number;
  lastAccess: number;
}>();

// Fast token store for instant authentication
const tokenStore = new Map<string, string>(); // token -> sessionId

// Clean expired sessions every 30 minutes
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (much longer)
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  Array.from(sessionStore.entries()).forEach(([sessionId, session]) => {
    if (now - session.lastAccess > SESSION_TTL) {
      sessionStore.delete(sessionId);
      
      // Remove associated tokens
      Array.from(tokenStore.entries()).forEach(([token, storedSessionId]) => {
        if (storedSessionId === sessionId) {
          tokenStore.delete(token);
        }
      });
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired sessions`);
  }
}, CLEANUP_INTERVAL);

export class FastSessionManager {
  static createSession(user: User): { sessionId: string; token: string } {
    const sessionId = nanoid(32);
    const token = nanoid(48);
    const now = Date.now();
    
    sessionStore.set(sessionId, {
      userId: user.id,
      user,
      createdAt: now,
      lastAccess: now,
    });
    
    tokenStore.set(token, sessionId);
    
    console.log(`✅ Fast session created for user: ${user.username}`);
    return { sessionId, token };
  }
  
  static getSessionByToken(token: string): User | null {
    if (!token) return null;
    
    const sessionId = tokenStore.get(token);
    if (!sessionId) return null;
    
    const session = sessionStore.get(sessionId);
    if (!session) {
      tokenStore.delete(token);
      return null;
    }
    
    // Check expiry
    const now = Date.now();
    if (now - session.lastAccess > SESSION_TTL) {
      this.destroySession(sessionId);
      return null;
    }
    
    // Update last access
    session.lastAccess = now;
    
    return session.user;
  }
  
  static updateUser(userId: string, updatedUser: User): void {
    Array.from(sessionStore.entries()).forEach(([sessionId, session]) => {
      if (session.userId === userId) {
        session.user = updatedUser;
        session.lastAccess = Date.now();
      }
    });
  }
  
  static destroySession(sessionId: string): void {
    sessionStore.delete(sessionId);
    
    // Remove associated tokens
    Array.from(tokenStore.entries()).forEach(([token, storedSessionId]) => {
      if (storedSessionId === sessionId) {
        tokenStore.delete(token);
      }
    });
  }
  
  static destroyAllUserSessions(userId: string): void {
    const sessionsToDelete: string[] = [];
    
    Array.from(sessionStore.entries()).forEach(([sessionId, session]) => {
      if (session.userId === userId) {
        sessionsToDelete.push(sessionId);
      }
    });
    
    sessionsToDelete.forEach(sessionId => this.destroySession(sessionId));
  }
  
  static getStats() {
    return {
      totalSessions: sessionStore.size,
      totalTokens: tokenStore.size,
    };
  }
  
  // Expose tokenStore for logout operations (controlled access)
  static get tokenStore() {
    return tokenStore;
  }
}

// Fast authentication middleware using tokens
export const requireFastAuth: RequestHandler = (req: any, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.authToken ||
                req.headers['x-auth-token'] as string;
  
  console.log('🔐 requireFastAuth check:', {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 10)}...` : null,
    sessionCount: sessionStore.size,
    tokenCount: tokenStore.size
  });
  
  if (!token) {
    return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
  }
  
  const user = FastSessionManager.getSessionByToken(token);
  if (!user) {
    console.log('❌ No valid session for token');
    return res.status(401).json({ message: "انتهت صلاحية الجلسة" });
  }
  
  console.log('✅ Auth success for:', user.username);
  req.user = user;
  next();
};

// Optional auth middleware (doesn't require authentication)
export const optionalFastAuth: RequestHandler = (req: any, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.authToken ||
                req.headers['x-auth-token'] as string;
  
  console.log('🔍 optionalFastAuth check:', {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 10)}...` : null
  });
  
  if (token) {
    const user = FastSessionManager.getSessionByToken(token);
    if (user) {
      console.log('✅ Optional auth success for:', user.username);
      req.user = user;
    }
  }
  
  next();
};

// Setup fast authentication system
export function setupFastAuth(app: Express) {
  app.use(cookieParser());
  console.log('🚀 Fast session manager initialized');
}