# GitHub Issue - Team Manager Creation Feature

**Copy and paste this content when creating the issue on GitHub**

---

**Title:** Enable Club Managers to Create Team Manager (Coach) Accounts with Login Notifications

**Labels:** `enhancement`

---

## 📋 Overview

Enable club managers to create Team Manager (Coach) accounts directly from the club management interface. When a team manager is created, they will automatically receive an email with their login credentials and welcome information.

## 🎯 User Story

**As a** Club Manager  
**I want to** create Team Manager/Coach accounts for my club  
**So that** coaches can access the platform and manage their teams without going through the full registration process

## 🔍 Current State

### Existing Infrastructure ✅

- ✅ `club_coach` role already exists in the roles table  
- ✅ Email notification system is in place  
- ✅ Multi-role onboarding system exists  
- ✅ JWT-based authentication with password hashing  
- ✅ Database tables (users, user_roles, user_profiles, clubs)

### What Needs to be Done 📝

- Add `club_coach` to `user_roles` table enum (database migration)
- Create Team Manager creation API endpoint
- Implement secure password generation utility
- Add welcome email template for team managers
- Build frontend form and UI components

## 🚀 Feature Requirements

### 1. API Endpoint

**Endpoint:** `POST /api/clubs/:clubId/team-managers`

**Authorization:** Club Manager role required for the specific club

**Request Body:**
```json
{
  "personalData": {
    "firstName": "John",
    "lastName": "Smith", 
    "email": "john.smith@example.com",
    "phone": "+1234567890"
  },
  "coachData": {
    "specialization": "Head Coach",
    "certificationLevel": "UEFA A License",
    "yearsOfExperience": 10,
    "accessLevel": "full",
    "assignedTeams": ["team-123"]
  },
  "sendLoginEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "teamManager": {
    "id": "42",
    "accountNumber": "CQ202500042",
    "email": "john.smith@example.com",
    "fullName": "John Smith",
    "role": "club_coach",
    "clubId": "10",
    "clubName": "Elite Sports Club"
  },
  "temporaryPassword": "aB3$xY9*mN2@",
  "emailSent": true
}
```

### 2. Welcome Email Template

Team managers will receive a professional email containing:
- **Login Credentials**: Email, temporary password, account number
- **Security Instructions**: Must change password on first login
- **Feature Overview**: What they can do as a coach
- **Support Information**: Contact details for help

### 3. Frontend Form

**Location:** `/club/management/personnel`

**Fields:**
- Personal Information (name, email, phone)
- Coach Details (specialization, certification, experience)
- Team Assignment (select teams to manage)
- Access Level (view/manage/full)

**Features:**
- Email uniqueness validation
- Success modal with password display
- Copy-to-clipboard for credentials
- Preview of welcome email

## 🔐 Security Features

- ✅ Cryptographically secure password generation (12+ characters)
- ✅ Passwords NEVER stored in plaintext (bcrypt hashing)
- ✅ Forced password change on first login
- ✅ Rate limiting: max 10 accounts per hour per club manager
- ✅ Authorization checks: only club managers for their clubs
- ✅ Full audit logging for account creation events
- ✅ Email verification step

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Create database migration to add `club_coach` to `user_roles` enum
- [ ] Create `POST /api/clubs/:clubId/team-managers` endpoint
- [ ] Implement secure password generation utility
- [ ] Add authorization middleware for club manager verification
- [ ] Create TeamManagerService for account creation logic
- [ ] Add email template: `sendTeamManagerWelcome()`
- [ ] Implement transaction-safe account creation
- [ ] Add rate limiting middleware
- [ ] Create audit logging
- [ ] Add validation schemas (Joi/Zod)
- [ ] Write unit tests for password generation
- [ ] Write integration tests for endpoint
- [ ] Write tests for email notification

### Frontend Tasks
- [ ] Create `CreateTeamManagerForm.tsx` component
- [ ] Add form validation with real-time feedback
- [ ] Implement email uniqueness check API call
- [ ] Create success modal with password display
- [ ] Add copy-to-clipboard functionality
- [ ] Add "Create Team Manager" button to personnel page
- [ ] Create team assignment interface
- [ ] Add loading states and error handling
- [ ] Write component tests
- [ ] Write E2E tests

### Database Tasks
- [ ] Migration: Update `user_roles` enum to include 'club_coach'
- [ ] (Optional) Create `coach_profiles` table for detailed coach data
- [ ] Update seeds for testing
- [ ] Add indexes for performance

## 🧪 Testing Scenarios

1. **Successful Creation**: Valid club manager creates team manager ✅
2. **Duplicate Email**: Error when email already exists 🚫
3. **Unauthorized Access**: Non-club-manager gets 403 error 🚫
4. **Email Delivery Failure**: Account created but email logged as failed 📧
5. **Rate Limiting**: 11th account creation in hour blocked ⏱️
6. **First Login Flow**: Team manager forced to change password 🔑

## 📊 Success Metrics

- Adoption Rate: % of clubs using the feature
- Time to First Login: Average time from creation to first login
- Email Delivery Success: % of emails successfully delivered
- Password Reset Rate: % of team managers needing password reset
- Active Team Managers: Number actively using the platform

## 🔄 User Flows

### Flow 1: Create Team Manager
1. Club Manager → Personnel Management
2. Click "Add Team Manager"
3. Fill personal & coach information
4. Select teams & access level
5. Review and confirm
6. **System generates secure password**
7. **System creates account**
8. **System sends welcome email**
9. Success modal shows temporary password
10. Club Manager shares password securely

### Flow 2: First Login
1. Team Manager receives email
2. Clicks login link
3. Enters temporary credentials
4. **Forced to change password**
5. Creates new secure password
6. Completes profile (if needed)
7. Redirected to dashboard

## ⏱️ Estimated Effort

- **Backend**: 5-7 days
- **Frontend**: 4-5 days
- **Testing**: 3-4 days
- **Documentation**: 1-2 days
- **Total**: ~15-18 days (3 weeks)

## 📝 Technical Notes

### Files to Create:
- `backend/src/onboarding/controllers/TeamManagerController.js`
- `backend/src/onboarding/services/TeamManagerService.js`
- `backend/src/onboarding/routes/teamManagerRoutes.js`
- `backend/src/db/migrations/[timestamp]_add_club_coach_to_user_roles.js`
- `frontend/src/components/club/CreateTeamManagerForm.tsx`
- `frontend/src/api/teamManagers.ts`

### Files to Modify:
- `backend/src/services/emailService.js` (add welcome email)
- `frontend/src/pages/club/management/personnel.tsx`

### Database Schema Update:
```sql
-- Update user_roles enum
ALTER TABLE user_roles 
MODIFY COLUMN role ENUM('club_manager', 'club_coach', 'member', 'parent') NOT NULL;
```

## 🔗 Related

- Branch: `cursor/add-team-manager-creation-and-login-notification-3490`
- Related to: Club personnel management feature
- Depends on: Existing onboarding system

## 📚 Full Documentation

Complete technical specification available in: `ISSUE-3490-team-manager-creation.md`

---

**Priority:** High 🔥  
**Category:** Feature - Team Management  
**Security:** Includes password generation, encryption, and rate limiting
