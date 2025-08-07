import { clerk } from './clerk-config.js';
import { DatabaseStorage } from './storage.js';

// محول لتحويل بيانات المستخدمين من Clerk إلى تنسيق قاعدة البيانات المحلية
export class ClerkStorageAdapter {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  // تحويل مستخدم Clerk إلى مستخدم محلي
  async syncUserFromClerk(clerkUserId: string) {
    try {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      
      if (!clerkUser) {
        throw new Error('لم يتم العثور على المستخدم في Clerk');
      }

      // التحقق من وجود المستخدم في قاعدة البيانات المحلية
      const existingUser = await this.storage.getUserById(clerkUser.id);
      
      if (existingUser) {
        // تحديث معلومات المستخدم الموجود
        return await this.storage.updateUser(clerkUser.id, {
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          username: clerkUser.username || clerkUser.firstName || 'مستخدم',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.imageUrl,
        });
      } else {
        // إنشاء مستخدم جديد
        const newUser = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          username: clerkUser.username || clerkUser.firstName || 'مستخدم',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.imageUrl,
          passwordHash: '', // Clerk يدير كلمات المرور
          points: 0, // النظام الجديد: بدء بـ 0 نقطة (نظام مدفوع)
          bio: null,
          location: null,
          phone: null,
          isVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          verificationBadge: null,
          onlineStatus: 'online',
          lastSeenAt: new Date(),
          isOnline: true,
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          streamsCount: 0,
          totalViewTime: 0,
          country: null,
          privacySettings: JSON.stringify({
            showEmail: false,
            showPhone: false,
            showOnlineStatus: true,
            allowMessageRequests: true,
            showLastSeen: true
          }),
          supporterLevel: 0,
          supporterPoints: 0,
          achievements: null,
          preferences: JSON.stringify({
            language: 'ar',
            theme: 'light',
            notifications: true
          }),
          selectedCharacterId: null,
          coverImageUrl: null,
          passwordResetToken: null,
          passwordResetExpiry: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return await this.storage.createUser(newUser);
      }
    } catch (error) {
      console.error('خطأ في مزامنة المستخدم من Clerk:', error);
      throw error;
    }
  }

  // التحقق من وجود المستخدم ومزامنته إذا لزم الأمر
  async ensureUserExists(clerkUserId: string) {
    try {
      let user = await this.storage.getUserById(clerkUserId);
      
      if (!user) {
        user = await this.syncUserFromClerk(clerkUserId);
      }
      
      return user;
    } catch (error) {
      console.error('خطأ في التأكد من وجود المستخدم:', error);
      throw error;
    }
  }

  // تحديث حالة المستخدم كونه متصل
  async updateUserOnlineStatus(clerkUserId: string, isOnline: boolean) {
    try {
      await this.ensureUserExists(clerkUserId);
      
      return await this.storage.updateUser(clerkUserId, {
        isOnline,
        lastSeenAt: new Date(),
        onlineStatus: isOnline ? 'online' : 'offline'
      });
    } catch (error) {
      console.error('خطأ في تحديث حالة الاتصال:', error);
      throw error;
    }
  }
}