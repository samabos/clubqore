import { useState } from 'react';
import { useAuth } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { authToasts } from '@/utils/toast';
import { AuthUser, SignInData, SimpleSignUpData } from '@/types/auth';

export type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'email-verification';

export interface UseSimpleAuthenticationProps {
  onAuth?: (user: AuthUser) => void;
}

export interface UseSimpleAuthenticationReturn {
  // State
  authMode: AuthMode;
  showPassword: boolean;
  showConfirmPassword: boolean;
  signInData: SignInData;
  signUpData: SimpleSignUpData;
  forgotEmail: string;

  // State setters
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setSignInData: React.Dispatch<React.SetStateAction<SignInData>>;
  setSignUpData: React.Dispatch<React.SetStateAction<SimpleSignUpData>>;
  setForgotEmail: React.Dispatch<React.SetStateAction<string>>;

  // Handlers
  handleSignIn: (e: React.FormEvent) => Promise<void>;
  handleSignUp: (e: React.FormEvent) => Promise<void>;
  handleGoogleAuth: () => void;
  handleForgotPassword: (e: React.FormEvent) => Promise<void>;
  handleResendVerification: () => Promise<void>;
  handleEmailVerificationComplete: () => void;

  // Mode switching
  switchToSignIn: () => void;
  switchToSignUp: () => void;
  switchToForgotPassword: () => void;
  switchToEmailVerification: () => void;

  // Email verification state
  pendingUser: AuthUser | undefined;
  verificationSent: boolean;

  // Auth state from store
  isLoading: boolean;
  error: string | null;
  user: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
}

/**
 * Simplified authentication hook
 * This is the SINGLE hook that should be used for all authentication UI
 */
export function useSimpleAuthentication(props: UseSimpleAuthenticationProps = {}): UseSimpleAuthenticationReturn {
  const { onAuth } = props;
  const auth = useAuth();

  // Local UI state
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signInData, setSignInData] = useState<SignInData>({
    email: '',
    password: '',
  });
  const [signUpData, setSignUpData] = useState<SimpleSignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');

  // Auth handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    auth.clearError();

    try {
      await auth.signIn(signInData);
      authToasts.loginSuccess();
      
      // Call the onAuth callback if provided
      if (onAuth && auth.user) {
        onAuth(auth.user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      authToasts.loginError(message);
      throw error;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    auth.clearError();

    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      const message = 'Passwords do not match';
      authToasts.signupError(message);
      throw new Error(message);
    }

    try {
      await auth.signUp(signUpData);
      authToasts.signupSuccess();
      
      // Call the onAuth callback if provided
      if (onAuth && auth.user) {
        onAuth(auth.user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      authToasts.signupError(message);
      throw error;
    }
  };

  const handleGoogleAuth = () => {
    auth.clearError();
    // TODO: Implement Google auth through authService
    console.log('Google auth not yet implemented');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    auth.clearError();

    try {
      await authService.requestPasswordReset(forgotEmail);
      authToasts.passwordResetSent();
      setAuthMode('signin');
      setForgotEmail(''); // Clear email field
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      authToasts.passwordResetError(message);
      throw error;
    }
  };

  // Mode switching
  const switchToSignIn = () => {
    setAuthMode('signin');
    auth.clearError();
  };

  const switchToSignUp = () => {
    setAuthMode('signup');
    auth.clearError();
  };

  const switchToForgotPassword = () => {
    setAuthMode('forgot-password');
    auth.clearError();
  };

  const switchToEmailVerification = () => {
    setAuthMode('email-verification');
    auth.clearError();
  };

  // Email verification handlers (simplified implementation)
  const handleResendVerification = async () => {
    // TODO: Implement email resend functionality if needed
    console.log('Resend verification not implemented yet');
  };

  const handleEmailVerificationComplete = () => {
    // TODO: Implement email verification completion if needed
    console.log('Email verification complete not implemented yet');
  };

  return {
    // State
    authMode,
    showPassword,
    showConfirmPassword,
    signInData,
    signUpData,
    forgotEmail,

    // State setters
    setAuthMode,
    setShowPassword,
    setShowConfirmPassword,
    setSignInData,
    setSignUpData,
    setForgotEmail,

    // Handlers
    handleSignIn,
    handleSignUp,
    handleGoogleAuth,
    handleForgotPassword,
    handleResendVerification,
    handleEmailVerificationComplete,

    // Mode switching
    switchToSignIn,
    switchToSignUp,
    switchToForgotPassword,
    switchToEmailVerification,

    // Email verification state (simplified)
    pendingUser: auth.user ?? undefined, // Use current user as pending user for now
    verificationSent: false, // Simplified - always false for now

    // Auth state from store
    isLoading: auth.isLoading,
    error: auth.error,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
  };
}