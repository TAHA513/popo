import { Request, Response, NextFunction } from 'express';
import { clerk } from '../clerk-config.js';

// تم توسيع نوع Request لتشمل معلومات المستخدم
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        user?: any;
      };
    }
  }
}

// middleware للتحقق من مصادقة Clerk
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // الحصول على رمز المصادقة من header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'رمز المصادقة مطلوب' });
    }

    const token = authHeader.split(' ')[1];
    
    // التحقق من الرمز مع Clerk
    const session = await clerk.sessions.verifySession(token, token);
    if (!session) {
      return res.status(401).json({ error: 'رمز مصادقة غير صحيح' });
    }

    // الحصول على معلومات المستخدم
    const user = await clerk.users.getUser(session.userId);
    
    // إضافة معلومات المستخدم إلى request
    req.auth = {
      userId: session.userId,
      sessionId: session.id,
      user: user
    };

    next();
  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    return res.status(401).json({ error: 'فشل في التحقق من المصادقة' });
  }
}

// middleware اختياري للتحقق من المصادقة
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = await clerk.verifySession(token);
      
      if (session) {
        const user = await clerk.users.getUser(session.userId);
        req.auth = {
          userId: session.userId,
          sessionId: session.id,
          user: user
        };
      }
    }
    next();
  } catch (error) {
    // في حالة فشل المصادقة الاختيارية، نستمر بدون إعداد auth
    next();
  }
}

// وظيفة للحصول على معرف المستخدم من request
export function getUserId(req: Request): string | null {
  return req.auth?.userId || null;
}

// وظيفة للحصول على معلومات المستخدم من request
export function getUser(req: Request): any | null {
  return req.auth?.user || null;
}