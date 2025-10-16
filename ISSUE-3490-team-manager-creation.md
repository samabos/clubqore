# Issue #3490: Club Managers Can Create Team Managers (Coaches) with Login Notification

## 📋 Overview

Enable club managers to create Team Manager (Coach) accounts directly from the club management interface. When a team manager is created, they will automatically receive an email with their login credentials and welcome information.

## 🎯 User Story

**As a** Club Manager  
**I want to** create Team Manager/Coach accounts for my club  
**So that** coaches can access the platform and manage their teams without going through the full registration process

## 🔍 Current State Analysis

### Existing Infrastructure

✅ **Role System**: The `club_coach` role already exists in the roles table  
✅ **Email Service**: Email notification system is in place (`src/services/emailService.js`)  
✅ **Multi-Role System**: User roles table and multi-role onboarding system exists  
✅ **Authentication**: JWT-based auth system with password hashing  
✅ **Database Schema**: Tables for users, user_roles, user_profiles, and clubs exist

### Database Schema (Existing)

```sql
-- roles table already has:
{
  name: 'club_coach',
  display_name: 'Club Coach', 
  description: 'Coaches and trains club members'
}

-- user_roles table structure:
user_roles (
  id,
  user_id,
  role ENUM('club_manager', 'member', 'parent'), -- ⚠️ Missing 'club_coach'
  club_id,
  is_active,
  ...
)
```

## 🚀 Feature Requirements

### 1. Club Manager Interface

**Location**: `/club/management/personnel` (already exists)

#### Create Team Manager Form
- **Personal Information**
  - First Name (required)
  - Last Name (required)
  - Email (required, unique)
  - Phone Number (optional)
  - Date of Birth (optional)

- **Coach-Specific Information**
  - Specialization/Position (e.g., "Head Coach", "Assistant Coach", "Goalkeeper Coach")
  - Certification Level (optional)
  - Years of Experience (optional)
  - Bio/Description (optional)

- **Access & Permissions**
  - Assign to specific teams (optional, can be multiple)
  - Access level (view-only, manage, full-access)

### 2. Backend Implementation

#### API Endpoint: Create Team Manager
```typescript
POST /api/clubs/:clubId/team-managers

Authorization: Bearer <jwt_token>
Role Required: club_manager

Request Body:
{
  personalData: {
    firstName: string;          // required
    lastName: string;           // required
    email: string;              // required, unique
    phone?: string;
    dateOfBirth?: string;       // ISO date
  },
  coachData: {
    specialization: string;     // e.g., "Head Coach"
    certificationLevel?: string;
    yearsOfExperience?: number;
    bio?: string;
    assignedTeams?: string[];   // Team IDs
    accessLevel: 'view' | 'manage' | 'full';
  },
  sendLoginEmail: boolean;      // Default: true
}

Response:
{
  success: boolean;
  teamManager: {
    id: string;
    accountNumber: string;      // e.g., "CQ202500042"
    email: string;
    fullName: string;
    role: "club_coach";
    clubId: string;
    clubName: string;
    isActive: boolean;
    createdAt: string;
  },
  temporaryPassword: string;    // Only returned, not stored
  emailSent: boolean;
  message: string;
}
```

#### Implementation Steps

1. **Validate Club Manager Authorization**
   ```javascript
   // Verify requesting user is club_manager for this club
   const isAuthorized = await checkClubManagerAuth(userId, clubId);
   if (!isAuthorized) {
     throw new Error('UNAUTHORIZED_CLUB_ACCESS');
   }
   ```

2. **Check Email Uniqueness**
   ```javascript
   const existingUser = await db('users')
     .where('email', email)
     .first();
   
   if (existingUser) {
     throw new Error('EMAIL_ALREADY_EXISTS');
   }
   ```

3. **Generate Secure Temporary Password**
   ```javascript
   import crypto from 'crypto';
   
   // Generate secure random password (12 characters)
   const generateTemporaryPassword = () => {
     const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
     let password = '';
     const randomBytes = crypto.randomBytes(12);
     
     for (let i = 0; i < 12; i++) {
       password += charset[randomBytes[i] % charset.length];
     }
     
     return password;
   };
   
   const temporaryPassword = generateTemporaryPassword();
   const passwordHash = await bcrypt.hash(temporaryPassword, 10);
   ```

