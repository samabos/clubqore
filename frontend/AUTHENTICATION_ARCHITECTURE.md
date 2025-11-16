# Simplified Authentication Architecture

## 🎯 **Problem Solved**

Previously, the authentication system was scattered across multiple places:

- `signIn()` in `authentication-actions.ts` - API calls without state management
- `handleLogin()` in `appStore.ts` - State management without API calls
- `useAuthentication()` hook - Complex logic mixing UI and state
- Multiple places setting `isAuthenticated` - Causing confusion and bugs

## ✨ **New Centralized System**

### **1. AuthService (`/services/authService.ts`)**

- **Single source** for all authentication API calls
- Handles tokens automatically
- Clean, focused responsibility

```typescript
import { authService } from "@/services/authService";

// All auth API operations through one service
const result = await authService.signIn({ email, password });
await authService.signOut();
```

### **2. AuthStore (`/stores/authStore.ts`)**

- **Single source of truth** for authentication state
- Combines API calls with state management
- **Integrated token management** with automatic refresh
- Handles navigation and club data loading
- Persistent state with Zustand

```typescript
import { useAuth } from "@/stores/authStore";

const auth = useAuth();
// All auth state and actions in one place
auth.signIn(credentials);
auth.signOut();
console.log(auth.isAuthenticated, auth.user);

// Token management built-in
console.log(auth.hasToken, auth.tokenExpiresInMinutes);
await auth.refreshToken();
```

### **3. Token Management (`/api/secureAuth.ts` + `/hooks/useTokenManager.ts`)**

- **Sophisticated token management** with multiple storage strategies
- **Automatic token refresh** with configurable intervals
- **JWT parsing and expiration handling**
- **Security best practices** (HTTPS warnings, secure storage)

```typescript
import { useTokenManager } from "@/hooks/useTokenManager";

const tokenManager = useTokenManager();
// Advanced token operations
console.log(tokenManager.tokenExpiresInMinutes);
console.log(tokenManager.getTokenClaims());
tokenManager.startAutoRefresh();
```

### **4. Simplified Hook (`/hooks/useSimpleAuthentication.ts`)**

- **Single hook** for authentication UI
- Clean separation of concerns
- Easy to use in forms

```typescript
import { useSimpleAuthentication } from '@/hooks/useSimpleAuthentication';

const auth = useSimpleAuthentication();
// UI state and handlers
<form onSubmit={auth.handleSignIn}>
```

## 🔄 **Migration Path**

### **For Components Using Authentication:**

```typescript
// OLD (multiple imports, confusion)
import { useAppStore } from "@/store/appStore";
import { signIn } from "@/modules/authentication/actions";
const { user, isAuthenticated, handleLogin } = useAppStore();

// NEW (single import, clear)
import { useAuth } from "@/stores/authStore";
const auth = useAuth();
// auth.user, auth.isAuthenticated, auth.signIn()
```

### **For Authentication Forms:**

```typescript
// OLD (complex hook)
import { useAuthentication } from "@/modules/authentication/hooks";

// NEW (simple hook)
import { useSimpleAuthentication } from "@/hooks/useSimpleAuthentication";
```

## 📋 **Benefits**

1. **Single Source of Truth** - Authentication state lives in one place
2. **Clear Separation** - API, state, and UI concerns are separated
3. **No Duplication** - One way to do authentication operations
4. **Easier Testing** - Focused, single-responsibility functions
5. **Better Developer Experience** - Clear, predictable API

## ⚠️ **Backward Compatibility**

All old functions are marked as deprecated but still work:

- `signIn()` action → Logs warning, calls `authService.signIn()`
- `handleLogin()` in appStore → Logs warning, still functions
- `useAuthentication()` hook → Logs warning, wraps new system

## 🚀 **Recommended Usage**

```typescript
// For auth state anywhere in the app
import { useAuth } from "@/stores/authStore";

// For auth UI (forms, modals)
import { useSimpleAuthentication } from "@/hooks/useSimpleAuthentication";

// For advanced token management
import {
  useTokenManager,
  useTokenExpirationWarning,
} from "@/hooks/useTokenManager";

// For direct API calls (rare)
import { authService } from "@/services/authService";
```

### **Token Management Features:**

#### **Automatic Token Refresh:**

```typescript
const auth = useAuth();
// Automatically starts proactive refresh on login
// Stops on logout
// Configurable refresh intervals and expiry buffers
```

#### **Token Monitoring:**

```typescript
const tokenManager = useTokenManager();

// Real-time token state
console.log(`Token expires in ${tokenManager.tokenExpiresInMinutes} minutes`);
console.log("Token expiring soon?", tokenManager.isTokenExpiringSoon);

// Token utilities
const claims = tokenManager.getTokenClaims();
const isValid = tokenManager.isTokenValid();
```

#### **Expiration Warnings:**

```typescript
const { shouldShowWarning, minutesUntilExpiry } = useTokenExpirationWarning(5);

if (shouldShowWarning) {
  toast.warning(`Session expires in ${minutesUntilExpiry} minutes`);
}
```

#### **Storage Strategies:**

- **localStorage** (default) - Persistent across browser sessions
- **sessionStorage** - Cleared when tab closes
- **memory** - Cleared on page refresh
- **httpOnly** - Server-only cookies (future enhancement)

## 🔮 **Future Improvements**

1. Add proper email verification flow
2. Implement Google OAuth integration
3. Add password reset functionality
4. Add httpOnly cookie support for enhanced security
5. Add token blacklisting on logout
6. Add session activity monitoring
7. Add device management (login from multiple devices)
8. Remove all deprecated code after migration

## 🛡️ **Security Features**

### **Current Security Measures:**

- ✅ **JWT Token Management** - Secure token parsing and validation
- ✅ **Automatic Token Refresh** - Prevents session expiration
- ✅ **Configurable Storage** - Multiple storage strategies for different security needs
- ✅ **Expiration Monitoring** - Real-time token expiry tracking
- ✅ **HTTPS Warnings** - Alerts in insecure contexts
- ✅ **Token Clearing** - Automatic cleanup on logout

### **Token Lifecycle:**

1. **Login** → Tokens stored securely + automatic refresh starts
2. **API Calls** → Tokens attached automatically via interceptors
3. **Expiry Detection** → Proactive refresh before expiration
4. **Refresh Failure** → Automatic logout + state cleanup
5. **Logout** → Tokens cleared + refresh stopped

---

**Result: Clean, understandable authentication with no duplicate code! 🎉**
