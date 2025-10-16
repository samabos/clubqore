import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authToasts } from "../utils/toast";
import { useAppStore } from "../store";
import { getDefaultRouteByRole, getPrimaryRole } from "../utils/roleNavigation";
import {
  AuthMode,
  SimpleSignUpData,
  SignInData,
  AuthUser,
} from "../types/auth";
import {
  authAPI,
  googleAuthAPI,
  passwordResetAPI,
  emailVerificationAPI,
} from "../api/auth";

interface UseAuthenticationProps {
  onAuth?: (user: AuthUser) => void;
}

export function useAuthentication({ onAuth }: UseAuthenticationProps = {}) {
  const navigate = useNavigate();
  const { handleLogin } = useAppStore();
  
  // State management
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | undefined>();
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [signInData, setSignInData] = useState<SignInData>({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState<SimpleSignUpData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");

  // Helper functions
  const handleAuthSuccess = (user: AuthUser) => {
    if (!user.isOnboarded) {
      if (onAuth) {
        onAuth(user);
      } else {
        handleLogin(user);
        const userRole = getPrimaryRole(user);
        const defaultRoute = getDefaultRouteByRole(userRole);
        navigate(defaultRoute);
      }
    } else {
      if (onAuth) {
        onAuth(user);
      } else {
        handleLogin(user);
        // Navigate to role-specific dashboard
        const userRole = getPrimaryRole(user);
        const defaultRoute = getDefaultRouteByRole(userRole);
        navigate(defaultRoute);
      }
    }
  };

  // Auth handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { user } = await authAPI.login(signInData);
      if (!user.emailVerified) {
        setPendingUser(user);
        setAuthMode("email-verification");
        authToasts.emailVerificationSent();
      } else {
        authToasts.loginSuccess();
        handleAuthSuccess(user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      authToasts.loginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { user } = await authAPI.register(signUpData);
      if (!user.emailVerified) {
        setPendingUser(user);
        setAuthMode("email-verification");
        authToasts.signupSuccess();
      } else {
        authToasts.signupSuccess();
        handleAuthSuccess(user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      authToasts.signupError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);

    try {
      googleAuthAPI.initiateGoogleAuth();
      // Note: Google auth completion will be handled by callback
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Google authentication failed";
      setError(errorMessage);
      authToasts.loginError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await passwordResetAPI.requestReset(forgotEmail);
      authToasts.passwordResetSent();
      setAuthMode("signin");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
      setError(errorMessage);
      authToasts.passwordResetError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const email = pendingUser?.email || signUpData.email;
      if (!email) {
        throw new Error("No email address available");
      }

      const response = await emailVerificationAPI.resendVerification(email);
      setVerificationSent(true);

      if (response == 201) {
        authToasts.emailAlreadyVerified();
        handleEmailVerificationComplete();
        if (pendingUser && !pendingUser.isOnboarded) {
          navigate("/onboarding");
        } else {
          navigate("/app");
        }
      } else {
        authToasts.emailVerificationSent();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send verification email";
      setError(errorMessage);
      authToasts.emailVerificationError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerificationComplete = () => {
    if (pendingUser) {
      handleAuthSuccess(pendingUser);
    }
  };

  // Mode switching
  const switchToSignUp = () => {
    setAuthMode("signup");
    setError(null);
  };

  const switchToSignIn = () => {
    setAuthMode("signin");
    setError(null);
  };

  const switchToForgotPassword = () => {
    setAuthMode("forgot-password");
    setError(null);
  };

  const switchToEmailVerification = () => {
    setAuthMode("email-verification");
    setError(null);
  };

  return {
    // State
    authMode,
    showPassword,
    showConfirmPassword,
    isLoading,
    pendingUser,
    verificationSent,
    error,
    signInData,
    signUpData,
    forgotEmail,

    // Setters
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
    switchToSignUp,
    switchToSignIn,
    switchToForgotPassword,
    switchToEmailVerification,
  };
}
