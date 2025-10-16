# Frontend Integration Guide: Onboarding System

> **⚠️ Critical Updates Required**  
> This guide outlines the key adjustments frontend developers need to make based on the actual backend implementation versus the original documentation.

## 🔧 Critical API Endpoint Updates

### 1. **Correct Base URLs**

❌ **WRONG** (from old documentation)

```typescript
POST / api / users / roles / add;
GET / api / users / roles;
GET / api / clubs / invite - codes / { code } / validate;
POST / api / clubs / invite - codes / { code } / use;
```

✅ **CORRECT** (actual implementation)

```typescript
POST / onboarding / roles;
GET / onboarding / status;
POST / invites / validate;
POST / invites / preview; // New endpoint for preview functionality
```

### 2. **Complete Endpoint Mapping**

| Function            | Documentation URL                             | Actual Implementation           |
| ------------------- | --------------------------------------------- | ------------------------------- |
| Complete onboarding | `POST /api/onboarding/complete`               | `POST /onboarding/complete`     |
| Add role            | `POST /api/users/roles/add`                   | `POST /onboarding/roles`        |
| Get user status     | `GET /api/users/roles`                        | `GET /onboarding/status`        |
| Validate invite     | `GET /api/clubs/invite-codes/{code}/validate` | `POST /invites/validate`        |
| Preview invite      | `POST /api/clubs/invite-codes/{code}/preview` | `POST /invites/preview`         |
| Profile management  | `GET /api/users/profile`                      | `GET /profile`                  |
| Update profile      | `PUT /api/users/profile`                      | `PUT /profile`                  |
| User preferences    | `GET /api/users/preferences`                  | `GET /profile/preferences`      |
| Update preferences  | `PUT /api/users/preferences`                  | `PUT /profile/preferences`      |
| Children management | `GET /api/users/children`                     | `GET /profile/children`         |
| Add child           | `POST /api/users/children`                    | `POST /profile/children`        |
| Account generation  | `POST /api/accounts/generate`                 | `POST /accounts/generate`       |
| Account details     | `GET /api/accounts/{accountNumber}`           | `GET /accounts/{accountNumber}` |
| Account search      | `GET /api/accounts/search`                    | `GET /accounts/search`          |

## 📋 Response Schema Updates

### 1. **Invite Preview Response - Critical Fix**

The documentation mentions `canJoin` but the actual implementation returns `userCanJoin`:

❌ **WRONG**

```typescript
interface InvitePreviewResponse {
  valid: boolean;
  club: ClubInfo;
  canJoin: boolean; // This property doesn't exist!
  message: string;
}
```

✅ **CORRECT**

```typescript
interface InvitePreviewResponse {
  valid: boolean;
  club: {
    id: string;
    name: string;
    clubType: string;
    description?: string;
    logoUrl?: string;
    memberCount: number;
  };
  userCanJoin: boolean; // Use this property name
  alreadyMember: boolean;
  message: string;
}
```

### 2. **User Roles Response Structure**

✅ **CORRECT** structure based on implementation:

```typescript
interface UserRolesResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    primaryRole: string;
    isOnboarded: boolean;
  };
  accounts: Array<{
    accountNumber: string; // Format: CQ202500001
    role: string;
    clubId?: string;
    clubName?: string;
    clubType?: string;
    isActive: boolean;
    onboardingCompletedAt: string;
    createdAt: string;
    metadata: any;
  }>;
  availableRoles: string[]; // Roles user can still add
}
```

### 3. **Error Response Format**

✅ **Consistent error structure**:

```typescript
interface ErrorResponse {
  success: false;
  error?: string; // Error type
  message: string; // Human readable message
  code?: string; // Error code
  details?: any; // Additional error info
}
```

## 🏗️ Frontend Service Layer Updates

### 1. **Onboarding Service**

