# Backend Implementation Requirements: Onboarding System

## Overview

This document outlines the backend API endpoints and services required to support the ClubQore frontend onboarding process. The onboarding system allows users to complete their profile setup after initial registration. Users can have multiple roles in the system (e.g., a parent who is also a club member), and each user gets a unique account number for easy identification and management.

## Database Schema Requirements

### User Table Updates

The existing `users` table should include the following fields:

```sql
-- User table structure for multi-role onboarding support
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  primary_role ENUM('admin', 'club_manager', 'member', 'parent') DEFAULT 'member',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP NULL,
  is_onboarded BOOLEAN DEFAULT FALSE, -- Onboarding completion status
  onboarding_completed_at TIMESTAMP NULL, -- When onboarding was completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_users_email (email),
  INDEX idx_users_primary_role (primary_role),
  INDEX idx_users_onboarded (is_onboarded)
);
```

### Clubs Table

Central table for all club information:

```sql
CREATE TABLE clubs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  club_type ENUM('youth-academy', 'amateur-club', 'semi-professional', 'professional', 'training-center') NOT NULL,
  description TEXT,
  founded_year YEAR,
  membership_capacity INT,
  website VARCHAR(255),

  -- Contact Information
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),

  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE, -- For verification process
  logo_url TEXT, -- Club logo/avatar

  -- Management
  created_by BIGINT NOT NULL, -- User who created the club (club manager)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_clubs_name (name),
  INDEX idx_clubs_type (club_type),
  INDEX idx_clubs_active (is_active),
  INDEX idx_clubs_created_by (created_by)
);
```

### User Profiles Table

Centralized storage for all personal information (single source of truth):

```sql
CREATE TABLE user_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,

  -- Basic Personal Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
  date_of_birth DATE,
  avatar TEXT, -- Profile image URL/base64

  -- Contact Information
  phone VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(255),

  -- Professional Information
  workplace VARCHAR(255),
  work_phone VARCHAR(20),

  -- Medical Information
  medical_info TEXT,

  -- Profile completion tracking
  profile_completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_profile (user_id),
  INDEX idx_profiles_user_id (user_id),
  INDEX idx_profiles_full_name (full_name),
  INDEX idx_profiles_completed (profile_completed_at)
);
```

### User Roles Table

Track all roles a user can have with associated data:

```sql
CREATE TABLE user_roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role ENUM('admin', 'club_manager', 'member', 'parent') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  -- Role-specific associations
  club_id BIGINT NULL, -- For club_manager and member roles
  parent_user_id BIGINT NULL, -- For child accounts linking to parent

  -- Role metadata
  role_data JSON DEFAULT '{}', -- Store role-specific configuration
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT NULL, -- Who assigned this role

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Unique constraint to prevent duplicate role assignments
  UNIQUE KEY unique_user_role_club (user_id, role, club_id),

  INDEX idx_user_roles_user_id (user_id),
  INDEX idx_user_roles_role (role),
  INDEX idx_user_roles_club_id (club_id),
  INDEX idx_user_roles_active (is_active)
);
```

### Account Number Generation Table

Track account number sequences:

```sql
CREATE TABLE account_sequences (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  year YEAR NOT NULL,
  sequence_number INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_year (year)
);
```

### User Preferences Table

Store user-wide notification and preference settings:

```sql
CREATE TABLE user_preferences (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,

  -- Notification preferences
  schedule_changes BOOLEAN DEFAULT TRUE,
  payment_reminders BOOLEAN DEFAULT TRUE,
  emergency_alerts BOOLEAN DEFAULT TRUE,
  general_updates BOOLEAN DEFAULT FALSE,

  -- Communication preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,

  -- Privacy settings
  profile_visibility ENUM('public', 'members_only', 'private') DEFAULT 'members_only',
  show_contact_info BOOLEAN DEFAULT FALSE,

  -- UI preferences
  theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
  language VARCHAR(5) DEFAULT 'en',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preferences (user_id),
  INDEX idx_preferences_user_id (user_id)
);
```

### User Accounts Table

Store role-specific account information and onboarding data:

```sql
CREATE TABLE user_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  account_number VARCHAR(20) NOT NULL, -- Account number for this specific role/club combination
  role ENUM('club_manager', 'member', 'parent') NOT NULL, -- Which role this account is for

  -- Club association (used by all role types - club_manager for owned club, member for joined club, parent for children's clubs)
  club_id BIGINT NULL, -- Reference to clubs table (for all roles that involve clubs)

  -- Member-specific data (for member role)
  position ENUM('goalkeeper', 'defender', 'midfielder', 'forward', 'any'),
  experience ENUM('beginner', 'intermediate', 'advanced', 'professional'),
  club_invite_code VARCHAR(50), -- The code used to join (historical record)
  parent_name VARCHAR(255), -- Reference to parent (not stored in profile)
  parent_phone VARCHAR(20), -- Reference to parent contact

  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  onboarding_completed_at TIMESTAMP NULL, -- When this role's onboarding was completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,

  -- Unique constraint to prevent duplicate accounts for same role per club
  UNIQUE KEY unique_user_role_club_account (user_id, role, club_id),
  -- Unique account number constraint
  UNIQUE KEY unique_account_number (account_number),

  INDEX idx_accounts_user_id (user_id),
  INDEX idx_accounts_role (role),
  INDEX idx_accounts_club_id (club_id),
  INDEX idx_accounts_account_number (account_number),
  INDEX idx_accounts_club_invite (club_invite_code),
  INDEX idx_accounts_completed (onboarding_completed_at),
  INDEX idx_accounts_active (is_active)
);
```

### Children Information Table

For parent accounts to track their children and relationships:

```sql
CREATE TABLE user_children (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_user_id BIGINT NOT NULL,
  child_user_id BIGINT NULL, -- Links to actual user account if child has one

  -- Relationship information (moved from user_onboarding_data)
  relationship ENUM('parent', 'guardian', 'grandparent', 'relative', 'other') DEFAULT 'parent',

  -- Only store data if child doesn't have user account
  -- If child_user_id is NOT NULL, get details from user_profiles via reference
  first_name VARCHAR(100), -- Only used if child_user_id IS NULL
  last_name VARCHAR(100), -- Only used if child_user_id IS NULL
  date_of_birth DATE, -- Only used if child_user_id IS NULL

  -- Club association for children
  club_id BIGINT NULL, -- Which club the child is associated with
  membership_code VARCHAR(50), -- Child's membership code in the club

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (child_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
  INDEX idx_children_parent (parent_user_id),
  INDEX idx_children_child (child_user_id),
  INDEX idx_children_club (club_id),
  INDEX idx_children_membership (membership_code),

  -- Ensure we have either child_user_id OR manual child data
  CONSTRAINT check_child_data CHECK (
    (child_user_id IS NOT NULL) OR
    (first_name IS NOT NULL AND last_name IS NOT NULL AND date_of_birth IS NOT NULL)
  )
);
```

### Club Invite Codes Table

Manage club invitation system:

```sql
CREATE TABLE club_invite_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  club_id BIGINT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  usage_limit INT DEFAULT NULL, -- NULL for unlimited
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT NOT NULL, -- User who created the code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invite_code (code),
  INDEX idx_invite_club (club_id),
  INDEX idx_invite_active (is_active, expires_at)
);
```