4. **Create User Account (Transaction)**
   ```javascript
   await db.transaction(async (trx) => {
     // 1. Create user account
     const [userId] = await trx('users').insert({
       email: email.toLowerCase(),
       password_hash: passwordHash,
       primary_role: 'club_coach',
       email_verified: false,  // Will verify on first login
       is_onboarded: false,    // Will complete on first login
       created_at: new Date(),
       updated_at: new Date()
     });
     
     // 2. Create user profile
     await trx('user_profiles').insert({
       user_id: userId,
       first_name: firstName,
       last_name: lastName,
       full_name: `${firstName} ${lastName}`,
       phone: phone || null,
       date_of_birth: dateOfBirth || null,
       created_at: new Date(),
       updated_at: new Date()
     });
     
     // 3. Generate account number
     const accountNumber = await accountNumberService.generate(trx);
     
     // 4. Create user role
     await trx('user_roles').insert({
       user_id: userId,
       role: 'club_coach',
       club_id: clubId,
       is_active: true,
       created_at: new Date(),
       updated_at: new Date()
     });
     
     // 5. Create user account record
     await trx('user_accounts').insert({
       user_id: userId,
       account_number: accountNumber,
       role: 'club_coach',
       club_id: clubId,
       position: coachData.specialization,
       is_active: true,
       onboarding_completed_at: null, // Will complete on first login
       created_at: new Date(),
       updated_at: new Date()
     });
     
     // 6. Store coach-specific data (optional: create coaches table)
     // For now, can use JSON in role_data or create separate coach_profiles table
     
     return { userId, accountNumber };
   });
   ```

5. **Send Login Credentials Email**
   ```javascript
   if (sendLoginEmail) {
     await emailService.sendTeamManagerWelcome({
       to: email,
       userName: `${firstName} ${lastName}`,
       email: email,
       temporaryPassword: temporaryPassword,
       clubName: club.name,
       clubManagerName: clubManager.name,
       accountNumber: accountNumber,
       loginUrl: `${config.app.frontendUrl}/login`
     });
   }
   ```

### 3. Email Notification

#### New Email Template: Team Manager Welcome

**File**: `src/services/emailService.js`

```javascript
async sendTeamManagerWelcome({
  to,
  userName,
  email,
  temporaryPassword,
  clubName,
  clubManagerName,
  accountNumber,
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
Account Number: ${accountNumber}
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
            <div class="credential-item">
                <span class="credential-label">Account Number:</span><br>
                <span class="credential-value">${accountNumber}</span>
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
```

### 4. Security Considerations

#### Password Security
- ✅ Generate cryptographically secure random passwords (12+ characters)
- ✅ Use mix of uppercase, lowercase, numbers, and special characters
- ✅ Hash passwords with bcrypt (cost factor 10+)
- ✅ **Never store temporary password in database**
- ✅ Force password change on first login

#### Authorization
- ✅ Verify club manager has permission for the specific club
- ✅ Validate club exists and is active
- ✅ Check email uniqueness across entire system
- ✅ Rate limit account creation (max 10 per hour per club manager)

#### Email Security
- ✅ Send to verified email addresses only
- ✅ Include account verification step
- ✅ Log all account creation events for audit trail
- ✅ Include support contact information

#### Data Privacy
- ✅ Comply with GDPR for data collection
- ✅ Get implicit consent for email communication
- ✅ Allow opt-out of non-essential communications
- ✅ Securely delete data on account removal

### 5. Database Schema Updates

#### Update user_roles table enum
```sql
-- Migration: Add club_coach to user_roles enum
ALTER TABLE user_roles 
MODIFY COLUMN role ENUM('club_manager', 'club_coach', 'member', 'parent') NOT NULL;

-- Or for PostgreSQL:
ALTER TABLE user_roles 
ALTER COLUMN role TYPE VARCHAR(50);
-- Then add check constraint
```

