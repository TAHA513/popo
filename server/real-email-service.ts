// Alternative Real Email Service using Nodemailer for production use
import * as nodemailer from 'nodemailer';
import { nanoid } from 'nanoid';

// Password reset tokens storage (in production, use Redis or database)
const resetTokens = new Map<string, { email: string, token: string, expires: number }>();

// Email configuration - will use user's SMTP settings
interface EmailConfig {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  from_email?: string;
}

class RealEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig = {};

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Try to use environment variables first
      if (process.env.SMTP_HOST) {
        this.config = {
          smtp_host: process.env.SMTP_HOST,
          smtp_port: parseInt(process.env.SMTP_PORT || '587'),
          smtp_user: process.env.SMTP_USER,
          smtp_pass: process.env.SMTP_PASS,
          from_email: process.env.FROM_EMAIL || process.env.SMTP_USER,
        };

        this.transporter = nodemailer.createTransporter({
          host: this.config.smtp_host,
          port: this.config.smtp_port,
          secure: this.config.smtp_port === 465,
          auth: {
            user: this.config.smtp_user,
            pass: this.config.smtp_pass,
          },
        });

        console.log('✅ تم تكوين خدمة البريد الإلكتروني باستخدام SMTP');
      } else {
        console.log('⚠️ لم يتم العثور على إعدادات SMTP');
      }
    } catch (error) {
      console.error('❌ خطأ في تكوين خدمة البريد الإلكتروني:', error);
    }
  }

  // Generate reset token
  generateResetToken(email: string): string {
    const token = nanoid(32);
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
    
    resetTokens.set(token, { email, token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  // Verify reset token
  verifyResetToken(token: string): { valid: boolean, email?: string } {
    const resetData = resetTokens.get(token);
    
    if (!resetData) {
      return { valid: false };
    }
    
    if (Date.now() > resetData.expires) {
      resetTokens.delete(token);
      return { valid: false };
    }
    
    return { valid: true, email: resetData.email };
  }

  // Clean up expired tokens
  private cleanupExpiredTokens() {
    const now = Date.now();
    Array.from(resetTokens.entries()).forEach(([token, data]) => {
      if (now > data.expires) {
        resetTokens.delete(token);
      }
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean, message: string }> {
    try {
      if (!this.transporter) {
        console.log('⚠️ خدمة البريد الإلكتروني غير مُكوّنة، إنشاء رابط محلي...');
        
        // Generate local reset token for testing/development
        const token = this.generateResetToken(email);
        const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${token}`;
        
        console.log('🔗 رابط إعادة تعيين كلمة المرور المحلي:');
        console.log(`📧 ${resetUrl}`);
        console.log('💡 يمكن للمستخدم استخدام هذا الرابط لإعادة تعيين كلمة المرور');
        
        return { 
          success: true, 
          message: 'تم إنشاء رابط إعادة تعيين كلمة المرور - راجع سجلات الخادم' 
        };
      }

      const token = this.generateResetToken(email);
      const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${token}`;

      const mailOptions = {
        from: this.config.from_email,
        to: email,
        subject: 'إعادة تعيين كلمة المرور - LaaBoBo',
        html: `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>مرحبًا،</p>
            <p>تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك في LaaBoBo.</p>
            <p>لإعادة تعيين كلمة المرور، انقر على الرابط التالي:</p>
            <p>
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                إعادة تعيين كلمة المرور
              </a>
            </p>
            <p>أو انسخ والصق الرابط التالي في متصفحك:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p>هذا الرابط صالح لمدة 15 دقيقة فقط.</p>
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
            <p>شكرًا لك،<br>فريق LaaBoBo</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('📧 ✅ تم إرسال رسالة إعادة تعيين كلمة المرور إلى:', email);
      
      return { 
        success: true, 
        message: 'تم إرسال رسالة إعادة تعيين كلمة المرور بنجاح' 
      };

    } catch (error) {
      console.error('❌ خطأ في إرسال رسالة إعادة تعيين كلمة المرور:', error);
      return { 
        success: false, 
        message: 'فشل في إرسال رسالة إعادة تعيين كلمة المرور' 
      };
    }
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ اتصال SMTP يعمل بشكل صحيح');
      return true;
    } catch (error) {
      console.error('❌ فشل في اختبار اتصال SMTP:', error);
      return false;
    }
  }
}

// Export singleton instance
export const realEmailService = new RealEmailService();
export { resetTokens };