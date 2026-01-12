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

  async sendTeamManagerWelcome({
    to,
    userName,
    email,
    temporaryPassword,
    clubName,
    clubManagerName,
    loginUrl
  }) {
    const subject = `Welcome to ${clubName} - Your Team Manager Account`;
    
    const text = `
Hello ${userName},

${clubManagerName} has created a Team Manager account for you at ${clubName}!

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${email}
Temporary Password: ${temporaryPassword}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: ${loginUrl}

IMPORTANT: 
1. Please login and change your password immediately
2. You will be required to change your password on first login
3. Keep your account number safe for support purposes

What you can do as a Team Manager:
• Manage team schedules and training sessions
• Track member attendance and performance
• Communicate with team members and parents
• Access club resources and facilities
• Create and manage events

If you have any questions or didn't expect this account, please contact ${clubManagerName} or the club administrator.

Best regards,
The ClubQore Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6; 
          color: #333; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }
        .credentials-box { 
          background: #f8f9fa; 
          border-left: 4px solid #667eea; 
          padding: 20px; 
          margin: 20px 0;
          border-radius: 4px;
        }
        .credential-item {
          margin: 10px 0;
          font-family: 'Courier New', monospace;
        }
        .credential-label {
          font-weight: bold;
          color: #495057;
        }
        .credential-value {
          color: #212529;
          font-size: 16px;
        }
        .button { 
          display: inline-block; 
          padding: 14px 28px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
          font-weight: 600;
        }
        .security-notice { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          border-radius: 6px; 
          padding: 15px; 
          margin: 20px 0; 
        }
        .features-list {
          background: #e7f3ff;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .features-list ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .features-list li {
          margin: 8px 0;
        }
        .footer { 
          margin-top: 30px; 
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          font-size: 14px; 
          color: #6c757d;
          text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎉 Welcome to ${clubName}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Team Manager Account is Ready</p>
        </div>
        
        <p>Hello <strong>${userName}</strong>,</p>
        
        <p>${clubManagerName} has created a Team Manager account for you at <strong>${clubName}</strong>!</p>
        
        <div class="credentials-box">
            <h3 style="margin-top: 0;">🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span><br>
                <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span><br>
                <span class="credential-value">${temporaryPassword}</span>
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Your Account</a>
        </div>
        
        <div class="security-notice">
            <p style="margin-top: 0;"><strong>⚠️ Important Security Steps:</strong></p>
            <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Login with the credentials above</li>
                <li>You will be required to change your password immediately</li>
                <li>Keep your account number safe for support purposes</li>
                <li>Enable two-factor authentication (recommended)</li>
            </ol>
        </div>
        
        <div class="features-list">
            <h3 style="margin-top: 0;">✨ What You Can Do as a Team Manager:</h3>
            <ul>
                <li>📅 Manage team schedules and training sessions</li>
                <li>📊 Track member attendance and performance</li>
                <li>💬 Communicate with team members and parents</li>
                <li>📚 Access club resources and facilities</li>
                <li>🎯 Create and manage events</li>
                <li>📈 View team analytics and reports</li>
            </ul>
        </div>
        
        <p style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            <strong>Need Help?</strong><br>
            If you have any questions or didn't expect this account, please contact 
            <strong>${clubManagerName}</strong> or the club administrator.
        </p>
        
        <div class="footer">
            <p>Best regards,<br><strong>The ClubQore Team</strong></p>
            <p style="font-size: 12px; color: #adb5bd; margin-top: 10px;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to, subject, text, html });
  }

  async sendMemberWelcome({
    to,
    userName,
    email,
    temporaryPassword,
    accountNumber,
    loginUrl
  }) {
    const subject = `Welcome to ClubQore - Your Account Details`;

    const text = `
Hello ${userName},

Your ClubQore account has been created.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${email}
${temporaryPassword ? `Temporary Password: ${temporaryPassword}\n` : ''}Account Number: ${accountNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: ${loginUrl}

IMPORTANT:
1. Please login and change your password immediately
2. You may be required to change your password on first login

Best regards,
The ClubQore Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border-radius: 8px; }
        .credentials-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; margin: 16px 0; border-radius: 4px; }
        .label { font-weight: 600; color: #495057; }
        .value { font-family: 'Courier New', monospace; color: #212529; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; text-align: center; }
    </style>
    </head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin:0;">Welcome to ClubQore</h2>
        </div>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your ClubQore account has been created.</p>
        <div class="credentials-box">
            <div><span class="label">Email:</span><br><span class="value">${email}</span></div>
            ${temporaryPassword ? `<div style="margin-top:8px;"><span class="label">Temporary Password:</span><br><span class="value">${temporaryPassword}</span></div>` : ''}
            <div style="margin-top:8px;"><span class="label">Account Number:</span><br><span class="value">${accountNumber}</span></div>
        </div>
        <div style="text-align:center;">
            <a href="${loginUrl}" class="button">Login to Your Account</a>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>The ClubQore Team</strong></p>
            <p style="font-size: 12px; color: #adb5bd; margin-top: 10px;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to, subject, text, html });
  }

  /**
   * Send invoice notification to parent
   * @param {Object} invoiceData - Invoice data
   * @param {Object} parentData - Parent user data
   * @param {Object} memberData - Member user data
   * @param {Object} clubData - Club data
   * @returns {Promise<Object>} Email send result
   */
  async sendInvoiceNotification({ invoiceData, parentData, memberData, clubData }) {
    const to = parentData.email;

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Prepare invoice URL
    const invoiceUrl = `${config.app.frontendUrl}/app/parent/billing/${invoiceData.id}`;

    // Format invoice items for email
    const formattedItems = (invoiceData.items || []).map(item => ({
      description: item.description,
      totalPrice: formatCurrency(item.total_price)
    }));

    const subject = `New Invoice from ${clubData.name} - ${invoiceData.invoice_number}`;

    const text = `
Hello ${parentData.first_name} ${parentData.last_name},

A new invoice has been issued for ${memberData.first_name} ${memberData.last_name}.

Invoice Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: ${invoiceData.invoice_number}
Member: ${memberData.first_name} ${memberData.last_name}
${invoiceData.season_name ? `Season: ${invoiceData.season_name}` : ''}
Issue Date: ${formatDate(invoiceData.issue_date)}
Due Date: ${formatDate(invoiceData.due_date)}
Total Amount: ${formatCurrency(invoiceData.total_amount)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formattedItems.length > 0 ? `Items:\n${formattedItems.map(item => `• ${item.description} - ${item.totalPrice}`).join('\n')}` : ''}

${invoiceData.notes ? `Notes: ${invoiceData.notes}` : ''}

You can view the full invoice details by logging into your account:
${invoiceUrl}

Payment is due by ${formatDate(invoiceData.due_date)}.

If you have any questions about this invoice, please contact the club.

Best regards,
${clubData.name}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 8px;
          color: white;
        }
        .invoice-box {
          background: #f8f9fa;
          border-left: 4px solid #10b981;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .invoice-item {
          margin: 10px 0;
        }
        .invoice-label {
          font-weight: 600;
          color: #495057;
          display: inline-block;
          width: 140px;
        }
        .invoice-value {
          color: #212529;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background: #f1f3f5;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }
        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #e9ecef;
        }
        .total-row {
          background: #e7f5ff;
          font-weight: 600;
          font-size: 18px;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .due-date-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          font-size: 14px;
          color: #6c757d;
          text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">📄 New Invoice</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">From ${clubData.name}</p>
        </div>

        <p>Hello <strong>${parentData.first_name} ${parentData.last_name}</strong>,</p>

        <p>A new invoice has been issued for <strong>${memberData.first_name} ${memberData.last_name}</strong>.</p>

        <div class="invoice-box">
            <h3 style="margin-top: 0;">Invoice Details</h3>
            <div class="invoice-item">
                <span class="invoice-label">Invoice Number:</span>
                <span class="invoice-value"><strong>${invoiceData.invoice_number}</strong></span>
            </div>
            <div class="invoice-item">
                <span class="invoice-label">Member:</span>
                <span class="invoice-value">${memberData.first_name} ${memberData.last_name}</span>
            </div>
            ${invoiceData.season_name ? `
            <div class="invoice-item">
                <span class="invoice-label">Season:</span>
                <span class="invoice-value">${invoiceData.season_name}</span>
            </div>
            ` : ''}
            <div class="invoice-item">
                <span class="invoice-label">Issue Date:</span>
                <span class="invoice-value">${formatDate(invoiceData.issue_date)}</span>
            </div>
            <div class="invoice-item">
                <span class="invoice-label">Due Date:</span>
                <span class="invoice-value"><strong>${formatDate(invoiceData.due_date)}</strong></span>
            </div>
            <div class="invoice-item">
                <span class="invoice-label">Total Amount:</span>
                <span class="invoice-value"><strong style="font-size: 20px; color: #10b981;">${formatCurrency(invoiceData.total_amount)}</strong></span>
            </div>
        </div>

        ${formattedItems.length > 0 ? `
        <h3>Invoice Items</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${formattedItems.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">${item.totalPrice}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td>Total</td>
                    <td style="text-align: right;">${formatCurrency(invoiceData.total_amount)}</td>
                </tr>
            </tbody>
        </table>
        ` : ''}

        ${invoiceData.notes ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>Notes:</strong><br>
            ${invoiceData.notes}
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${invoiceUrl}" class="button">View Full Invoice</a>
        </div>

        <div class="due-date-notice">
            <p style="margin: 0;"><strong>⏰ Payment Due:</strong> ${formatDate(invoiceData.due_date)}</p>
        </div>

        <p style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            <strong>Questions?</strong><br>
            If you have any questions about this invoice, please contact the club.
        </p>

        <div class="footer">
            <p>Best regards,<br><strong>${clubData.name}</strong></p>
            <p style="font-size: 12px; color: #adb5bd; margin-top: 10px;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.sendEmail({ to, subject, text, html });
  }
}

// Export singleton instance
export const emailService = new EmailService();