#### Optional: Create coaches table for detailed coach data
```sql
CREATE TABLE coach_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  club_id BIGINT NOT NULL,
  specialization VARCHAR(100),
  certification_level VARCHAR(100),
  years_of_experience INT,
  bio TEXT,
  assigned_teams JSON, -- Array of team IDs
  access_level ENUM('view', 'manage', 'full') DEFAULT 'manage',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_coach_club (user_id, club_id),
  INDEX idx_club_coaches (club_id),
  INDEX idx_coach_user (user_id)
);
```

### 6. Frontend Implementation

#### Component: CreateTeamManagerForm
**Location**: `frontend/src/components/club/CreateTeamManagerForm.tsx`

```typescript
interface CreateTeamManagerFormProps {
  clubId: string;
  onSuccess: (teamManager: TeamManager) => void;
  onCancel: () => void;
}

interface CreateTeamManagerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
  assignedTeams?: string[];
  accessLevel: 'view' | 'manage' | 'full';
  sendLoginEmail: boolean;
}
```

#### Key Features:
- Form validation with real-time feedback
- Email uniqueness check
- Preview of welcome email
- Confirmation before sending credentials
- Success modal showing temporary password (one-time view)
- Copy to clipboard for credentials

### 7. User Flows

#### Flow 1: Create Team Manager
1. Club Manager navigates to Personnel Management
2. Clicks "Add Team Manager" button
3. Fills in personal information form
4. Fills in coach-specific information
5. Selects teams to assign (optional)
6. Chooses access level
7. Reviews and confirms
8. **System generates secure password**
9. **System creates account**
10. **System sends welcome email with credentials**
11. Success message displayed with temporary password
12. Club Manager can copy and share password securely

#### Flow 2: First Login for Team Manager
1. Team Manager receives email with credentials
2. Clicks login link or navigates to login page
3. Enters email and temporary password
4. **System forces password change**
5. Team Manager creates new secure password
6. Completes profile setup (if needed)
7. Redirected to Team Manager dashboard
8. Can start managing assigned teams

#### Flow 3: Password Reset (if forgotten)
1. Team Manager clicks "Forgot Password"
2. Enters email address
3. Receives password reset email
4. Clicks reset link
5. Creates new password
6. Successfully logs in

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Update `user_roles` table to include `club_coach` enum value
- [ ] Create `POST /api/clubs/:clubId/team-managers` endpoint
- [ ] Implement secure password generation utility
- [ ] Add authorization middleware for club manager verification
- [ ] Create team manager creation service
- [ ] Add email template for team manager welcome
- [ ] Implement account creation transaction logic
- [ ] Add rate limiting for account creation
- [ ] Create audit logging for team manager creation
- [ ] Add validation schemas for request body
- [ ] Write unit tests for password generation
- [ ] Write integration tests for team manager creation
- [ ] Write tests for email notification

### Frontend Tasks
- [ ] Create `CreateTeamManagerForm` component
- [ ] Add form validation with Zod or similar
- [ ] Implement email uniqueness check API call
- [ ] Create success modal with password display
- [ ] Add copy-to-clipboard functionality
- [ ] Create team manager list/table component
- [ ] Add edit/deactivate team manager functionality
- [ ] Implement filtering and search for team managers
- [ ] Add team assignment interface
- [ ] Create preview of welcome email (optional)
- [ ] Add loading states and error handling
- [ ] Write component tests

### Database Tasks
- [ ] Create migration to update `user_roles` enum
- [ ] (Optional) Create `coach_profiles` table migration
- [ ] Update seeds for testing
- [ ] Add indexes for performance
- [ ] Test rollback procedures

### Documentation Tasks
- [ ] Update API documentation
- [ ] Create user guide for club managers
- [ ] Document security best practices
- [ ] Add troubleshooting guide
- [ ] Update system architecture diagram

### Testing Tasks
- [ ] Test email delivery in all environments
- [ ] Test password generation randomness
- [ ] Test authorization checks
- [ ] Test duplicate email handling
- [ ] Test concurrent account creation
- [ ] Security audit of implementation
- [ ] Load testing for email service
- [ ] E2E test for complete flow

## 🔧 Technical Details

### File Changes Required