## API Endpoints Implementation

### 1. Add Role to User (Onboarding)

**Endpoint:** `POST /api/users/roles/add`

**Purpose:** Add a new role to an existing user during onboarding process

**Request Body:**

```typescript
interface AddRoleRequest {
  role: "club_manager" | "member" | "parent";
  profileImage?: string; // Base64 encoded image or file upload

  // Personal Information (stored in user_profiles table)
  personalData: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string; // ISO date format
    phone?: string;
    address?: string;
    emergencyContact?: string;
    workplace?: string;
    workPhone?: string;
    medicalInfo?: string;
  };

  // Club-specific data (required if role === 'club_manager')
  clubData?: {
    clubName: string;
    clubType:
      | "youth-academy"
      | "amateur-club"
      | "semi-professional"
      | "professional"
      | "training-center";
    clubDescription?: string;
    foundedYear?: number;
    membershipCapacity?: number;
    website?: string;
  };

  // Member-specific data (required if role === 'member')
  memberData?: {
    clubInviteCode?: string;
    position?: "goalkeeper" | "defender" | "midfielder" | "forward" | "any";
    experience?: "beginner" | "intermediate" | "advanced" | "professional";
    parentName?: string;
    parentPhone?: string;
  };

  // Parent-specific data (required if role === 'parent')
  parentData?: {
    children: Array<{
      // If child has user account, only provide childUserId
      childUserId?: string; // Link to existing user account
      relationship:
        | "parent"
        | "guardian"
        | "grandparent"
        | "relative"
        | "other";

      // Manual child data (only if childUserId not provided)
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string; // ISO date format

      // Club association
      clubId?: string; // Club the child is associated with
      membershipCode?: string;
    }>;
  };

  // User preferences (applies to all roles)
  preferences?: {
    scheduleChanges?: boolean;
    paymentReminders?: boolean;
    emergencyAlerts?: boolean;
    generalUpdates?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    profileVisibility?: "public" | "members_only" | "private";
    showContactInfo?: boolean;
    theme?: "light" | "dark" | "auto";
    language?: string;
  };
}
```

**Response:**

```typescript
interface AddRoleResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[]; // All user's roles
    primaryRole: string;
    avatar?: string;
    isOnboarded: boolean; // True if user has completed at least one role
    emailVerified: boolean;
    accounts: Array<{
      accountNumber: string;
      role: string;
      clubId?: string;
      clubName?: string;
      isActive: boolean;
      children?: string[];
    }>;
    created_at: string;
    updated_at: string;
  };
}
```

**Implementation Logic:**

1. Validate request data based on role being added
2. Check if user already has this role for this club (prevent duplicates)
3. If `clubInviteCode` provided for member role, validate and link to club
4. Store/update personal data in `user_profiles` table (single source of truth)
5. Store/update user preferences in `user_preferences` table (single source of truth)
6. Store profile image (if provided) in `user_profiles` table and return URL
7. For club_manager role: Create new club record in `clubs` table
8. Generate unique account number for this role/club combination
9. Create role record in `user_roles` table with club association
10. Create account record in `user_accounts` table (with account_number and club_id reference)
11. For parents, create child records in `user_children` table
12. Update user record: Set `is_onboarded = true`
13. Return updated user object with all roles and account information

### 2. Complete Initial Onboarding

**Endpoint:** `POST /api/onboarding/complete`

**Purpose:** Complete the initial onboarding for a new user (first role setup)

**Request Body:** Same as `AddRoleRequest` above

**Response:** Same as `AddRoleResponse` above

**Implementation Logic:** Same as above, but specifically for first-time user setup

### 3. Get User Roles and Status

**Endpoint:** `GET /api/users/roles`

**Purpose:** Get all roles for the current user and their completion status

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface UserRolesResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    primaryRole: string;
    isOnboarded: boolean;
  };
  accounts: Array<{
    accountNumber: string;
    role: "club_manager" | "member" | "parent";
    isActive: boolean;
    onboardingCompleted: boolean;
    completedAt?: string;
    clubId?: string;
    clubName?: string;
    metadata?: any;
  }>;
  availableRoles: Array<"club_manager" | "member" | "parent">; // Roles user can still add
}
```

### 4. Club Invite Code Validation

**Endpoint:** `GET /api/clubs/invite-codes/{code}/validate`

**Purpose:** Validate club invite code during member onboarding

**Response:**

```typescript
interface InviteCodeValidationResponse {
  valid: boolean;
  club?: {
    id: string;
    name: string;
    type: string;
  };
  message: string;
}
```

**Implementation Logic:**

1. Check if code exists and is active
2. Verify code hasn't expired
3. Check usage limits
4. Return club information if valid

### 4. Club Invite Code Usage

**Endpoint:** `POST /api/clubs/invite-codes/{code}/use`

**Purpose:** Use invite code and link member to club

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface UseInviteCodeResponse {
  success: boolean;
  message: string;
  club: {
    id: string;
    name: string;
    type: string;
  };
}
```

**Implementation Logic:**

1. Validate code (same as validation endpoint)
2. Increment `used_count`
3. Update user's `club_id`
4. Create club membership record
5. Send notification to club managers

### 5. User Profile Management

**Endpoint:** `GET /api/users/profile`

**Purpose:** Get user's complete profile information

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface UserProfileResponse {
  profile: {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth?: string;
    avatar?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    workplace?: string;
    workPhone?: string;
    medicalInfo?: string;
    profileCompleted: boolean;
    completedAt?: string;
  };
}
```

**Endpoint:** `PUT /api/users/profile`

**Purpose:** Update user's profile information

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```typescript
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  workplace?: string;
  workPhone?: string;
  medicalInfo?: string;
}
```

**Response:** Same as `UserProfileResponse` above

### 6. Profile Image Upload

**Endpoint:** `POST /api/users/avatar`

**Purpose:** Upload and store user profile image (updates user_profiles table)

**Content-Type:** `multipart/form-data`

**Request:** File upload with image file

**Response:**

```typescript
interface AvatarUploadResponse {
  success: boolean;
  avatar_url: string;
  message: string;
}
```

````

**Implementation Requirements:**
- Support common image formats (JPEG, PNG, WebP)
- Resize images to standard sizes (e.g., 200x200, 400x400)
- Store in cloud storage (AWS S3, Cloudinary, etc.)
- Return public URL
- Validate file size limits

### 8. User Preferences Management

**Endpoint:** `GET /api/users/preferences`

**Purpose:** Get user's preference settings

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```typescript
interface UserPreferencesResponse {
  preferences: {
    scheduleChanges: boolean;
    paymentReminders: boolean;
    emergencyAlerts: boolean;
    generalUpdates: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    profileVisibility: 'public' | 'members_only' | 'private';
    showContactInfo: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}
````

**Endpoint:** `PUT /api/users/preferences`

**Purpose:** Update user's preference settings

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```typescript
interface UpdatePreferencesRequest {
  scheduleChanges?: boolean;
  paymentReminders?: boolean;
  emergencyAlerts?: boolean;
  generalUpdates?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  profileVisibility?: "public" | "members_only" | "private";
  showContactInfo?: boolean;
  theme?: "light" | "dark" | "auto";
  language?: string;
}
```

**Response:** Same as `UserPreferencesResponse` above

### 10. Children Management Endpoints

**Endpoint:** `GET /api/users/children`

**Purpose:** Get all children for a parent user (combines user_children + user_profiles data)

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface UserChildrenResponse {
  children: Array<{
    id: string;
    relationship: "parent" | "guardian" | "grandparent" | "relative" | "other";
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    avatar?: string;
    hasUserAccount: boolean; // True if child has user account
    childUserId?: string; // Present if hasUserAccount is true
    clubId?: string;
    clubName?: string;
    membershipCode?: string;
  }>;
}
```

**Endpoint:** `POST /api/users/children`

**Purpose:** Add a new child for a parent user

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```typescript
interface AddChildRequest {
  childUserId?: string; // Link to existing user account
  relationship: "parent" | "guardian" | "grandparent" | "relative" | "other";

