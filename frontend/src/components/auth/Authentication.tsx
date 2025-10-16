import { useAuthentication } from "../../hooks/useAuthentication";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { EmailVerificationForm } from "./EmailVerificationForm";
import { AuthUser } from "../../types/auth";

interface AuthenticationProps {
  onAuth?: (user: AuthUser) => void;
}

export function Authentication({ onAuth }: AuthenticationProps) {
  const auth = useAuthentication({ onAuth });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          />
        )}

        {auth.authMode === "signup" && (
          <SignUpForm
            signUpData={auth.signUpData}
            setSignUpData={auth.setSignUpData}
            showPassword={auth.showPassword}
            setShowPassword={auth.setShowPassword}
            showConfirmPassword={auth.showConfirmPassword}
            setShowConfirmPassword={auth.setShowConfirmPassword}
            isLoading={auth.isLoading}
            error={auth.error}
            onSignUp={auth.handleSignUp}
            onGoogleAuth={auth.handleGoogleAuth}
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

        {auth.authMode === "email-verification" && (
          <EmailVerificationForm
            pendingUser={auth.pendingUser}
            signUpData={auth.signUpData}
            verificationSent={auth.verificationSent}
            isLoading={auth.isLoading}
            error={auth.error}
            onResendVerification={auth.handleResendVerification}
            onEmailVerificationComplete={auth.handleEmailVerificationComplete}
            onSwitchToSignUp={auth.switchToSignUp}
          />
        )}
      </div>
    </div>
  );
}
