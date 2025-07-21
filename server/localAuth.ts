import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { Express, RequestHandler } from "express";
import { nanoid } from "nanoid";

export function setupLocalAuth(app: Express) {
  // Local strategy for username/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValid) {
          return done(null, false, { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user && (req.user as any).role === 'super_admin') {
    return next();
  }
  res.status(403).json({ message: "غير مصرح لك بالوصول" });
};