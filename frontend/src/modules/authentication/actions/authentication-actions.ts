import { authService } from "@/api/authService";
import { SignInData, SimpleSignUpData, AuthUser } from "../types/component-types";

/**
 * DEPRECATED AUTHENTICATION ACTIONS
 * 
 * These functions are deprecated and kept only for backward compatibility.
 * 
 * NEW APPROACH: Use the centralized auth system instead:
 * - Import: import { useAuth } from "@/stores/authStore";
 * - Use: const auth = useAuth(); auth.signIn(credentials);
 * 
 * This ensures single source of truth and proper state management.
 */

// Sign in user - DEPRECATED: Use useAuth().signIn() instead
export const signIn = async (signInData: SignInData): Promise<{ user: AuthUser }> => {
  console.warn('⚠️  DEPRECATED: signIn() action is deprecated. Use useAuth().signIn() instead.');
  const result = await authService.signIn(signInData);
  return { user: result.user };
};

// Register new user - DEPRECATED: Use useAuth().signUp() instead  
export const register = async (signUpData: SimpleSignUpData): Promise<{ user: AuthUser }> => {
  console.warn('⚠️  DEPRECATED: register() action is deprecated. Use useAuth().signUp() instead.');
  const result = await authService.signUp(signUpData);
  return { user: result.user };
};

// Request password reset - DEPRECATED: Use authService.requestPasswordReset() instead
export const requestPasswordReset = async (email: string): Promise<void> => {
  console.warn('⚠️  DEPRECATED: requestPasswordReset() action is deprecated. Use authService.requestPasswordReset() instead.');
  return authService.requestPasswordReset(email);
};

// Resend email verification - DEPRECATED: Use authService.resendEmailVerification() instead
export const resendEmailVerification = async (email: string): Promise<number> => {
  console.warn('⚠️  DEPRECATED: resendEmailVerification() action is deprecated. Use authService.resendEmailVerification() instead.');
  return authService.resendEmailVerification(email);
};

// Initiate Google authentication - DEPRECATED: Use authService.initiateGoogleAuth() instead
export const initiateGoogleAuth = (): void => {
  console.warn('⚠️  DEPRECATED: initiateGoogleAuth() action is deprecated. Use authService.initiateGoogleAuth() instead.');
  authService.initiateGoogleAuth();
};

// Get current user - DEPRECATED: Use useAuth().getCurrentUser() instead
export const getCurrentUser = async (): Promise<AuthUser> => {
  console.warn('⚠️  DEPRECATED: getCurrentUser() action is deprecated. Use useAuth().getCurrentUser() instead.');
  return authService.getCurrentUser();
};

// Logout user - DEPRECATED: Use useAuth().signOut() instead
export const logout = async (): Promise<void> => {
  console.warn('⚠️  DEPRECATED: logout() action is deprecated. Use useAuth().signOut() instead.');
  return authService.logout();
};

// Refresh access token - DEPRECATED: Use authService.refreshToken() instead
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  console.warn('⚠️  DEPRECATED: refreshToken() action is deprecated. Use authService.refreshToken() instead.');
  return authService.refreshToken(refreshToken);
};
