/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Delete existing entries
  await knex('email_templates').del();

  // Insert email templates
  await knex('email_templates').insert([
    // Email Verification Template
    {
      template_key: 'email_verification',
      name: 'Email Verification',
      description: 'Sent when a user needs to verify their email address',
      subject: 'Verify Your Email Address',
      body_text: `
Hello {{userName}},

Please verify your email address by clicking the link below:
{{verificationUrl}}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The ClubQore Team
      `.trim(),
      body_html: `
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

        <p>Hello {{userName}},</p>

        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>

        <div style="text-align: center;">
            <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">
            {{verificationUrl}}
        </p>

        <p><strong>This link will expire in 24 hours.</strong></p>

        <p>If you didn't create an account, please ignore this email.</p>

        <div class="footer">
            <p>Best regards,<br>The ClubQore Team</p>
        </div>
    </div>
</body>
</html>
      `.trim(),
      variables: JSON.stringify(['userName', 'verificationUrl']),
      is_active: true
    },

    // Password Reset Template
    {
      template_key: 'password_reset',
      name: 'Password Reset',
      description: 'Sent when a user requests a password reset',
      subject: 'Reset Your Password',
      body_text: `
Hello {{userName}},

We received a request to reset your password. Click the link below to reset it:
{{resetUrl}}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The ClubQore Team
      `.trim(),
      body_html: `
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

        <p>Hello {{userName}},</p>

        <p>We received a request to reset your password. Click the button below to reset it:</p>

        <div style="text-align: center;">
            <a href="{{resetUrl}}" class="button">Reset Password</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">
            {{resetUrl}}
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
      `.trim(),
      variables: JSON.stringify(['userName', 'resetUrl']),
      is_active: true
    },

    // Personnel Welcome Template
    {
      template_key: 'personnel_welcome',
      name: 'Personnel Welcome',
      description: 'Sent when a new team manager or staff member is added to a club',
      subject: 'Welcome to {{clubName}} - Your {{roleTitle}} Account',
      body_text: `
Hello {{userName}},

Your {{roleTitle}} account has been created for {{clubName}}!

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {{email}}
Temporary Password: {{temporaryPassword}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: {{loginUrl}}

IMPORTANT:
1. Please login and change your password immediately
2. You will be required to change your password on first login
3. Keep your credentials safe

If you have any questions or didn't expect this account, please contact the club administrator.

Best regards,
The ClubQore Team
      `.trim(),
      body_html: `
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
            <h1 style="margin: 0;">Welcome to {{clubName}}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your {{roleTitle}} Account is Ready</p>
        </div>

        <p>Hello <strong>{{userName}}</strong>,</p>

        <p>Your {{roleTitle}} account has been created for <strong>{{clubName}}</strong>!</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0;">🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span><br>
                <span class="credential-value">{{email}}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span><br>
                <span class="credential-value">{{temporaryPassword}}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="{{loginUrl}}" class="button">Login to Your Account</a>
        </div>

        <div class="security-notice">
            <p style="margin-top: 0;"><strong>⚠️ Important Security Steps:</strong></p>
            <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Login with the credentials above</li>
                <li>You will be required to change your password immediately</li>
                <li>Keep your credentials safe</li>
            </ol>
        </div>

        <p style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            <strong>Need Help?</strong><br>
            If you have any questions or didn't expect this account, please contact the club administrator.
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
      `.trim(),
      variables: JSON.stringify(['userName', 'email', 'temporaryPassword', 'clubName', 'roleTitle', 'loginUrl']),
      is_active: true
    },

    // Member Welcome Template
    {
      template_key: 'member_welcome',
      name: 'Member Welcome',
      description: 'Sent when a new member is added to a club',
      subject: 'Welcome to ClubQore - Your Account Details',
      body_text: `
Hello {{userName}},

Your ClubQore account has been created.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {{email}}
{{#temporaryPassword}}Temporary Password: {{temporaryPassword}}
{{/temporaryPassword}}Account Number: {{accountNumber}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: {{loginUrl}}

IMPORTANT:
1. Please login and change your password immediately
2. You may be required to change your password on first login

Best regards,
The ClubQore Team
      `.trim(),
      body_html: `
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
        <p>Hello <strong>{{userName}}</strong>,</p>
        <p>Your ClubQore account has been created.</p>
        <div class="credentials-box">
            <div><span class="label">Email:</span><br><span class="value">{{email}}</span></div>
            {{#temporaryPassword}}
            <div style="margin-top:8px;"><span class="label">Temporary Password:</span><br><span class="value">{{temporaryPassword}}</span></div>
            {{/temporaryPassword}}
            <div style="margin-top:8px;"><span class="label">Account Number:</span><br><span class="value">{{accountNumber}}</span></div>
        </div>
        <div style="text-align:center;">
            <a href="{{loginUrl}}" class="button">Login to Your Account</a>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>The ClubQore Team</strong></p>
            <p style="font-size: 12px; color: #adb5bd; margin-top: 10px;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
      `.trim(),
      variables: JSON.stringify(['userName', 'email', 'temporaryPassword', 'accountNumber', 'loginUrl']),
      is_active: true
    },

    // Team Manager Welcome Template (for compatibility with existing code)
    {
      template_key: 'team_manager_welcome',
      name: 'Team Manager Welcome',
      description: 'Sent when a new team manager is created',
      subject: 'Welcome to {{clubName}} - Your Team Manager Account',
      body_text: `
Hello {{userName}},

{{clubManagerName}} has created a Team Manager account for you at {{clubName}}!

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {{email}}
Temporary Password: {{temporaryPassword}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: {{loginUrl}}

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

If you have any questions or didn't expect this account, please contact {{clubManagerName}} or the club administrator.

Best regards,
The ClubQore Team
      `.trim(),
      body_html: `
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
            <h1 style="margin: 0;">🎉 Welcome to {{clubName}}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Team Manager Account is Ready</p>
        </div>

        <p>Hello <strong>{{userName}}</strong>,</p>

        <p>{{clubManagerName}} has created a Team Manager account for you at <strong>{{clubName}}</strong>!</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0;">🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span><br>
                <span class="credential-value">{{email}}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span><br>
                <span class="credential-value">{{temporaryPassword}}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="{{loginUrl}}" class="button">Login to Your Account</a>
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
            <strong>{{clubManagerName}}</strong> or the club administrator.
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
      `.trim(),
      variables: JSON.stringify(['userName', 'email', 'temporaryPassword', 'clubName', 'clubManagerName', 'loginUrl']),
      is_active: true
    },

    // Invoice Notification Template
    {
      template_key: 'invoice_notification',
      name: 'Invoice Notification',
      description: 'Sent to parents when a new invoice is created or published',
      subject: 'New Invoice from {{clubName}} - {{invoiceNumber}}',
      body_text: `
Hello {{parentName}},

A new invoice has been issued for {{memberName}}.

Invoice Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invoice Number: {{invoiceNumber}}
Member: {{memberName}}
{{#seasonName}}Season: {{seasonName}}
{{/seasonName}}Issue Date: {{issueDate}}
Due Date: {{dueDate}}
Total Amount: {{totalAmount}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{#items}}
Items:
{{#items}}
• {{description}} - {{totalPrice}}
{{/items}}
{{/items}}

{{#notes}}
Notes: {{notes}}
{{/notes}}

You can view the full invoice details by logging into your account:
{{invoiceUrl}}

Payment is due by {{dueDate}}.

If you have any questions about this invoice, please contact the club.

Best regards,
{{clubName}}
      `.trim(),
      body_html: `
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
            <p style="margin: 10px 0 0 0; opacity: 0.9;">From {{clubName}}</p>
        </div>

        <p>Hello <strong>{{parentName}}</strong>,</p>

        <p>A new invoice has been issued for <strong>{{memberName}}</strong>.</p>

        <div class="invoice-box">
            <h3 style="margin-top: 0;">Invoice Details</h3>
            <div class="invoice-item">
                <span class="invoice-label">Invoice Number:</span>
                <span class="invoice-value"><strong>{{invoiceNumber}}</strong></span>
            </div>
            <div class="invoice-item">
                <span class="invoice-label">Member:</span>
                <span class="invoice-value">{{memberName}}</span>
            </div>
            {{#seasonName}}
            <div class="invoice-item">
                <span class="invoice-label">Season:</span>
                <span class="invoice-value">{{seasonName}}</span>
            </div>
            {{/seasonName}}
            <div class="invoice-item">
                <span class="invoice-label">Issue Date:</span>
                <span class="invoice-value">{{issueDate}}</span>
            </div>
            <div class="invoice-item">
                <span class="invoice-label">Due Date:</span>
                <span class="invoice-value"><strong>{{dueDate}}</strong></span>
            </div>
            <div class="invoice-item">
                <span class="invoice-label">Total Amount:</span>
                <span class="invoice-value"><strong style="font-size: 20px; color: #10b981;">{{totalAmount}}</strong></span>
            </div>
        </div>

        {{#items}}
        <h3>Invoice Items</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {{#items}}
                <tr>
                    <td>{{description}}</td>
                    <td style="text-align: right;">{{totalPrice}}</td>
                </tr>
                {{/items}}
                <tr class="total-row">
                    <td>Total</td>
                    <td style="text-align: right;">{{totalAmount}}</td>
                </tr>
            </tbody>
        </table>
        {{/items}}

        {{#notes}}
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>Notes:</strong><br>
            {{notes}}
        </div>
        {{/notes}}

        <div style="text-align: center;">
            <a href="{{invoiceUrl}}" class="button">View Full Invoice</a>
        </div>

        <div class="due-date-notice">
            <p style="margin: 0;"><strong>⏰ Payment Due:</strong> {{dueDate}}</p>
        </div>

        <p style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            <strong>Questions?</strong><br>
            If you have any questions about this invoice, please contact the club.
        </p>

        <div class="footer">
            <p>Best regards,<br><strong>{{clubName}}</strong></p>
            <p style="font-size: 12px; color: #adb5bd; margin-top: 10px;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
      `.trim(),
      variables: JSON.stringify(['parentName', 'memberName', 'clubName', 'invoiceNumber', 'seasonName', 'issueDate', 'dueDate', 'totalAmount', 'items', 'notes', 'invoiceUrl']),
      is_active: true
    }
  ]);
}
