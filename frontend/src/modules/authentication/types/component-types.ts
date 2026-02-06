// Import auth types
import type {
  AuthMode,
  AccountType,
  UserRole,
  AuthUser,
  UserProfile,
  ChildInfo,
  UserPreferences,
  UserRoleInfo,
  UserAccount,
  UserChild,
  SimpleSignUpData,
  SignInData,
  GoogleAuthResponse,
  UserRolesResponse,
  UpdateRoleRequest,
  AssignRoleRequest
} from "../../../types/auth";

// Re-export auth types for consistency
export type {
  AuthMode,
  AccountType,
  UserRole,
  AuthUser,
  UserProfile,
  ChildInfo,
  UserPreferences,
  UserRoleInfo,
  UserAccount,
  UserChild,
  SimpleSignUpData,
  SignInData,
  GoogleAuthResponse,
  UserRolesResponse,
  UpdateRoleRequest,
  AssignRoleRequest
};

// Component Props Types
export interface AuthenticationProps {
  onAuth?: (user: AuthUser) => void;
}

export interface SignInFormProps {
  signInData: SignInData;
  setSignInData: React.Dispatch<React.SetStateAction<SignInData>>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLoading: boolean;
  error: string | null;
  onSignIn: (e: React.FormEvent) => void;
  onGoogleAuth: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export interface SignUpFormProps {
  signUpData: SimpleSignUpData;
  setSignUpData: React.Dispatch<React.SetStateAction<SimpleSignUpData>>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  isLoading: boolean;
  error: string | null;
  onSignUp: (e: React.FormEvent) => void;
  onGoogleAuth: () => void;
  onSwitchToSignIn: () => void;
}

export interface ForgotPasswordFormProps {
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  isLoading: boolean;
  error: string | null;
  onForgotPassword: (e: React.FormEvent) => void;
  onSwitchToSignIn: () => void;
}

export interface EmailVerificationFormProps {
  pendingUser: AuthUser | undefined;
  signUpData: SimpleSignUpData;
  verificationSent: boolean;
  isLoading: boolean;
  error: string | null;
  onResendVerification: () => void;
  onEmailVerificationComplete: () => void;
  onSwitchToSignUp: () => void;
}