#### New Files:
- `backend/src/onboarding/controllers/TeamManagerController.js`
- `backend/src/onboarding/services/TeamManagerService.js`
- `backend/src/onboarding/routes/teamManagerRoutes.js`
- `backend/src/onboarding/schemas/teamManagerSchema.js`
- `backend/src/db/migrations/[timestamp]_add_club_coach_to_user_roles.js`
- `backend/src/db/migrations/[timestamp]_create_coach_profiles_table.js` (optional)
- `frontend/src/components/club/CreateTeamManagerForm.tsx`
- `frontend/src/components/club/TeamManagerList.tsx`
- `frontend/src/types/teamManager.ts`
- `frontend/src/api/teamManagers.ts`

#### Modified Files:
- `backend/src/services/emailService.js` (add welcome email method)
- `backend/src/onboarding/index.js` (register new routes)
- `frontend/src/pages/club/management/personnel.tsx` (add create button/form)
- `frontend/src/api/clubs.ts` (add team manager endpoints)

### Environment Variables
```bash
# Email Configuration (already exists)
EMAIL_PROVIDER=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=ClubQore
EMAIL_FROM_EMAIL=noreply@clubqore.com

# Security
TEMP_PASSWORD_LENGTH=12
MAX_TEAM_MANAGERS_PER_HOUR=10
```

## 🧪 Testing Scenarios

### Test Case 1: Successful Creation
- **Given**: Valid club manager authenticated
- **When**: Creates team manager with valid data
- **Then**: 
  - Account created successfully
  - Welcome email sent
  - Temporary password generated
  - Audit log created

### Test Case 2: Duplicate Email
- **Given**: Email already exists in system
- **When**: Attempts to create team manager
- **Then**: Error returned with message "Email already exists"

### Test Case 3: Unauthorized Access
- **Given**: User without club manager role
- **When**: Attempts to create team manager
- **Then**: 403 Forbidden error returned

### Test Case 4: Email Delivery Failure
- **Given**: Email service is down
- **When**: Account created successfully
- **Then**: 
  - Account still created
  - Error logged
  - Admin notified
  - Manual email can be resent

### Test Case 5: Rate Limiting
- **Given**: Club manager created 10 accounts in last hour
- **When**: Attempts to create 11th account
- **Then**: Rate limit error returned

## 📊 Success Metrics

- **Adoption Rate**: % of clubs using team manager creation feature
- **Time to First Login**: Average time from creation to first login
- **Email Delivery Success**: % of welcome emails successfully delivered
- **Password Reset Rate**: % of team managers who need password reset
- **Active Team Managers**: Number of team managers actively using platform

## 🔄 Future Enhancements

1. **Bulk Team Manager Creation**
   - Import from CSV/Excel
   - Create multiple team managers at once

2. **Team Manager Invitation System**
   - Send invitation link instead of credentials
   - Team manager sets their own password

3. **Advanced Permissions**
   - Granular role-based access control
   - Team-specific permissions
   - Time-based access (seasonal coaches)

4. **Integration Features**
   - Import from existing club management systems
   - SSO (Single Sign-On) support
   - Active Directory integration

5. **Mobile App Support**
   - Deep linking to mobile app
   - Push notifications for account creation

## 📝 Notes

- This feature builds on the existing multi-role onboarding system
- The `club_coach` role already exists in the roles table but is not yet in the user_roles enum
- Email service infrastructure is already in place
- Account number generation system can be reused
- Consider adding 2FA requirement for team manager accounts in future

## 🔗 Related Issues/PRs

- Related to branch: `cursor/add-team-manager-creation-and-login-notification-3490`
- Depends on: Existing onboarding system
- Blocks: Team manager dashboard implementation
- Related: Club personnel management feature

## 👥 Stakeholders

- **Product Owner**: [Name]
- **Tech Lead**: [Name]
- **Backend Developer**: [Name]
- **Frontend Developer**: [Name]
- **QA Engineer**: [Name]
- **Security Reviewer**: [Name]

## ⏱️ Estimated Effort

- **Backend**: 5-7 days
- **Frontend**: 4-5 days
- **Testing**: 3-4 days
- **Documentation**: 1-2 days
- **Total**: ~15-18 days

---

**Created**: 2025-10-16  
**Last Updated**: 2025-10-16  
**Status**: 📝 Draft  
**Priority**: 🔥 High  
**Labels**: `feature`, `enhancement`, `team-management`, `email-notification`, `security`
