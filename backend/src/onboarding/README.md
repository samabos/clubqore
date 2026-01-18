# ClubQore Onboarding System

A comprehensive multi-role onboarding system for the ClubQore platform that supports club managers, members, and parents with proper data normalization and account management.

## 🏗️ Architecture Overview

The onboarding system is built with a modular architecture:

```
src/onboarding/
├── services/          # Business logic layer
├── controllers/       # HTTP request handlers
├── routes/           # API route definitions
├── schemas/          # Validation schemas
└── index.js          # Main module exports
```

## 🎯 Key Features

### Club Manager Onboarding

- **Club Manager**: Create and manage clubs during signup
- **Member & Parent**: Added via the parent invite system (not through general onboarding)

### Unique Account Numbers

- Format: `CQ{YEAR}{5-digit-sequence}`
- Example: `CQ202500001`
- Auto-generated for each role/club combination

### Comprehensive Data Management

- Single source of truth for user profiles
- Normalized database design
- Proper foreign key relationships
- Transaction-safe operations

### Profile Completion Tracking

- Real-time progress calculation
- Step-by-step guidance
- Recommended actions

## 📊 Database Schema

### Core Tables

- `user_profiles` - Single source of truth for user data
- `user_preferences` - Notification and privacy settings
- `user_roles` - Role assignments with club associations
- `user_accounts` - Account numbers and role-specific metadata
- `clubs` - Club information and management
- `club_invites` - Parent invitation system with email-based registration
- `user_children` - Parent-child relationships
- `account_sequences` - Account number generation tracking

## 🚀 API Endpoints

### Onboarding

```
POST /api/onboarding/complete           # Complete initial onboarding
POST /api/onboarding/roles              # Add additional role
GET  /api/onboarding/status             # Get user status
GET  /api/onboarding/progress           # Get onboarding progress
PUT  /api/onboarding/primary-role       # Set primary role
DELETE /api/onboarding/roles/:role      # Deactivate role
```

### Profile Management

```
PUT  /api/profile                       # Update user profile
GET  /api/profile/:userId?              # Get user profile
PUT  /api/profile/preferences           # Update preferences
GET  /api/profile/preferences           # Get preferences
POST /api/profile/avatar               # Upload avatar
GET  /api/profile/children             # Get children (parents)
POST /api/profile/children             # Add child (parents)
```

### Club Management

```
GET  /api/clubs/:clubId                # Get club details
PUT  /api/clubs/:clubId                # Update club (managers only)
GET  /api/clubs/user/:userId?          # Get user's clubs
GET  /api/clubs/search                 # Search clubs
GET  /api/clubs/browse                 # Browse featured clubs
```

### Parent Invite System

```
POST   /api/parent-invites                              # Create parent invite
GET    /api/clubs/:clubId/parent-invites                # Get club invites
DELETE /api/parent-invites/:inviteCode                  # Cancel invite
POST   /api/parent-invites/:inviteCode/resend           # Resend invite
GET    /api/public/parent-invites/:inviteCode           # Get invite details (public)
POST   /api/public/parent-invites/:inviteCode/complete  # Complete registration (public)
```

### Account Management

```
POST /api/accounts/generate            # Generate account number
GET  /api/accounts/:accountNumber      # Get account by number
GET  /api/accounts/search              # Search accounts
```

## 💻 Usage Examples

### Complete Club Manager Onboarding

```javascript
const roleData = {
  role: "club_manager",
  personalData: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-01",
    phoneNumber: "+1234567890",
    address: "123 Main St, City, State",
  },
  clubData: {
    name: "Elite Sports Club",
    description: "A premier sports club for all ages",
    category: "sports",
    type: "public",
    location: "New York, NY",
    contactEmail: "info@elitesports.com",
    contactPhone: "+1234567890",
  },
  preferences: {
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
    },
    privacy: {
      profileVisibility: "public",
    },
  },
};

const response = await fetch("/api/onboarding/complete", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(roleData),
});

const result = await response.json();
// Returns: { success: true, accountNumber: "CQ202500001", user: {...}, message: "..." }
```

### Member and Parent Registration

