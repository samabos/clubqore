import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

export class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // In test environment, use a mock transporter to avoid network calls
      // But allow override with USE_REAL_EMAIL=true for frontend testing
      if (process.env.NODE_ENV === 'test' && process.env.USE_REAL_EMAIL !== 'true') {
        this.transporter = {
          sendMail: async () => ({
            messageId: 'test-message-id',
            accepted: ['test@example.com'],
            rejected: [],
            envelope: { from: 'test@example.com', to: ['test@example.com'] }
          }),
          verify: async () => true
        };
        console.log('📧 Using mock email service for tests');
        this.initialized = true;
        return;
      }

      // Configure based on environment
      if (config.email.provider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.email.user,
            pass: config.email.password // App password for Gmail
          }
        });
      } else if (config.email.provider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure, // true for 465, false for other ports
          auth: {
            user: config.email.user,
            pass: config.email.password
          },
          // Ignore certificate errors in development/test
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          }
        });
      } else if (config.email.provider === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: config.email.apiKey
          }
        });
      } else {
        // Development mode - use Ethereal (fake SMTP)
        // Check if user has existing Ethereal credentials in config
        if (config.email.user && config.email.password) {
          // Use existing Ethereal account
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: config.email.user,
              pass: config.email.password
            },
            // Ignore certificate errors in development/test
            tls: {
              rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
          });
          
          // Store credentials for easy access
          this.etherealCredentials = {
            user: config.email.user,
            pass: config.email.password,
            web: 'https://ethereal.email'
          };
          
          console.log('\n📧 ═══════════════════════════════════════════════════════════');
          console.log('📧 ETHEREAL EMAIL - USING YOUR ACCOUNT');
          console.log('📧 ═══════════════════════════════════════════════════════════');
          console.log('📧 Web Interface: https://ethereal.email');
          console.log('📧 Username:', config.email.user);
          console.log('📧 All emails will be sent to your existing Ethereal inbox');
          console.log('📧 ═══════════════════════════════════════════════════════════\n');
        } else {
          // Generate temporary account as fallback
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            },
            // Ignore certificate errors in development/test
            tls: {
              rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
          });
          
          // Store credentials for easy access
          this.etherealCredentials = {
            user: testAccount.user,
            pass: testAccount.pass,
            web: 'https://ethereal.email'
          };
          
          console.log('\n📧 ═══════════════════════════════════════════════════════════');
          console.log('📧 ETHEREAL EMAIL - TEMPORARY ACCOUNT');
          console.log('📧 ═══════════════════════════════════════════════════════════');
          console.log('📧 Web Interface: https://ethereal.email');
          console.log('📧 Username:', testAccount.user);
          console.log('📧 Password:', testAccount.pass);
          console.log('📧 ═══════════════════════════════════════════════════════════');
          console.log('📧 All emails will be captured and viewable at the web interface');
          console.log('📧 Use the credentials above to login and view sent emails');
          console.log('📧 ═══════════════════════════════════════════════════════════\n');
        }
      }

      // Verify connection
      if (config.email.provider !== 'test') {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // In development, fall back to console logging
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Falling back to console logging for emails');
        this.transporter = null;
      } else {
        throw error;
      }
    }
  }

  // Get Ethereal credentials for manual login
  getEtherealCredentials() {
    if (this.etherealCredentials) {
      return this.etherealCredentials;
    }
    return null;
  }

  async sendEmail({ to, subject, text, html }) {
    await this.init();

    // Fallback to console logging if no transporter
    if (!this.transporter) {
      console.log('\n📧 EMAIL (Console Fallback):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text);
      console.log('HTML:', html);
      console.log('='.repeat(50));
      return { messageId: 'console-fallback', preview: null };
    }

    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // For Ethereal, provide preview URL and credentials reminder
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log('\n📧 ═══════════════════════════════════════════════════════════');
        console.log('📧 EMAIL SENT SUCCESSFULLY!');
        console.log('📧 ═══════════════════════════════════════════════════════════');
        console.log('📧 To:', to);
        console.log('📧 Subject:', subject);
        console.log('📧 Direct Preview:', preview);
        
        if (this.etherealCredentials) {
          console.log('📧 ───────────────────────────────────────────────────────────');
          console.log('📧 Or login to view all emails:');
          console.log('📧 Website: https://ethereal.email');
          console.log('📧 Username:', this.etherealCredentials.user);
          console.log('📧 Password:', this.etherealCredentials.pass);
        }
        console.log('📧 ═══════════════════════════════════════════════════════════\n');
      }

      return {
        messageId: info.messageId,
        preview
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw new Error('Failed to send email');
    }
  }

  async sendEmailVerification(email, token, userName = '') {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;
    
    const subject = 'Verify Your Email Address';
    const text = `
Hello ${userName},

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The ClubQore Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        
        <p>Hello ${userName},</p>
        
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">
            ${verificationUrl}
        </p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <p>If you didn't create an account, please ignore this email.</p>
        
        <div class="footer">
            <p>Best regards,<br>The ClubQore Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }

  async sendPasswordReset(email, token, userName = '') {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;
    
    const subject = 'Reset Your Password';
    const text = `
Hello ${userName},

We received a request to reset your password. Click the link below to reset it:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The ClubQore Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #dc3545; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        .security-notice { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        
        <p>Hello ${userName},</p>
        
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">
            ${resetUrl}
        </p>
        
        <div class="security-notice">
            <p><strong>Security Notice:</strong></p>
            <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, consider changing your password regularly</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The ClubQore Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to: email, subject, text, html });
  }
}

// Export singleton instance
export const emailService = new EmailService();
