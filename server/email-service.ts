// Email Service for sending password reset emails
import nodemailer, { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    // Check if email credentials are provided
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
      console.log('⚠️ إعدادات البريد الإلكتروني غير متاحة - EMAIL_USER أو EMAIL_PASS غير محددين');
      // Create a mock transporter that will fail gracefully
      this.transporter = {
        sendMail: async () => {
          throw new Error('Email credentials not configured');
        },
        verify: async () => {
          throw new Error('Email credentials not configured');
        }
      } as any;
      return;
    }

    // Gmail SMTP configuration (you can change this to your preferred provider)
    const emailConfig: EmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass, // App password for Gmail
      },
    };

    this.transporter = nodemailer.createTransporter(emailConfig);
  }

  async sendPasswordReset(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"LaaBoBo" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'إعادة تعيين كلمة المرور - LaaBoBo',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">LaaBoBo</h1>
              <p style="color: #666; margin: 5px 0;">منصة البث الاجتماعي العربية</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">طلب إعادة تعيين كلمة المرور</h2>
              <p style="color: #555; line-height: 1.6;">
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0; font-size: 14px;">
                ⚠️ هذا الرابط صالح لمدة 24 ساعة فقط
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                إذا لم تستطع النقر على الزر أعلاه، انسخ والصق هذا الرابط في متصفحك:
              </p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 5px 0;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                فريق LaaBoBo<br>
                منصة البث الاجتماعي العربية
              </p>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ تم إرسال البريد الإلكتروني بنجاح:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
      return false;
    }
  }

  // Test email connection
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ اتصال البريد الإلكتروني يعمل بشكل صحيح');
      return true;
    } catch (error) {
      console.error('❌ فشل في اتصال البريد الإلكتروني:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();