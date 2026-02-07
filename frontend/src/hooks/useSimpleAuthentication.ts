import { useState } from 'react';
import { useAuth } from '@/stores/authStore';
import { authService, AuthError } from '@/services/authService';
import { authToasts } from '@/utils/toast';
import { AuthUser, SignInData, ClubManagerSignUpData } from '@/types/auth';

export type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'registration-success';

export interface UseSimpleAuthenticationProps {
  onAuth?: (user: AuthUser) => void;
}

export interface UseSimpleAuthenticationReturn {
  // State
  authMode: AuthMode;
  showPassword: boolean;
  showConfirmPassword: boolean;
  signInData: SignInData;
  signUpData: ClubManagerSignUpData;
  forgotEmail: string;
  registeredEmail: string;

  // State setters
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setSignInData: React.Dispatch<React.SetStateAction<SignInData>>;
  setSignUpData: React.Dispatch<React.SetStateAction<ClubManagerSignUpData>>;
  setForgotEmail: React.Dispatch<React.SetStateAction<string>>;

  // Handlers
  handleSignIn: (e: React.FormEvent) => Promise<void>;
  handleSignUp: (e: React.FormEvent) => Promise<void>;
  handleGoogleAuth: () => void;
  handleForgotPassword: (e: React.FormEvent) => Promise<void>;
  handleResendVerification: () => Promise<void>;

  // Mode switching
  switchToSignIn: () => void;
  switchToSignUp: () => void;
  switchToForgotPassword: () => void;

  // Auth state from store
  isLoading: boolean;
  error: string | null;
  user: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
}

/**
 * Simplified authentication hook for club manager registration
 * Supports single-page registration with email verification required
 */
export function useSimpleAuthentication(props: UseSimpleAuthenticationProps = {}): UseSimpleAuthenticationReturn {
  const { onAuth } = props;
  const auth = useAuth();

  // Local UI state
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [signInData, setSignInData] = useState<SignInData>({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState<ClubManagerSignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    clubName: '',
    clubAddress: { street: '', city: '', county: '', postcode: '', country: 'England' },
  });

  const [forgotEmail, setForgotEmail] = useState('');

  // Clear error helper
  const clearError = () => {
    setLocalError(null);
    auth.clearError();
  };

  // Auth handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await auth.signIn(signInData);
      authToasts.loginSuccess();

      // Call the onAuth callback if provided
      if (onAuth && auth.user) {
        onAuth(auth.user);
      }
    } catch (error) {
      // Check for EMAIL_NOT_VERIFIED error
      if (error instanceof AuthError && error.code === 'EMAIL_NOT_VERIFIED') {
        setLocalError('Please verify your email before signing in. Check your inbox for the verification link.');
        setRegisteredEmail(signInData.email);
        authToasts.error('Email not verified. Please check your inbox.');
      } else {
        const message = error instanceof Error ? error.message : 'Sign in failed';
        setLocalError(message);
        authToasts.loginError(message);
      }
      throw error;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      const message = 'Passwords do not match';
      setLocalError(message);
      setLocalLoading(false);
      authToasts.signupError(message);
      return;
    }

    try {
      const result = await authService.signUpClubManager(signUpData);

      if (result.success) {
        // Store the registered email for resend functionality
        setRegisteredEmail(signUpData.email);
        // Switch to registration success view
        setAuthMode('registration-success');
        authToasts.success('Registration successful! Please check your email.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setLocalError(message);
      authToasts.signupError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    clearError();
    // Google auth not supported for club manager registration
    authToasts.error('Google sign-in is not available for club registration. Please use email.');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      await authService.requestPasswordReset(forgotEmail);
      authToasts.passwordResetSent();
      setAuthMode('signin');
      setForgotEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      setLocalError(message);
      authToasts.passwordResetError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) {
      authToasts.error('No email address to resend verification to.');
      return;
    }

    setLocalLoading(true);
    clearError();

    try {
      await authService.resendVerificationPublic(registeredEmail);
      authToasts.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      setLocalError(message);
      authToasts.error(message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Mode switching
  const switchToSignIn = () => {
    setAuthMode('signin');
    clearError();
  };

  const switchToSignUp = () => {
    setAuthMode('signup');
    clearError();
  };

  const switchToForgotPassword = () => {
    setAuthMode('forgot-password');
    clearError();
  };

  return {
    // State
    authMode,
    showPassword,
    showConfirmPassword,
    signInData,
    signUpData,
    forgotEmail,
    registeredEmail,

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

    // Mode switching
    switchToSignIn,
    switchToSignUp,
    switchToForgotPassword,

    // Auth state - combine local and store state
    isLoading: localLoading || auth.isLoading,
    error: localError || auth.error,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
  };
}
