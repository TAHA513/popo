import { storage } from "../storage.js";

export async function checkSuperAdmin(req, res, next) {
  try {
    const user = req.user;
    
    if (!user || !user.claims) {
      return res.status(403).send('Access Denied - No authentication');
    }
    
    // Get user from database to check role
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.role !== 'super_admin') {
      return res.status(403).send('Access Denied - Insufficient permissions');
    }
    
    // Check for secret access code in header
    const accessCode = req.headers['x-access-code'];
    if (!accessCode || accessCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).send('Invalid Access Code');
    }
    
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    return res.status(500).send('Internal server error');
  }
}

export function checkAccessCode(req, res, next) {
  const accessCode = req.headers['x-access-code'];
  if (!accessCode || accessCode !== process.env.ADMIN_SECRET_CODE) {
    return res.status(403).send('Invalid Access Code');
  }
  next();
}