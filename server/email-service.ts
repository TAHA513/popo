import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// نظام إرسال البريد المبسط مع Gmail
interface EmailConfig {
  from: string;
  user: string;
  pass: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  // إعداد مزود البريد
  configure(emailConfig: EmailConfig) {
    this.config = emailConfig;
    
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });
  }

  // إرسال رسالة إعادة تعيين كلمة المرور
  async sendPasswordReset(email: string, resetLink: string) {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: this.config.from,
      to: email,
      subject: 'إعادة تعيين كلمة المرور - LaaBoBo',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>إعادة تعيين كلمة المرور</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
              direction: rtl;
              text-align: right;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .header {
              background: linear-gradient(45deg, #ff6b6b, #ee5a24);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(45deg, #ff6b6b, #ee5a24);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 إعادة تعيين كلمة المرور</h1>
              <p>LaaBoBo Platform</p>
            </div>
            <div class="content">
              <h2>مرحباً!</h2>
              <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في LaaBoBo.</p>
              <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="btn">إعادة تعيين كلمة المرور</a>
              </div>
              
              <p><strong>ملاحظة مهمة:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
              <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
            </div>
            <div class="footer">
              <p>© 2025 LaaBoBo Platform. جميع الحقوق محفوظة.</p>
              <p>لا ترد على هذه الرسالة - إنها رسالة تلقائية</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // اختبار الاتصال
  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }
    
    return await this.transporter.verify();
  }
}

// إنشاء خدمة البريد الإلكتروني
export const emailService = new EmailService();

// معالج توكن إعادة التعيين
const resetTokens = new Map<string, { email: string; expires: Date }>();

export function generateResetToken(email: string): string {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة
  
  resetTokens.set(token, { email, expires });
  
  // تنظيف التوكنات المنتهية الصلاحية
  setTimeout(() => {
    resetTokens.delete(token);
  }, 60 * 60 * 1000);
  
  return token;
}

export function validateResetToken(token: string): string | null {
  const tokenData = resetTokens.get(token);
  
  if (!tokenData) {
    return null;
  }
  
  if (new Date() > tokenData.expires) {
    resetTokens.delete(token);
    return null;
  }
  
  return tokenData.email;
}

export function deleteResetToken(token: string): void {
  resetTokens.delete(token);
}