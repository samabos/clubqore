import { useEffect } from "react";
import { useSimpleAuthentication } from "../../../hooks/useSimpleAuthentication";
import { useNavigationSetup } from "../../../hooks/useNavigationSetup";
import { SignInForm } from "../components/sign-in-form";
import { ClubManagerSignUpForm } from "../components/club-manager-signup-form";
import { ForgotPasswordForm } from "../components/forgot-password-form";
import { RegistrationSuccess } from "../components/registration-success";
import { AuthenticationProps } from "../types";
import { toast } from "sonner";

export function Authentication({ onAuth }: AuthenticationProps) {
  // Set up navigation for auth store
  useNavigationSetup();

  const auth = useSimpleAuthentication({ onAuth });

  // Check for session expiry redirect and show toast
  useEffect(() => {
    const reason = sessionStorage.getItem('auth_redirect_reason');
    if (reason === 'session_expired') {
      toast.info('Session Expired', {
        description: 'Your session has ended. Please log in again to continue.',
      });
      sessionStorage.removeItem('auth_redirect_reason');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {auth.authMode === "signin" && (
          <SignInForm
            signInData={auth.signInData}
            setSignInData={auth.setSignInData}
            showPassword={auth.showPassword}
            setShowPassword={auth.setShowPassword}
            isLoading={auth.isLoading}
            error={auth.error}
            onSignIn={auth.handleSignIn}
            onGoogleAuth={auth.handleGoogleAuth}
            onSwitchToSignUp={auth.switchToSignUp}
            onSwitchToForgotPassword={auth.switchToForgotPassword}
            registeredEmail={auth.registeredEmail}
            onResendVerification={auth.handleResendVerification}
          />
        )}

        {auth.authMode === "signup" && (
          <ClubManagerSignUpForm
            formData={auth.signUpData}
            setFormData={auth.setSignUpData}
            isLoading={auth.isLoading}
            error={auth.error}
            onSubmit={auth.handleSignUp}
            onSwitchToSignIn={auth.switchToSignIn}
          />
        )}

        {auth.authMode === "forgot-password" && (
          <ForgotPasswordForm
            forgotEmail={auth.forgotEmail}
            setForgotEmail={auth.setForgotEmail}
            isLoading={auth.isLoading}
            error={auth.error}
            onForgotPassword={auth.handleForgotPassword}
            onSwitchToSignIn={auth.switchToSignIn}
          />
        )}

        {auth.authMode === "registration-success" && (
          <RegistrationSuccess
            email={auth.registeredEmail}
            onResendVerification={auth.handleResendVerification}
            isLoading={auth.isLoading}
          />
        )}
      </div>
    </div>
  );
}
