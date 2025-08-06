import { storage } from "../storage.js";

export async function checkSuperAdmin(req, res, next) {
  try {
    const user = req.user;
    
    if (!user || !user.claims) {
      return res.status(403).json({ message: 'وصول مرفوض - مطلوب تسجيل دخول' });
    }
    
    // Get user from database to check role
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'وصول مرفوض - صلاحيات غير كافية' });
    }
    
    // Restrict access to system owner only
    const systemOwnerEmails = ['fnnm945@gmail.com', 'asaad11asaad90@gmail.com'];
    if (!systemOwnerEmails.includes(dbUser.email)) {
      return res.status(403).json({ message: 'وصول مرفوض - مقيد لمالك النظام فقط' });
    }
    
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    return res.status(500).json({ message: 'خطأ داخلي في الخادم' });
  }
}

export function checkAccessCode(req, res, next) {
  const accessCode = req.headers['x-access-code'];
  if (!accessCode || accessCode !== process.env.ADMIN_SECRET_CODE) {
    return res.status(403).send('Invalid Access Code');
  }
  next();
}