Members and parents are NOT registered through the onboarding system. They are added via:
- **Parents**: Email-based parent invite system (`/api/parent-invites`)
- **Members**: Created as children during parent registration

See the Parent Invite System documentation for details.

## 🔧 Service Classes

### OnboardingService

Main orchestrator service that coordinates all onboarding operations.

```javascript
import { OnboardingService } from "./src/onboarding/services/OnboardingService.js";

const onboardingService = new OnboardingService(db);

// Complete initial onboarding
const result = await onboardingService.completeInitialOnboarding(
  userId,
  roleData
);

// Get user status
const status = await onboardingService.getUserStatus(userId);

// Add additional role
const additionalRole = await onboardingService.addUserRole(userId, newRoleData);
```

### Individual Services

- **UserRoleService**: Role management and validation
- **UserProfileService**: Profile data management
- **UserPreferencesService**: User preferences
- **ClubService**: Club operations and search
- **AccountNumberService**: Unique account generation
- **ParentInviteService**: Parent invitation and registration system (in `/parent` module)

## 🧪 Testing

Run the onboarding system tests:

```bash
npm test src/onboarding/onboarding.test.js
```

The test suite covers:

- Club manager onboarding flow
- Member onboarding with invite codes
- Parent onboarding with children
- Profile management
- Account number generation
- Search functionality

## 🔐 Authentication & Authorization

All API endpoints require authentication via JWT token:

```javascript
headers: {
  'Authorization': 'Bearer ' + token
}
```

Role-specific access control:

- Club managers can update their clubs
- Parents and members are managed via the parent invite system

## 📝 Validation

Comprehensive validation schemas using JSON Schema:

- **Input validation**: Request body validation
- **Data integrity**: Database constraints
- **Business rules**: Role-specific validation
- **Format validation**: Email, phone, dates, URLs

## 🚀 Getting Started

1. **Database Setup**: Run migrations to create onboarding tables

```bash
node run-migrations.js
```

2. **Import the Module**:

```javascript
import { registerOnboardingRoutes } from "./src/onboarding/index.js";

// Register routes in your Fastify app
await fastify.register(registerOnboardingRoutes, {
  prefix: "/api",
  db: fastify.knex,
});
```

3. **Frontend Integration**: Use the API endpoints to build your onboarding flow

## 🎨 Frontend Integration

The onboarding system is designed to work with any frontend framework. Key integration points:

### Progress Tracking

```javascript
// Get onboarding progress
const progress = await fetch("/api/onboarding/progress");
const { currentStep, completionProgress } = await progress.json();

// Update progress
await fetch("/api/onboarding/completion/update", {
  method: "POST",
  body: JSON.stringify({ step: "profile_created" }),
});
```

### Role Management

```javascript
// Get available roles
const status = await fetch("/api/onboarding/status");
const { availableRoles } = await status.json();

// Set primary role
await fetch("/api/onboarding/primary-role", {
  method: "PUT",
  body: JSON.stringify({ role: "club_manager" }),
});
```

## 🔄 Migration Guide

If migrating from an existing system:

1. **Backup existing data**
2. **Run database migrations**
3. **Update user records** to match new schema
4. **Test onboarding flows** with existing users
5. **Update frontend** to use new API endpoints

## 📈 Performance Considerations

- **Database indexes** on frequently queried columns
- **Transaction management** for data consistency
- **Efficient queries** with proper joins
- **Pagination** for large result sets
- **Caching** for club and user data

## 🐛 Troubleshooting

### Common Issues

**Migration Errors**: Check for existing columns before running migrations

```javascript
const hasColumn = await knex.schema.hasColumn("users", "column_name");
```

**Duplicate Role Errors**: Validate role uniqueness before insertion

```javascript
await this.checkDuplicateRole(userId, role, clubId, trx);
```

**Account Number Conflicts**: Use transactions for account generation

```javascript
return await this.db.transaction(async (trx) => {
  // Generate unique account number
});
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update validation schemas for new endpoints
4. Document API changes in this README
5. Ensure database migrations are reversible

## 📚 API Documentation

Full API documentation is available at `/docs` when running the server with Swagger UI integration.
