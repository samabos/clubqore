// Re-export the stores for direct use
export { useAppStore } from '../stores/appStore';

// NEW: Centralized authentication system
export { useAuth } from '../stores/authStore';
export { useSimpleAuthentication } from './useSimpleAuthentication';
export { useTokenManager, useTokenExpirationWarning } from './useTokenManager';

// DEPRECATED: Legacy authentication hooks have been removed
// Use the centralized auth system: useAuth() from @/stores/authStore

// Re-export other hooks
export { useNavigationSetup } from './useNavigationSetup';
export { useOnboarding } from './useOnboarding';