```typescript
class OnboardingService {
  private baseURL = "/onboarding"; // Note: no /api prefix

  // Initial onboarding (first role)
  async completeOnboarding(data: OnboardingData) {
    return this.api.post(`${this.baseURL}/complete`, data);
  }

  // Additional roles
  async addRole(data: RoleData) {
    return this.api.post(`${this.baseURL}/roles`, data);
  }

  // Get user status - returns comprehensive user data
  async getUserStatus() {
    return this.api.get(`${this.baseURL}/status`);
  }
}
```

### 2. **Invite Service**

```typescript
class InviteService {
  private baseURL = "/invites";

  // Validate invite code - basic validation
  async validateCode(code: string) {
    return this.api.post(`${this.baseURL}/validate`, { code });
  }

  // Preview club before joining - detailed club info
  async previewCode(code: string) {
    return this.api.post(`${this.baseURL}/preview`, { code });
  }
}
```

### 3. **Profile Service**

```typescript
class ProfileService {
  private baseURL = "/profile";

  async getProfile() {
    return this.api.get(this.baseURL);
  }

  async updateProfile(data: ProfileData) {
    return this.api.put(this.baseURL, data);
  }

  async getPreferences() {
    return this.api.get(`${this.baseURL}/preferences`);
  }

  async updatePreferences(data: PreferencesData) {
    return this.api.put(`${this.baseURL}/preferences`, data);
  }

  async getChildren() {
    return this.api.get(`${this.baseURL}/children`);
  }

  async addChild(childData: ChildData) {
    return this.api.post(`${this.baseURL}/children`, childData);
  }
}
```

### 4. **Account Service**

```typescript
class AccountService {
  private baseURL = "/accounts";

  async generateAccountNumber(data: GenerateAccountRequest) {
    return this.api.post(`${this.baseURL}/generate`, data);
  }

  async getAccountByNumber(accountNumber: string) {
    return this.api.get(`${this.baseURL}/${accountNumber}`);
  }

  async searchAccounts(query: string, role?: string) {
    const params = new URLSearchParams({ query });
    if (role) params.append("role", role);
    return this.api.get(`${this.baseURL}/search?${params}`);
  }
}
```

## 🔐 Authentication & Headers

### 1. **Consistent Auth Headers**

```typescript
// All protected endpoints require:
const headers = {
  authorization: `Bearer ${token}`,
};

// Example usage:
const response = await fetch("/onboarding/status", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userToken}`,
  },
});
```

### 2. **Request/Response Interceptors**

```typescript
// Axios interceptor example
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

## 📱 UI Component Updates

### 1. **Invite Code Flow Components**

```typescript
// Two-step invite process implementation
const InviteCodeFlow = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [clubPreview, setClubPreview] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Preview club info
  const handlePreviewCode = async () => {
    setIsValidating(true);
    setError("");
    try {
      const response = await inviteService.previewCode(inviteCode);
      setClubPreview(response.data);

      // Check the correct property name
      if (response.data.userCanJoin) {
        // NOT canJoin!
        setStep("confirm-join");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setError(error.response?.data?.message || "Invalid invite code");
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2: Complete onboarding with code
  const handleJoinClub = async () => {
    try {
      const onboardingData = {
        role: "member",
        personalData: {
          /* user data */
        },
        memberData: {
          clubInviteCode: inviteCode,
        },
      };

      const response = await onboardingService.completeOnboarding(onboardingData);
      
      if (response.data.success) {
        // Handle success
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Onboarding failed');
      }
    } catch (error) {
      // Handle API errors
      console.error('Onboarding error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="invite-flow">
      {error && <div className="error-message">{error}</div>}
      {/* Rest of component */}
    </div>
  );
};

// Club Manager Onboarding Component
const ClubManagerOnboarding = () => {
  const [formData, setFormData] = useState({
    personalData: {
      firstName: '',
      lastName: ''
    },
    clubData: {
      name: '',
      type: '',  // ✅ Use 'type' not 'clubType'
      description: ''
    }
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate required fields
      const requiredFields = [
        'personalData.firstName',
        'personalData.lastName', 
        'clubData.name',
        'clubData.type'
      ];
      
      for (const field of requiredFields) {
        const value = getNestedValue(formData, field);
        if (!value || value.trim() === '') {
          throw new Error(`${field} is required`);
        }
      }

      const response = await onboardingService.completeOnboarding({
        role: 'club_manager',
        ...formData
      });

      if (response.data.success) {
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Club manager onboarding error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      {error && (
        <div className="error-alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Personal Data Fields */}
      <fieldset>
        <legend>Personal Information</legend>
        <input
          type="text"
          placeholder="First Name"
          value={formData.personalData.firstName}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            personalData: { ...prev.personalData, firstName: e.target.value }
          }))}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.personalData.lastName}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            personalData: { ...prev.personalData, lastName: e.target.value }
          }))}
          required
        />
      </fieldset>

      {/* Club Data Fields */}
      <fieldset>
        <legend>Club Information</legend>
        <input
          type="text"
          placeholder="Club Name"
          value={formData.clubData.name}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            clubData: { ...prev.clubData, name: e.target.value }
          }))}
          required
        />
        <select
          value={formData.clubData.type}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            clubData: { ...prev.clubData, type: e.target.value }
          }))}
          required
        >
          <option value="">Select Club Type</option>
          <option value="sports">Sports</option>
          <option value="academic">Academic</option>
          <option value="social">Social</option>
          <option value="professional">Professional</option>
          <option value="hobby">Hobby</option>
        </select>
        <textarea
          placeholder="Club Description (Optional)"
          value={formData.clubData.description}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            clubData: { ...prev.clubData, description: e.target.value }
          }))}
        />
      </fieldset>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Club...' : 'Complete Onboarding'}
      </button>
    </form>
  );
};
```

