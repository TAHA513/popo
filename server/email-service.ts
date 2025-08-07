import * as nodemailer from 'nodemailer';

// Email service configuration
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Check if SMTP credentials are available
      const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      // Only create transporter if all required config is available
      if (smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass) {
        this.transporter = nodemailer.createTransporter(smtpConfig);
        
        // Verify connection
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      } else {
        console.log('⚠️ SMTP credentials not configured - email service disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
    if (!this.transporter) {
      console.log('📧 Email service not available - skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'إعادة تعيين كلمة المرور - LaaBoBo',
        html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; text-align: center; margin: 0;">LaaBoBo</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h2>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
              لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في LaaBoBo.
            </p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
              للمتابعة، اضغط على الرابط أدناه لإنشاء كلمة مرور جديدة:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة. ستبقى كلمة المرور الحالية دون تغيير.
            </p>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              هذا الرابط صالح لمدة ساعة واحدة فقط من وقت إرساله.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              LaaBoBo - منصة التواصل الاجتماعي
            </p>
          </div>
        </div>
        `,
        text: `
إعادة تعيين كلمة المرور - LaaBoBo

لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.

للمتابعة، اضغط على الرابط التالي لإنشاء كلمة مرور جديدة:
${resetUrl}

إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.
هذا الرابط صالح لمدة ساعة واحدة فقط.

LaaBoBo - منصة التواصل الاجتماعي
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ تم إرسال رسالة إعادة التعيين بنجاح إلى:', email);
      return true;
    } catch (error) {
      console.error('❌ فشل في إرسال رسالة إعادة التعيين:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}

// Export singleton instance
export const emailService = new EmailService();