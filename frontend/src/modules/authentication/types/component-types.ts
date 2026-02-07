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
  SignInData,
  SimpleSignUpData,
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
  SignInData,
  SimpleSignUpData,
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
  registeredEmail?: string;
  onResendVerification?: () => Promise<void>;
}

export interface ForgotPasswordFormProps {
  forgotEmail: string;
  setForgotEmail: (email: string) => void;
  isLoading: boolean;
  error: string | null;
  onForgotPassword: (e: React.FormEvent) => void;
  onSwitchToSignIn: () => void;
}