### 2. **Multi-Role Dashboard**

```typescript
const UserDashboard = () => {
  const [userStatus, setUserStatus] = useState(null);
  const [currentRole, setCurrentRole] = useState("member");

  useEffect(() => {
    const loadUserStatus = async () => {
      const response = await onboardingService.getUserStatus();
      setUserStatus(response.data);
      setCurrentRole(response.data.user.primaryRole);
    };

    loadUserStatus();
  }, []);

  return (
    <div className="dashboard">
      {/* Role Switcher */}
      <div className="role-switcher">
        {userStatus?.accounts.map((account) => (
          <button
            key={account.accountNumber}
            className={`role-btn ${
              currentRole === account.role ? "active" : ""
            }`}
            onClick={() => setCurrentRole(account.role)}
          >
            {account.role} - {account.accountNumber}
            {account.clubName && <span>({account.clubName})</span>}
          </button>
        ))}
      </div>

      {/* Role-specific content */}
      <div className="role-content">
        {currentRole === "club_manager" && <ClubManagerDashboard />}
        {currentRole === "member" && <MemberDashboard />}
        {currentRole === "parent" && <ParentDashboard />}
      </div>

      {/* Available roles to add */}
      {userStatus?.availableRoles?.length > 0 && (
        <div className="add-role-section">
          <h3>Add New Role</h3>
          {userStatus.availableRoles.map((role) => (
            <button key={role} onClick={() => navigate(`/onboarding/${role}`)}>
              Become a {role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. **Account Number Display Component**

```typescript
const AccountNumberCard = ({ account }) => {
  const [copied, setCopied] = useState(false);

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="account-card">
      <div className="account-header">
        <h4>{account.role}</h4>
        {account.clubName && (
          <span className="club-name">{account.clubName}</span>
        )}
      </div>

      <div className="account-number">
        <label>Account Number:</label>
        <div className="number-display">
          <span className="number">{account.accountNumber}</span>
          <button onClick={copyAccountNumber} className="copy-btn">
            {copied ? "✓" : "📋"}
          </button>
        </div>
      </div>

      <div className="account-meta">
        <span>Status: {account.isActive ? "Active" : "Inactive"}</span>
        <span>Created: {new Date(account.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
```

## 🎨 State Management Updates

### 1. **Redux/Context State Structure**

```typescript
interface AppState {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    primaryRole: string;
    isOnboarded: boolean;
  } | null;
  accounts: UserAccount[]; // Multiple accounts per user
  availableRoles: string[];
  currentRole: string; // Active role context
  clubPreview: ClubPreview | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
}

interface UserAccount {
  accountNumber: string; // Format: CQ202500001
  role: string;
  clubId?: string;
  clubName?: string;
  clubType?: string;
  isActive: boolean;
  onboardingCompletedAt: string;
  createdAt: string;
  metadata: any;
}
```

### 2. **Actions and Reducers**

```typescript
// Actions
const userActions = {
  setUserStatus: (payload: UserRolesResponse) => ({
    type: "SET_USER_STATUS",
    payload,
  }),

  switchRole: (role: string) => ({
    type: "SWITCH_ROLE",
    payload: role,
  }),

  addAccount: (account: UserAccount) => ({
    type: "ADD_ACCOUNT",
    payload: account,
  }),

  setClubPreview: (preview: ClubPreview) => ({
    type: "SET_CLUB_PREVIEW",
    payload: preview,
  }),
};

// Reducer
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_USER_STATUS":
      return {
        ...state,
        user: action.payload.user,
        accounts: action.payload.accounts,
        availableRoles: action.payload.availableRoles,
      };

    case "SWITCH_ROLE":
      return {
        ...state,
        currentRole: action.payload,
      };

    case "ADD_ACCOUNT":
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        availableRoles: state.availableRoles.filter(
          (role) => role !== action.payload.role || role === "member"
        ),
      };

    default:
      return state;
  }
};
```

## 🚨 Critical Error Handling

### 1. **Specific Error Codes**

```typescript
// Invite code errors
type InviteErrorCode =
  | "CODE_NOT_FOUND"
  | "CODE_EXPIRED"
  | "USAGE_LIMIT_REACHED"
  | "CODE_INACTIVE";

