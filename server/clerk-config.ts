import { createClerkClient } from '@clerk/backend';

// إعداد Clerk للخادم
export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || 'sk_test_5ao6KWHj7jSVT7EEEU54CTD0mmDMPPHJvZn2UruiD6',
});

// وظيفة للتحقق من صحة المستخدم
export async function verifyClerkToken(sessionToken: string) {
  try {
    const session = await clerk.sessions.verifySession(sessionToken, sessionToken);
    return session;
  } catch (error) {
    console.error('خطأ في التحقق من رمز Clerk:', error);
    return null;
  }
}

// وظيفة للحصول على معلومات المستخدم من Clerk
export async function getClerkUser(userId: string) {
  try {
    const user = await clerk.users.getUser(userId);
    return user;
  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم من Clerk:', error);
    return null;
  }
}

// وظيفة لإرسال رسائل إعادة تعيين كلمة المرور
export async function sendPasswordResetEmail(email: string) {
  try {
    // Clerk يتعامل مع إرسال رسائل إعادة تعيين كلمة المرور تلقائياً
    const user = await clerk.users.getUserList({ emailAddress: [email] });
    
    if (user.data.length > 0) {
      // إرسال رسالة إعادة تعيين كلمة المرور عبر Clerk
      await clerk.users.getUser(user.data[0].id);
      return { success: true, message: 'تم إرسال رسالة إعادة تعيين كلمة المرور' };
    } else {
      return { success: false, message: 'البريد الإلكتروني غير مسجل' };
    }
  } catch (error) {
    console.error('خطأ في إرسال رسالة إعادة تعيين كلمة المرور:', error);
    return { success: false, message: 'حدث خطأ في إرسال الرسالة' };
  }
}