  // Manual child data (only if childUserId not provided)
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date format

  // Club association
  clubId?: string;
  membershipCode?: string;
}
```

**Response:** Same as `UserChildrenResponse` above (returns updated children list)

### 11. Club Management Endpoints

**Endpoint:** `GET /api/clubs/{clubId}`

**Purpose:** Get club details

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface ClubResponse {
  club: {
    id: string;
    name: string;
    clubType: string;
    description?: string;
    foundedYear?: number;
    membershipCapacity?: number;
    website?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    verified: boolean;
    logoUrl?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Endpoint:** `PUT /api/clubs/{clubId}`

**Purpose:** Update club information (club managers only)

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```typescript
interface UpdateClubRequest {
  name?: string;
  clubType?: string;
  description?: string;
  foundedYear?: number;
  membershipCapacity?: number;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
}
```

**Response:** Same as `ClubResponse` above

**Endpoint:** `GET /api/clubs/my-clubs`

**Purpose:** Get all clubs where user has a role

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface MyClubsResponse {
  clubs: Array<{
    id: string;
    name: string;
    clubType: string;
    role: "club_manager" | "member";
    isActive: boolean;
    joinedAt: string;
  }>;
}
```

### 12. Club Search and Discovery Endpoints

**Endpoint:** `GET /api/clubs/search`

**Purpose:** Search and discover clubs for users to join

**Query Parameters:**

- `query` (optional): Search term for club name or description
- `club_type` (optional): Filter by club type
- `location` (optional): Filter by location/address
- `verified` (optional): Filter by verification status
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**

```typescript
interface ClubSearchResponse {
  clubs: Array<{
    id: string;
    name: string;
    clubType: string;
    description?: string;
    address?: string;
    verified: boolean;
    memberCount: number;
    logoUrl?: string;
    distance?: number; // If location-based search
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Implementation Logic:**

1. Build search query based on parameters
2. Use full-text search on name and description
3. Apply filters for club_type, location, verification status
4. Calculate distance if location provided
5. Return paginated results with club summaries

**Endpoint:** `GET /api/clubs/browse`

**Purpose:** Browse clubs by category with recommended clubs

**Query Parameters:**

- `category` (optional): Browse by club type
- `featured` (optional): Show only featured/verified clubs
- `limit` (optional): Number of clubs to return (default: 20)

**Response:**

```typescript
interface ClubBrowseResponse {
  featured: Array<ClubSummary>;
  byCategory: {
    [key: string]: Array<ClubSummary>;
  };
  recommended?: Array<ClubSummary>; // Based on user profile/location
}
```

### 13. Real-time Invite Code Validation Endpoints

**Endpoint:** `GET /api/clubs/invite-codes/{code}/validate`

**Purpose:** Real-time validation of invite codes with detailed feedback

**Response:**

```typescript
interface InviteCodeValidationResponse {
  valid: boolean;
  club?: {
    id: string;
    name: string;
    clubType: string;
    description?: string;
    logoUrl?: string;
    memberCount: number;
  };
  code?: {
    expiresAt: string;
    usageLimit?: number;
    usedCount: number;
    remainingUses?: number;
  };
  message: string;
  errorCode?:
    | "CODE_NOT_FOUND"
    | "CODE_EXPIRED"
    | "USAGE_LIMIT_REACHED"
    | "CODE_INACTIVE";
}
```

**Implementation Logic:**

1. Check if code exists in `club_invite_codes` table
2. Validate code is active (`is_active = true`)
3. Check expiration date (`expires_at > NOW()`)
4. Verify usage limits if set (`used_count < usage_limit`)
5. Return detailed club information if valid
6. Provide specific error codes for different failure reasons

**Endpoint:** `POST /api/clubs/invite-codes/{code}/preview`

**Purpose:** Preview club information before joining (without using the code)

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface InviteCodePreviewResponse {
  valid: boolean;
  club?: {
    id: string;
    name: string;
    clubType: string;
    description?: string;
    logoUrl?: string;
    foundedYear?: number;
    memberCount: number;
    address?: string;
    website?: string;
  };
  userCanJoin: boolean;
  alreadyMember: boolean;
  message: string;
}
```

### 14. Account Number Management Endpoints

**Endpoint:** `POST /api/accounts/generate`

**Purpose:** Generate new account number for role/club combination (internal use)

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```typescript
interface GenerateAccountNumberRequest {
  userId: string;
  role: "club_manager" | "member" | "parent";
  clubId?: string;
}
```

**Response:**

```typescript
interface GenerateAccountNumberResponse {
  success: boolean;
  accountNumber: string; // Format: CQ2025-12345
  message: string;
}
```

**Implementation Logic:**

1. Get current year
2. Fetch or create account sequence for the year
3. Atomically increment sequence number
4. Format account number: `CQ{YEAR}{5-digit-sequence}`
5. Ensure uniqueness across all accounts
6. Log generation for audit purposes

**Endpoint:** `GET /api/accounts/{accountNumber}`

**Purpose:** Get account details by account number

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface AccountDetailsResponse {
  account: {
    accountNumber: string;
    userId: string;
    role: string;
    clubId?: string;
    clubName?: string;
    isActive: boolean;
    createdAt: string;
    onboardingCompletedAt?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}
```

**Endpoint:** `GET /api/accounts/search`

**Purpose:** Search accounts by account number (admin/support use)

**Headers:** `Authorization: Bearer <jwt_token>`

**Query Parameters:**

- `query`: Account number or partial account number
- `role` (optional): Filter by role type

**Response:**

```typescript
interface AccountSearchResponse {
  accounts: Array<{
    accountNumber: string;
    userFullName: string;
    role: string;
    clubName?: string;
    isActive: boolean;
    createdAt: string;
  }>;
}
```

### 15. Profile Completion Tracking Endpoints

**Endpoint:** `GET /api/users/profile/completion`

**Purpose:** Get detailed profile completion status and progress

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface ProfileCompletionResponse {
  overallProgress: number; // 0-100 percentage
  profileCompletion: {
    completed: boolean;
    progress: number;
    missingFields: Array<{
      field: string;
      required: boolean;
      description: string;
    }>;
  };
  roleCompletion: Array<{
    role: string;
    completed: boolean;
    progress: number;
    missingSteps: Array<{
      step: string;
      required: boolean;
      description: string;
    }>;
  }>;
  preferencesSet: boolean;
  nextSteps: Array<{
    action: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
}
```

**Implementation Logic:**

1. Check basic profile fields completion in `user_profiles`
2. Validate role-specific setup in `user_accounts`
3. Verify preferences are set in `user_preferences`
4. Calculate completion percentages
5. Identify missing required and optional fields
6. Suggest next steps for improvement

**Endpoint:** `POST /api/users/profile/completion/update`

**Purpose:** Update completion tracking when user completes steps

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```typescript
interface UpdateCompletionRequest {
  step: string; // The completed step
  role?: string; // Role if step is role-specific
  additionalData?: any; // Any additional tracking data
}
```

**Response:**

```typescript
interface UpdateCompletionResponse {
  success: boolean;
  newProgress: number;
  completedStep: string;
  nextSuggestion?: string;
}
```

**Endpoint:** `GET /api/users/onboarding/status`

**Purpose:** Get comprehensive onboarding status across all aspects

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**

```typescript
interface OnboardingStatusResponse {
  isOnboarded: boolean;
  currentStep: string;
  completedSteps: Array<string>;
  availableRoles: Array<string>;
  completionProgress: {
    profile: number;
    roles: number;
    preferences: number;
    overall: number;
  };
  recommendedActions: Array<{
    action: string;
    description: string;
    category: "profile" | "role" | "preferences" | "verification";
    priority: number;
  }>;
  accountNumbers: Array<{
    accountNumber: string;
    role: string;
    clubName?: string;
  }>;
}
```

## Service Layer Implementation

### AccountNumberService Class

```typescript
class AccountNumberService {
  // Generate unique account number for new users
  async generateAccountNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Get or create sequence for current year
    const sequence = await this.getOrCreateYearSequence(currentYear);

    // Increment sequence number
    const nextNumber = sequence.sequence_number + 1;
    await this.updateSequenceNumber(currentYear, nextNumber);

    // Format: CQ + YEAR + 5-digit sequence (e.g., CQ202500001)
    const accountNumber = `CQ${currentYear}${nextNumber
      .toString()
      .padStart(5, "0")}`;

    return accountNumber;
  }

  // Get or create sequence record for year
  private async getOrCreateYearSequence(
    year: number
  ): Promise<AccountSequence> {
    // Implementation details...
  }

  // Update sequence number atomically
  private async updateSequenceNumber(
    year: number,
    newSequence: number
  ): Promise<void> {
    // Implementation details...
  }

  // Validate account number format
  static validateAccountNumber(accountNumber: string): boolean {
    const regex = /^CQ\d{4}\d{5}$/;
    return regex.test(accountNumber);
  }
}
```

### UserPreferencesService Class

```typescript
class UserPreferencesService {
  // Get user's preferences
  async getUserPreferences(userId: number): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findByUserId(userId);

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await this.preferencesRepository.create({
        user_id: userId,
        // Default values as defined in schema
      });
    }

    return preferences;
  }

  // Update user preferences (upsert)
  async updateUserPreferences(
    userId: number,
    preferencesData: any
  ): Promise<UserPreferences> {
    const existing = await this.preferencesRepository.findByUserId(userId);

    if (existing) {
      return this.preferencesRepository.update(existing.id, preferencesData);
    } else {
      return this.preferencesRepository.create({
        user_id: userId,
        ...preferencesData,
      });
    }
  }

  // Get notification preferences for specific types
  async getNotificationSettings(userId: number): Promise<NotificationSettings> {
    const preferences = await this.getUserPreferences(userId);

    return {
      scheduleChanges: preferences.schedule_changes,
      paymentReminders: preferences.payment_reminders,
      emergencyAlerts: preferences.emergency_alerts,
      generalUpdates: preferences.general_updates,
      emailEnabled: preferences.email_notifications,
      smsEnabled: preferences.sms_notifications,
      pushEnabled: preferences.push_notifications,
    };
  }
}
```

```typescript
class UserProfileService {
  // Get user's complete profile
  async getUserProfile(userId: number): Promise<UserProfile> {
    // Get profile data from user_profiles table
    // Implementation details...
  }

  // Create or update user profile (single source of truth)
  async upsertUserProfile(
    userId: number,
    profileData: any
  ): Promise<UserProfile> {
    // Insert or update profile data in user_profiles table
    // Implementation details...
  }

  // Update profile image
  async updateAvatar(userId: number, avatarUrl: string): Promise<void> {
    // Update avatar in user_profiles table
    // Implementation details...
  }

  // Check if profile is complete
  async isProfileComplete(userId: number): Promise<boolean> {
    // Check required fields based on business rules
    // Implementation details...
  }
}
```

### ClubService Class

```typescript
class ClubService {
  // Create new club (during club manager onboarding)
  async createClub(clubData: any, createdBy: number): Promise<Club> {
    const club = await this.clubRepository.create({
      ...clubData,
      created_by: createdBy,
      is_active: true,
      verified: false, // Requires admin verification
    });

    return club;
  }

  // Get club details
  async getClubById(clubId: number): Promise<Club> {
    return this.clubRepository.findById(clubId);
  }

  // Update club information
  async updateClub(clubId: number, updateData: any): Promise<Club> {
    return this.clubRepository.update(clubId, updateData);
  }

  // Get clubs by manager
  async getClubsByManager(managerId: number): Promise<Club[]> {
    return this.clubRepository.findByCreatedBy(managerId);
  }

  // Validate club invite code
  async validateInviteCode(code: string): Promise<ClubInviteCode | null> {
    return this.inviteCodeRepository.findActiveByCode(code);
  }
}
```

### UserRoleService Class

```typescript
class UserRoleService {
  // Add new role to user
  async addRole(userId: number, roleData: AddRoleRequest): Promise<User> {
    // 1. Validate role data
    // 2. Check for duplicate roles for the same club

    // 3. Update/create user profile data (single source of truth)
    await this.userProfileService.upsertUserProfile(
      userId,
      roleData.personalData
    );

    // 4. Update/create user preferences (single source of truth)
    if (roleData.preferences) {
      await this.userPreferencesService.updateUserPreferences(
        userId,
        roleData.preferences
      );
    }

    let clubId = null;

    // 5. Handle role-specific logic
    if (roleData.role === "club_manager" && roleData.clubData) {
      // Create new club first, then reference it
      const club = await this.clubService.createClub(roleData.clubData, userId);
      clubId = club.id;
    } else if (
      roleData.role === "member" &&
      roleData.memberData?.clubInviteCode
    ) {
      // Join existing club using invite code
      const inviteCode = await this.clubService.validateInviteCode(
        roleData.memberData.clubInviteCode
      );
      if (inviteCode) {
        clubId = inviteCode.club_id;
        // Use the invite code (increment usage)
        await this.clubService.useInviteCode(inviteCode.id, userId);
      }
    }

    // 6. Generate unique account number for this role/club combination
    const accountNumber =
      await this.accountNumberService.generateAccountNumber();

    // 7. Create role record with club association
    await this.userRoleRepository.create({
      user_id: userId,
      role: roleData.role,
      club_id: clubId,
      is_active: true,
    });

    // 8. Create account record with role-specific data and account number
    await this.userAccountRepository.create({
      user_id: userId,
      account_number: accountNumber,
      role: roleData.role,
      club_id: clubId, // Reference to club, not duplicate data
      ...this.extractRoleSpecificData(roleData),
      is_active: true,
      onboarding_completed_at: new Date(),
    });

    // 9. For parents, create child records
    if (roleData.role === "parent" && roleData.parentData?.children) {
      await this.userService.createUserChildren(
        userId,
        roleData.parentData.children
      );
    }

    // 10. Update user record
    await this.userRepository.update(userId, {
      is_onboarded: true,
      onboarding_completed_at: new Date(),
    });

    return this.userService.getUserWithProfile(userId);
  }

  // Get all user accounts and status
  async getUserRoles(userId: number): Promise<UserRolesResponse> {
    const user = await this.userService.getUserWithProfile(userId);
    const accounts = await this.userAccountRepository.findByUserId(userId);

    const accountsWithDetails = await Promise.all(
      accounts.map(async (account) => {
        let clubName = undefined;
        if (account.club_id) {
          const club = await this.clubService.getClubById(account.club_id);
          clubName = club.name;
        }

        return {
          accountNumber: account.account_number,
          role: account.role,
          isActive: account.is_active,
          onboardingCompleted: !!account.onboarding_completed_at,
          completedAt: account.onboarding_completed_at,
          clubId: account.club_id?.toString(),
          clubName,
          metadata: {}, // Can store additional account-specific metadata
        };
      })
    );

    // Determine available roles (roles user doesn't have yet)
    const existingRoles = accounts.map((a) => a.role);
    const allRoles: ("club_manager" | "member" | "parent")[] = [
      "club_manager",
      "member",
      "parent",
    ];
    const availableRoles = allRoles.filter((role) => {
      if (role === "member") return true; // Users can be members of multiple clubs
      return !existingRoles.includes(role);
    });

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.profile.avatar,
        primaryRole: user.primary_role,
        isOnboarded: user.is_onboarded,
      },
      accounts: accountsWithDetails,
      availableRoles,
    };
  }

  // Extract role-specific data for onboarding table (no club data duplication)
  private extractRoleSpecificData(roleData: AddRoleRequest): any {
    switch (roleData.role) {
      case "club_manager":
        // No club data stored here - it's in the clubs table
        return {};
      case "member":
        return {
          position: roleData.memberData?.position,
          experience: roleData.memberData?.experience,
          club_invite_code: roleData.memberData?.clubInviteCode, // Historical record
          parent_name: roleData.memberData?.parentName,
          parent_phone: roleData.memberData?.parentPhone,
        };
      case "parent":
        // No relationship data here - it's stored in user_children table
        return {};
      default:
        return {};
    }
  }

  // Deactivate/remove role
  async deactivateRole(
    userId: number,
    role: string,
    clubId?: number
  ): Promise<void> {
    await this.userRoleRepository.deactivate(userId, role, clubId);
  }

  // Switch primary role
  async setPrimaryRole(userId: number, role: string): Promise<User> {
    // Validate user has this role
    const userRole = await this.userRoleRepository.findByUserIdAndRole(
      userId,
      role
    );
    if (!userRole || !userRole.is_active) {
      throw new Error("User does not have this active role");
    }

    await this.userRepository.update(userId, { primary_role: role });
    return this.userService.getUserWithProfile(userId);
  }
}
```

### OnboardingService Class

```typescript
class OnboardingService {
  // Complete initial onboarding (first role)
  async completeInitialOnboarding(
    userId: number,
    data: AddRoleRequest
  ): Promise<User> {
    // Same as adding role, but for first-time users
    return this.userRoleService.addRole(userId, data);
  }

  // Get user's onboarding status across all roles
  async getOnboardingStatus(userId: number): Promise<UserRolesResponse> {
    return this.userRoleService.getUserRoles(userId);
  }

  // Validate club invite code
  async validateInviteCode(
    code: string
  ): Promise<InviteCodeValidationResponse> {
    // Implementation details...
  }

  // Use club invite code
  async useInviteCode(
    userId: number,
    code: string
  ): Promise<UseInviteCodeResponse> {
    // Implementation details...
  }

  // Process profile image upload
  async uploadAvatar(userId: number, imageFile: File): Promise<string> {
    // Implementation details...
  }
}
```

### ClubSearchService Class

```typescript
class ClubSearchService {
  // Search clubs with filters and pagination
  async searchClubs(searchParams: ClubSearchParams): Promise<ClubSearchResult> {
    const query = this.buildSearchQuery(searchParams);

    // Apply full-text search on name and description
    if (searchParams.query) {
      query.where(
        "MATCH(name, description) AGAINST (? IN NATURAL LANGUAGE MODE)",
        [searchParams.query]
      );
    }

    // Apply filters
    if (searchParams.club_type) {
      query.where("club_type", searchParams.club_type);
    }

    if (searchParams.verified !== undefined) {
      query.where("verified", searchParams.verified);
    }

    // Location-based search if provided
    if (searchParams.location) {
      query
        .select("*", this.calculateDistanceSelect(searchParams.location))
        .orderBy("distance");
    }

    // Pagination
    const page = searchParams.page || 1;
    const limit = Math.min(searchParams.limit || 20, 100);
    const offset = (page - 1) * limit;

    const results = await query.offset(offset).limit(limit).get();
    const total = await this.getSearchCount(searchParams);

    return {
      clubs: results.map((club) => this.formatClubSummary(club)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get featured and categorized clubs for browsing
  async browseClubs(browseParams: ClubBrowseParams): Promise<ClubBrowseResult> {
    const featured = await this.getFeaturedClubs(browseParams.limit);
    const byCategory = await this.getClubsByCategory();
    const recommended = await this.getRecommendedClubs(browseParams.userId);

    return { featured, byCategory, recommended };
  }

  // Get recommended clubs based on user profile/location
  private async getRecommendedClubs(userId?: number): Promise<ClubSummary[]> {
    if (!userId) return [];

    // Get user profile for recommendations
    const userProfile = await this.userProfileService.getUserProfile(userId);

    // Build recommendation query based on user's location, preferences, etc.
    // Implementation details...

    return [];
  }

  // Calculate distance SQL for location-based search
  private calculateDistanceSelect(location: string): string {
    // Implement haversine formula for distance calculation
    // Return SQL fragment for distance calculation
    return `(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance`;
  }
}
```

### InviteCodeService Class

```typescript
class InviteCodeService {
  // Real-time validation of invite codes
  async validateInviteCode(code: string): Promise<InviteCodeValidation> {
    const inviteCode = await this.inviteCodeRepository.findByCode(code);

    if (!inviteCode) {
      return {
        valid: false,
        message: "Invite code not found",
        errorCode: "CODE_NOT_FOUND",
      };
    }

    if (!inviteCode.is_active) {
      return {
        valid: false,
        message: "Invite code is no longer active",
        errorCode: "CODE_INACTIVE",
      };
    }

    if (inviteCode.expires_at < new Date()) {
      return {
        valid: false,
        message: "Invite code has expired",
        errorCode: "CODE_EXPIRED",
      };
    }

    if (
      inviteCode.usage_limit &&
      inviteCode.used_count >= inviteCode.usage_limit
    ) {
      return {
        valid: false,
        message: "Invite code usage limit reached",
        errorCode: "USAGE_LIMIT_REACHED",
      };
    }

    // Get club information
    const club = await this.clubService.getClubById(inviteCode.club_id);

    return {
      valid: true,
      club: {
        id: club.id,
        name: club.name,
        clubType: club.club_type,
        description: club.description,
        logoUrl: club.logo_url,
        memberCount: await this.clubService.getMemberCount(club.id),
      },
      code: {
        expiresAt: inviteCode.expires_at.toISOString(),
        usageLimit: inviteCode.usage_limit,
        usedCount: inviteCode.used_count,
        remainingUses: inviteCode.usage_limit
          ? inviteCode.usage_limit - inviteCode.used_count
          : null,
      },
      message: "Invite code is valid",
    };
  }

  // Preview club information without using the code
  async previewInviteCode(
    code: string,
    userId: number
  ): Promise<InviteCodePreview> {
    const validation = await this.validateInviteCode(code);

    if (!validation.valid) {
      return {
        valid: false,
        userCanJoin: false,
        alreadyMember: false,
        message: validation.message,
      };
    }

    // Check if user is already a member
    const alreadyMember = await this.clubService.isUserMember(
      validation.club!.id,
      userId
    );

    return {
      valid: true,
      club: validation.club,
      userCanJoin: !alreadyMember,
      alreadyMember,
      message: alreadyMember
        ? "You are already a member of this club"
        : "You can join this club",
    };
  }

  // Use invite code and increment usage count
  async useInviteCode(
    code: string,
    userId: number
  ): Promise<UseInviteCodeResult> {
    const validation = await this.validateInviteCode(code);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Increment usage count atomically
    await this.inviteCodeRepository.incrementUsageCount(code);

    // Log usage for audit
    await this.auditService.logInviteCodeUsage(code, userId);

    return {
      success: true,
      club: validation.club!,
      message: "Successfully joined club",
    };
  }
}
```

### ProfileCompletionService Class

```typescript
class ProfileCompletionService {
  // Calculate comprehensive profile completion status
  async getProfileCompletion(userId: number): Promise<ProfileCompletionStatus> {
    const profile = await this.userProfileService.getUserProfile(userId);
    const userRoles = await this.userRoleService.getUserRoles(userId);
    const preferences = await this.userPreferencesService.getUserPreferences(
      userId
    );

    // Calculate profile completion
    const profileCompletion = this.calculateProfileCompletion(profile);

    // Calculate role completion for each role
    const roleCompletion = await Promise.all(
      userRoles.map((role) => this.calculateRoleCompletion(userId, role))
    );

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(
      profileCompletion.progress,
      roleCompletion,
      preferences ? 100 : 0
    );

    // Generate next steps recommendations
    const nextSteps = this.generateNextSteps(
      profileCompletion,
      roleCompletion,
      preferences
    );

    return {
      overallProgress,
      profileCompletion,
      roleCompletion,
      preferencesSet: !!preferences,
      nextSteps,
    };
  }

  // Calculate profile fields completion
  private calculateProfileCompletion(profile: UserProfile): ProfileCompletion {
    const requiredFields = ["firstName", "lastName", "dateOfBirth"];
    const optionalFields = ["phone", "address", "avatar"];

    const missingRequired = requiredFields.filter((field) => !profile[field]);
    const missingOptional = optionalFields.filter((field) => !profile[field]);

    const completedRequired = requiredFields.length - missingRequired.length;
    const completedOptional = optionalFields.length - missingOptional.length;

    const progress = Math.round(
      (completedRequired / requiredFields.length) * 70 +
        (completedOptional / optionalFields.length) * 30
    );

    return {
      completed: missingRequired.length === 0,
      progress,
      missingFields: [
        ...missingRequired.map((field) => ({
          field,
          required: true,
          description: this.getFieldDescription(field),
        })),
        ...missingOptional.map((field) => ({
          field,
          required: false,
          description: this.getFieldDescription(field),
        })),
      ],
    };
  }

  // Calculate role-specific completion
  private async calculateRoleCompletion(
    userId: number,
    role: UserRole
  ): Promise<RoleCompletion> {
    const account = await this.userAccountService.getUserAccount(
      userId,
      role.role,
      role.club_id
    );

    const requiredSteps = this.getRoleRequiredSteps(role.role);
    const completedSteps = this.getCompletedSteps(account, role);

    const progress = Math.round(
      (completedSteps.length / requiredSteps.length) * 100
    );
    const missingSteps = requiredSteps.filter(
      (step) => !completedSteps.includes(step)
    );

    return {
      role: role.role,
      completed: missingSteps.length === 0,
      progress,
      missingSteps: missingSteps.map((step) => ({
        step,
        required: true,
        description: this.getStepDescription(step, role.role),
      })),
    };
  }

  // Generate personalized next steps
  private generateNextSteps(
    profileCompletion: ProfileCompletion,
    roleCompletion: RoleCompletion[],
    preferences: UserPreferences | null
  ): NextStep[] {
    const steps: NextStep[] = [];

    // Profile completion steps
    if (!profileCompletion.completed) {
      const missingRequired = profileCompletion.missingFields.filter(
        (f) => f.required
      );
      if (missingRequired.length > 0) {
        steps.push({
          action: "complete_profile",
          description: `Complete your profile by adding: ${missingRequired
            .map((f) => f.field)
            .join(", ")}`,
          priority: "high",
        });
      }
    }

    // Role completion steps
    roleCompletion.forEach((role) => {
      if (!role.completed) {
        steps.push({
          action: "complete_role_setup",
          description: `Complete your ${role.role} setup`,
          priority: role.role === "club_manager" ? "high" : "medium",
        });
      }
    });

    // Preferences step
    if (!preferences) {
      steps.push({
        action: "set_preferences",
        description: "Set your notification and privacy preferences",
        priority: "medium",
      });
    }

    return steps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Update completion tracking
  async updateCompletionProgress(
    userId: number,
    step: string,
    role?: string
  ): Promise<CompletionUpdate> {
    // Log completion step
    await this.completionTrackingRepository.logStep(userId, step, role);

    // Recalculate progress
    const newCompletion = await this.getProfileCompletion(userId);

    // Generate next suggestion
    const nextSuggestion =
      newCompletion.nextSteps.length > 0
        ? newCompletion.nextSteps[0].description
        : null;

    return {
      success: true,
      newProgress: newCompletion.overallProgress,
      completedStep: step,
      nextSuggestion,
    };
  }
}
```

### AccountManagementService Class

```typescript
class AccountManagementService {
  // Generate account number with proper sequencing
  async generateAccountNumber(
    userId: number,
    role: string,
    clubId?: number
  ): Promise<string> {
    return this.accountNumberService.generateAccountNumber();
  }

  // Get account details by account number
  async getAccountByNumber(
    accountNumber: string
  ): Promise<AccountDetails | null> {
    const account = await this.userAccountRepository.findByAccountNumber(
      accountNumber
    );

    if (!account) {
      return null;
    }

    const user = await this.userService.getUserById(account.user_id);
    const profile = await this.userProfileService.getUserProfile(
      account.user_id
    );

    return {
      account: {
        accountNumber: account.account_number,
        userId: account.user_id.toString(),
        role: account.role,
        clubId: account.club_id?.toString(),
        clubName: account.club_id
          ? await this.clubService.getClubName(account.club_id)
          : undefined,
        isActive: account.is_active,
        createdAt: account.created_at.toISOString(),
        onboardingCompletedAt: account.onboarding_completed_at?.toISOString(),
      },
      user: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: user.email,
        avatar: profile.avatar,
      },
    };
  }

  // Search accounts (admin/support function)
  async searchAccounts(
    query: string,
    role?: string
  ): Promise<AccountSearchResult[]> {
    const searchQuery = this.userAccountRepository
      .createQueryBuilder()
      .where("account_number LIKE ?", [`%${query}%`]);

    if (role) {
      searchQuery.andWhere("role = ?", [role]);
    }

    const accounts = await searchQuery
      .leftJoin(
        "user_profiles",
        "profiles",
        "profiles.user_id = user_accounts.user_id"
      )
      .leftJoin("clubs", "clubs", "clubs.id = user_accounts.club_id")
      .select([
        "user_accounts.account_number",
        "profiles.first_name",
        "profiles.last_name",
        "user_accounts.role",
        "clubs.name as club_name",
        "user_accounts.is_active",
        "user_accounts.created_at",
      ])
      .getRawMany();

    return accounts.map((account) => ({
      accountNumber: account.account_number,
      userFullName: `${account.first_name} ${account.last_name}`,
      role: account.role,
      clubName: account.club_name,
      isActive: account.is_active,
      createdAt: account.created_at.toISOString(),
    }));
  }

  // Validate account number format
  validateAccountNumberFormat(accountNumber: string): boolean {
    return AccountNumberService.validateAccountNumber(accountNumber);
  }

  // Get all user accounts
  async getUserAccounts(userId: number): Promise<UserAccount[]> {
    return this.userAccountRepository.findByUserId(userId);
  }
}
```

### UserService Updates

```typescript
class UserService {
  // Create new user (account numbers generated per role in user_accounts table)
  async createUser(email: string, passwordHash: string): Promise<User> {
    const user = await this.userRepository.create({
      email,
      password_hash: passwordHash,
      primary_role: "member", // Default primary role
    });

    // Create empty profile record
    await this.userProfileService.upsertUserProfile(user.id, {});

    return user;
  }

  // Get user with profile data and accounts
  async getUserWithProfile(userId: number): Promise<UserWithProfile> {
    const user = await this.userRepository.findById(userId);
    const profile = await this.userProfileService.getUserProfile(userId);
    const accounts = await this.userAccountRepository.findByUserId(userId);

    return {
      ...user,
      profile,
      name: profile.fullName, // Computed from profile
      accounts: accounts.map((a) => ({
        accountNumber: a.account_number,
        role: a.role,
        clubId: a.club_id,
        isActive: a.is_active,
      })),
    };
  }

  // Create user children records (for parents)
  async createUserChildren(
    parentUserId: number,
    children: ChildInfo[]
  ): Promise<void> {
    // Create records in user_children table with proper relationship tracking
    for (const child of children) {
      await this.userChildrenRepository.create({
        parent_user_id: parentUserId,
        child_user_id: child.childUserId || null,
        relationship: child.relationship,
        // Only store manual data if child doesn't have user account
        first_name: child.childUserId ? null : child.firstName,
        last_name: child.childUserId ? null : child.lastName,
        date_of_birth: child.childUserId ? null : child.dateOfBirth,
        club_id: child.clubId || null,
        membership_code: child.membershipCode || null,
      });
    }
  }

  // Get children with full details (combining user_children + user_profiles data)
  async getUserChildren(parentUserId: number): Promise<ChildWithDetails[]> {
    const children = await this.userChildrenRepository.findByParentId(
      parentUserId
    );

    return Promise.all(
      children.map(async (child) => {
        if (child.child_user_id) {
          // Get details from user profile
          const profile = await this.userProfileService.getUserProfile(
            child.child_user_id
          );
          return {
            id: child.id,
            relationship: child.relationship,
            firstName: profile.first_name,
            lastName: profile.last_name,
            fullName: profile.full_name,
            dateOfBirth: profile.date_of_birth,
            avatar: profile.avatar,
            hasUserAccount: true,
            childUserId: child.child_user_id,
            clubId: child.club_id,
            membershipCode: child.membership_code,
          };
        } else {
          // Use manual data from user_children table
          return {
            id: child.id,
            relationship: child.relationship,
            firstName: child.profile_first_name,
            lastName: child.profile_last_name,
            fullName: `${child.profile_first_name} ${child.profile_last_name}`,
            dateOfBirth: child.profile_dob,
            avatar: null,
            hasUserAccount: false,
            childUserId: null,
            clubId: child.club_id,
            membershipCode: child.membership_code,
          };
        }
      })
    );
  }
}
```

## Validation Rules

### Role-Based Validation

- **Club Manager:** `personalData.firstName`, `personalData.lastName`, `clubData.clubName`, `clubData.clubType` are required
- **Member:** `personalData.firstName`, `personalData.lastName`, `personalData.dateOfBirth` are required
- **Parent:** `personalData.firstName`, `personalData.lastName`, `parentData.relationship`, `parentData.children` array (min 1) are required

### Multi-Role Business Logic

1. **Profile Data Management:**

   - All personal information stored in `user_profiles` table (single source of truth)
   - Profile data is shared across all roles for the same user
   - Any role can update the profile data, changes apply to all roles
   - Generated `full_name` field automatically updated when first/last name changes

2. **User Preferences Management:**

   - All user preferences stored in `user_preferences` table (single source of truth)
   - Preferences apply across all roles for the same user
   - Notification settings, UI preferences, privacy settings managed centrally
   - Any role can update preferences, changes apply to all roles

3. **Club Data Management:**

   - All club information stored in dedicated `clubs` table (single source of truth)
   - Club created when user completes club_manager onboarding
   - `user_onboarding_data` references `club_id` instead of duplicating club data
   - Club updates made directly to `clubs` table, automatically reflected everywhere

4. **Role Management:**

   - User roles are tracked in `user_roles` table (not JSON in users table)
   - User can only have one instance of each role type per club
   - Exception: Member role can exist for multiple clubs (different club_id)
   - Club manager role limited to one club per user
   - Roles are retrieved by joining `user_roles` table

5. **Account Number:**

   - Generated per role/club combination (not per user)
   - Format: CQ + YEAR + 5-digit sequence (e.g., CQ202500001)
   - Each account number is unique across the entire system
   - Users can have multiple account numbers (one per role/club combination)
   - Used for easy account identification and support

6. **Primary Role Logic:**

   - First completed role becomes primary role
   - User can switch primary role among completed roles
   - Primary role determines default dashboard view
   - Primary role stored in `users.primary_role` field

7. **Club Invite Codes:**

   - Must exist and be active
   - Must not be expired
   - Must not exceed usage limit
   - Can only be used for member role
   - One user can join multiple clubs with different codes
   - Links members to specific clubs through `user_roles.club_id`

8. **Profile Images:**

   - Stored in `user_profiles` table (single source of truth)
   - Shared across all roles for the same user
   - Max file size: 5MB
   - Allowed formats: JPEG, PNG, WebP
   - Auto-resize to standard dimensions

9. **Children Information:**

   - Each child record must have either `child_user_id` OR manual child data (enforced by database constraint)
   - If `child_user_id` provided, child details are retrieved from `user_profiles` table
   - If no `child_user_id`, manual `firstName`, `lastName`, and `dateOfBirth` are required
   - Relationship type stored in `user_children` table (not in onboarding data)
   - Children can be associated with clubs through `club_id` foreign key
   - Child membership codes should be validated if provided

10. **Data Normalization Benefits:**
    - No duplicate club data across tables
    - Single update point for club information
    - Consistent user preferences across all roles
    - Simplified data maintenance and updates
    - Better data integrity and consistency

## Error Handling

### Error Codes

- `ROLE_INVALID_TYPE`: Invalid role type provided
- `ROLE_MISSING_REQUIRED_FIELDS`: Required fields missing for role type
- `ROLE_ALREADY_EXISTS`: User already has this role
- `ROLE_LIMIT_EXCEEDED`: User has reached maximum roles allowed
- `ACCOUNT_NUMBER_GENERATION_FAILED`: Failed to generate unique account number
- `INVITE_CODE_INVALID`: Club invite code is invalid or expired
- `INVITE_CODE_USAGE_EXCEEDED`: Invite code usage limit exceeded
- `IMAGE_UPLOAD_FAILED`: Profile image upload failed
- `IMAGE_SIZE_EXCEEDED`: Image file too large
- `IMAGE_FORMAT_INVALID`: Unsupported image format

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: any;
}
```

## Security Considerations

1. **Authentication:** All role management endpoints require valid JWT token
2. **Input Validation:** Sanitize all user inputs, especially text fields
3. **File Upload Security:**
   - Validate file types and sizes
   - Scan for malicious content
   - Store in secure cloud storage
4. **Rate Limiting:** Implement rate limits on role creation endpoints
5. **Data Privacy:** Ensure GDPR compliance for children's data
6. **Account Number Security:**
   - Account numbers should not be predictable
   - Include rate limiting on account creation
   - Log account number generation for audit trails

## Integration Points

### Frontend Integration

The frontend will support multiple role workflows:

**Initial Onboarding (New User):**

1. User registers and verifies email
2. User completes first role onboarding → `POST /api/onboarding/complete`
3. Upload profile image (if provided) → `POST /api/users/avatar`
4. Redirect to role-specific dashboard

**Adding Additional Roles (Existing User):**

1. User navigates to "Add Role" section
2. User selects new role type and completes form
3. Submit role data → `POST /api/users/roles/add`
4. Update UI to show new role capabilities

**Role Management:**

1. Get user roles and status → `GET /api/users/roles`
2. Switch primary role → `PUT /api/users/primary-role`
3. Manage role-specific settings per role

### Email Notifications

Send role-specific welcome emails:

- **Club Manager:** Welcome email with club setup instructions and management features
- **Member:** Welcome email with club connection instructions and member features
- **Parent:** Welcome email with child monitoring instructions and parent features
- **Multi-Role Users:** Combined welcome email highlighting all available features

### Analytics Integration

Track multi-role user behavior and onboarding patterns:

- Role completion rates by type
- Multi-role adoption patterns
- Most common role combinations
- Time to complete each role type
- User journey through different roles
- Account number usage for support analytics

## Testing Requirements

### Unit Tests

- AccountNumberService generation and validation
- UserRoleService role management logic
- Role-specific validation logic
- Club invite code validation
- Image upload processing
- Multi-role conflict detection

### Integration Tests

- Complete role addition flow for each role type
- Multi-role user scenarios
- Club invite code usage across multiple members
- Role switching and primary role management
- Profile image sharing across roles
- Error handling scenarios

### API Tests

- All endpoint request/response formats
- Authentication requirements
- Error responses
- Rate limiting behavior

## Deployment Considerations

1. **Database Migrations:** Create migration scripts for new tables and account number system
2. **Environment Variables:** Configure image storage credentials and account number format
3. **File Storage:** Set up cloud storage for profile images
4. **Monitoring:** Add logging for role completion rates and multi-role patterns
5. **Backup Strategy:** Ensure all role data and account sequences are included in backups
6. **Account Number Sequences:** Ensure atomic updates to prevent duplicate account numbers

## Future Enhancements

1. **Advanced Role Management:**

   - Role permissions and capabilities matrix
   - Temporary role assignments with expiration
   - Role approval workflows for certain types

2. **Enhanced Multi-Role Features:**

   - Role-specific dashboards with quick switching
   - Unified activity feed across all roles
   - Cross-role notifications and communications

3. **Account Number Features:**

   - QR codes for easy account lookup
   - Account number-based search and support tools
   - Integration with payment systems using account numbers

4. **Social Media Integration:** Allow profile import from social platforms for all roles

5. **Bulk Operations:**

   - Allow clubs to invite multiple members at once
   - Bulk role assignments for organizations
   - Import/export user role data

6. **Advanced Validation:**

   - Verify club registration numbers and licenses
   - Integration with external identity verification services
   - Document uploads for role verification

7. **Mobile App Optimizations:**
   - Role-specific mobile interfaces
   - Push notifications per role
   - Offline role management capabilities

## Summary

This multi-role onboarding system with proper database normalization provides:

- **Flexible User Accounts:** Users can have multiple roles (parent + member + club manager)
- **Single Source of Truth:** All personal data centralized in `user_profiles` table
- **Proper Role Management:** Roles tracked in dedicated `user_roles` table (not JSON)
- **Dedicated Club Management:** Complete club information in `clubs` table
- **Unique Identification:** Account numbers for easy user identification and support
- **Role-Specific Data:** Separate onboarding flows and data storage per role (non-personal data only)
- **Data Consistency:** Profile updates automatically apply across all user roles
- **Scalable Architecture:** Support for future role types and complex permissions
- **Professional User Experience:** Seamless role switching and management

### Key Architecture Benefits:

1. **Data Integrity:** Personal information stored once, updated everywhere
2. **Proper Normalization:** No JSON arrays for relational data
3. **Simplified Maintenance:** Single location for profile data updates
4. **Consistent User Experience:** Same profile information across all roles
5. **Easy Data Migration:** Clear separation between personal and role-specific data
6. **Club Management:** Dedicated table for club information with proper relationships
7. **Role Flexibility:** Users can have multiple roles with different clubs
8. **Query Efficiency:** Proper indexes and foreign keys for optimal performance

### Database Architecture:

- **`users`:** Core authentication info (no account numbers - stored per role)
- **`user_profiles`:** All personal information (single source of truth)
- **`user_preferences`:** All user preferences and settings (single source of truth)
- **`user_roles`:** Role assignments with club associations
- **`clubs`:** Complete club information and management (single source of truth)
- **`user_accounts`:** Role-specific accounts with unique account numbers (replaces user_onboarding_data)
- **`user_children`:** Parent-child relationships
- **`club_invite_codes`:** Club invitation system
- **`account_sequences`:** Account number generation

The system eliminates data redundancy while maintaining clear separation of concerns, with all personal information, user preferences, and club data managed through single, authoritative sources. Each role/club combination gets its own account number for easy identification and support. This approach ensures data consistency, simplifies maintenance, and provides better performance through proper normalization. 5. **Mobile App Support:** Optimize endpoints for mobile app usage

This implementation will provide a comprehensive onboarding system that supports the three user types with appropriate data collection and validation for each role.