// Role errors
type RoleErrorCode =
  | "ROLE_ALREADY_EXISTS"
  | "ROLE_LIMIT_EXCEEDED"
  | "ROLE_INVALID_TYPE";

// Account errors
type AccountErrorCode = "ACCOUNT_NUMBER_GENERATION_FAILED";

// Error handler component
const ErrorHandler = ({ error }) => {
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "CODE_NOT_FOUND":
        return "Invite code not found. Please check the code and try again.";
      case "CODE_EXPIRED":
        return "This invite code has expired. Please request a new one.";
      case "USAGE_LIMIT_REACHED":
        return "This invite code has reached its usage limit.";
      case "ROLE_ALREADY_EXISTS":
        return "You already have this role for this club.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="error-message">
      {getErrorMessage(error.code || error.message)}
    </div>
  );
};
```

### 2. **Form Validation Updates**

```typescript
// Validation schemas matching backend
const onboardingSchema = {
  club_manager: {
    required: [
      "personalData.firstName",
      "personalData.lastName",
      "clubData.name",
      "clubData.type",
    ],
    optional: ["clubData.description", "clubData.foundedYear"],
  },
  member: {
    required: [
      "personalData.firstName",
      "personalData.lastName",
      "personalData.dateOfBirth",
    ],
    optional: ["memberData.position", "memberData.parentPhone"],
  },
  parent: {
    required: [
      "personalData.firstName",
      "personalData.lastName",
      "parentData.children",
    ],
    validation: {
      "parentData.children": (children) => children.length >= 1,
    },
  },
};

const validateOnboardingForm = (role: string, data: any) => {
  const schema = onboardingSchema[role];
  const errors = [];

  // Check required fields
  schema.required.forEach((field) => {
    if (!getNestedValue(data, field)) {
      errors.push(`${field} is required`);
    }
  });

  // Custom validations
  if (schema.validation) {
    Object.entries(schema.validation).forEach(([field, validator]) => {
      const value = getNestedValue(data, field);
      if (value && !validator(value)) {
        errors.push(`${field} is invalid`);
      }
    });
  }

  return errors;
};
```

## 🔧 Testing Updates

### 1. **API Integration Tests**

```typescript
// Update test endpoints
describe("Onboarding API", () => {
  test("should complete onboarding", async () => {
    const response = await api.post("/onboarding/complete", testData);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test("should get user status", async () => {
    const response = await api.get("/onboarding/status");
    expect(response.data.user).toBeDefined();
    expect(response.data.accounts).toBeArray();
  });

  test("should preview invite code", async () => {
    const response = await api.post("/invites/preview", { code: "TEST123" });
    expect(response.data.userCanJoin).toBeDefined(); // Not canJoin!
  });
});
```

### 2. **Component Tests**

```typescript
// Test with correct property names
describe("InvitePreview", () => {
  test("should display club info when valid", () => {
    const mockPreview = {
      valid: true,
      club: { name: "Test Club", clubType: "sports" },
      userCanJoin: true, // Use correct property
      alreadyMember: false,
      message: "You can join this club",
    };

    render(<InvitePreview preview={mockPreview} />);
    expect(screen.getByText("Test Club")).toBeInTheDocument();
    expect(screen.getByText("You can join this club")).toBeInTheDocument();
  });
});
```

## 📋 Migration Checklist

### ✅ **Immediate Actions Required**

1. **[ ] Update all API endpoint URLs** - Remove `/api` prefix, update paths
2. **[ ] Fix response property names** - Change `canJoin` to `userCanJoin`
3. **[ ] Implement invite preview flow** - Use `/invites/preview` endpoint
4. **[ ] Update state management** - Handle multiple accounts per user
5. **[ ] Add account number display** - Show in UI for user reference
6. **[ ] Update error handling** - Handle new error codes
7. **[ ] Fix form validation** - Match backend validation rules
8. **[ ] Update test suites** - Test against actual endpoints

### ✅ **Enhanced Features to Implement**

1. **[ ] Multi-role dashboard** - Allow role switching
2. **[ ] Account management UI** - Display all user accounts
3. **[ ] Enhanced invite flow** - Preview before joining
4. **[ ] Profile completion tracking** - Show progress indicators
5. **[ ] Preferences management** - Centralized settings
6. **[ ] Children management** - For parent role
7. **[ ] Club search and discovery** - Browse available clubs

### ✅ **Performance Optimizations**

1. **[ ] API response caching** - Cache user status, profiles
2. **[ ] Optimistic updates** - Update UI before API confirmation
3. **[ ] Lazy loading** - Load role-specific components on demand
4. **[ ] Error boundaries** - Graceful error handling
5. **[ ] Loading states** - Better UX during API calls

## 🔍 Backend Architecture Notes

The implementation uses a well-structured service layer:

```
Controllers → Services → Repositories
     ↓           ↓           ↓
   Routes → OnboardingService → Database
            InviteCodeService
            ClubService
            UserProfileService
            AccountService
```

Key backend features your frontend should leverage:

- **Single Source of Truth**: Profile data shared across all roles
- **Account Numbers**: Unique identifiers for each role/club combination
- **Proper Normalization**: No data duplication, consistent updates
- **Role Flexibility**: Users can have multiple roles with different clubs
- **Schema Validation**: Strict request/response validation

## 📚 Additional Resources

- **API Documentation**: Check Fastify schema definitions in route files
- **Database Schema**: Refer to migration files for table structures
- **Error Codes**: See service files for complete error code definitions
- **Test Examples**: Integration tests show expected request/response formats

---

## 🚀 Quick Start Guide

1. **Update your API base URLs**:

   ```typescript
   const API_BASE = ""; // Remove /api prefix
   ```

2. **Fix the invite preview property**:

   ```typescript
   // Change this:
   if (response.canJoin) {
     /* ... */
   }

   // To this:
   if (response.userCanJoin) {
     /* ... */
   }
   ```

3. **Update your state to handle multiple accounts**:

   ```typescript
   const [userAccounts, setUserAccounts] = useState([]);
   ```

4. **Test against the actual backend endpoints**:

   ```bash
   # Test onboarding status
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/onboarding/status

   # Test invite preview
   curl -X POST -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"code":"TEST123"}' \
        http://localhost:3000/invites/preview
   ```

This implementation is more robust and feature-complete than the original documentation. Follow this guide to ensure your frontend works correctly with the actual backend implementation.
