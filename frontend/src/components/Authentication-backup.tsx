import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, authToasts } from "../utils/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  AuthMode,
  SimpleSignUpData,
  SignInData,
  AuthUser,
} from "../types/auth";
import { useAppStore } from "../store";
import {
  authAPI,
  googleAuthAPI,
  passwordResetAPI,
  emailVerificationAPI,
} from "../api/auth";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Chrome,
  CheckCircle,
} from "lucide-react";

interface AuthenticationProps {
  onAuth?: (user: any) => void;
  onBackToLanding?: () => void;
}

export function Authentication({
  onAuth,
  onBackToLanding,
}: AuthenticationProps) {
  const navigate = useNavigate();
  const { handleLogin } = useAppStore();
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | undefined>(); // User waiting for email verification
  const [verificationSent, setVerificationSent] = useState(false);

  const [signInData, setSignInData] = useState<SignInData>({
    email: "",
    password: "",
  });

  // Helper functions for navigation
  const handleAuthSuccess = (user: any) => {
    // Check if user needs onboarding
    if (!user.isOnboarded) {
      if (onAuth) {
        onAuth(user);
      } else {
        handleLogin(user);
        navigate("/onboarding");
      }
    } else {
      if (onAuth) {
        onAuth(user);
      } else {
        handleLogin(user);
        navigate("/app");
      }
    }
  };

  const handleBackToLandingClick = () => {
    if (onBackToLanding) {
      onBackToLanding();
    } else {
      navigate("/");
    }
  };

  const [signUpData, setSignUpData] = useState<SimpleSignUpData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await authAPI.login(signInData);

      // Check if email is verified
      if (!user.emailVerified) {
        setPendingUser(user);
        setAuthMode("email-verification");
        return;
      }

      handleAuthSuccess(user);
      authToasts.loginSuccess();
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

    if (signUpData.password !== signUpData.confirmPassword) {
      const errorMessage = "Passwords do not match";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { user } = await authAPI.register(signUpData);

      // Store user for after email verification
      setPendingUser(user);

      // Send email verification
      await emailVerificationAPI.sendVerification();
      setVerificationSent(true);
      setAuthMode("email-verification");
      authToasts.signupSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      authToasts.signupError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Redirect to backend Google OAuth
      googleAuthAPI.initiateGoogleAuth();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google authentication failed";
      setError(errorMessage);
      toast.error("Authentication failed", { description: errorMessage });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await passwordResetAPI.requestReset(forgotEmail);
      setAuthMode("signin");
      authToasts.passwordResetSent();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Password reset failed";
      setError(errorMessage);
      authToasts.passwordResetError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const email = pendingUser?.email || signUpData.email;
      if (!email) {
        throw new Error("No email address available");
      }

      let response = await emailVerificationAPI.resendVerification(email);
      setVerificationSent(true);
      console.log(response);

      if (response == 201) {
        console.log(pendingUser?.email);
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
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to send verification email";
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

  const renderSignIn = () => (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClubQore</h1>
          </div>
        </div>
        <CardTitle className="text-xl text-gray-900">Welcome Back</CardTitle>
        <CardDescription className="text-gray-600">
          Sign in to your ClubQore account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full rounded-xl border-gray-200 hover:border-gray-300 py-3"
        >
          <Chrome className="w-5 h-5 mr-3" />
          {isLoading ? "Signing in with Google..." : "Continue with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={signInData.email}
                onChange={(e) =>
                  setSignInData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={signInData.password}
                onChange={(e) =>
                  setSignInData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="pl-10 pr-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Enter your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-0 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="rounded" />
              <Label htmlFor="remember" className="text-sm">
                Remember me
              </Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAuthMode("forgot-password")}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Forgot password?
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl gradient-primary text-white hover:opacity-90 py-3"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAuthMode("signup")}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Sign up
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSignUp = () => (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClubQore</h1>
          </div>
        </div>
        <CardTitle className="text-xl text-gray-900">Create Account</CardTitle>
        <CardDescription className="text-gray-600">
          Join the future of football club management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sign Up */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full rounded-xl border-gray-200 hover:border-gray-300 py-3"
        >
          <Chrome className="w-5 h-5 mr-3" />
          {isLoading
            ? "Creating account with Google..."
            : "Continue with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={signUpData.email}
                onChange={(e) =>
                  setSignUpData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={signUpData.password}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="pl-10 pr-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Create a password"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-0 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={signUpData.confirmPassword}
                onChange={(e) =>
                  setSignUpData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="pl-10 pr-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Confirm your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-0 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              className="rounded mt-1"
              required
            />
            <Label htmlFor="terms" className="text-sm leading-5">
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl gradient-primary text-white hover:opacity-90 py-3"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">What's next?</h4>
              <p className="text-sm text-blue-800">
                After creating your account, we'll help you set up your profile
                and choose whether you're joining as a club, member, or parent.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAuthMode("signin")}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Sign in
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderForgotPassword = () => (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClubQore</h1>
          </div>
        </div>
        <CardTitle className="text-xl text-gray-900">Reset Password</CardTitle>
        <CardDescription className="text-gray-600">
          Enter your email address and we'll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="forgotEmail">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="forgotEmail"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl gradient-primary text-white hover:opacity-90 py-3"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAuthMode("signin")}
            className="text-primary hover:text-primary/80 p-0 h-auto"
          >
            ← Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmailVerification = () => (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClubQore</h1>
          </div>
        </div>
        <CardTitle className="text-xl text-gray-900">
          Verify Your Email
        </CardTitle>
        <CardDescription className="text-gray-600">
          We've sent a verification link to{" "}
          {pendingUser?.email || signUpData.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {verificationSent && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Verification email sent successfully!
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Check your email
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Click the verification link in your email to activate your
                account. The link will expire in 24 hours.
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>
                  • Check your spam/junk folder if you don't see the email
                </li>
                <li>• Make sure the email address is correct</li>
                <li>
                  • The verification link will redirect you back to ClubQore
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendVerification}
            disabled={isLoading}
            className="w-full rounded-xl border-gray-200 hover:border-gray-300 py-3"
          >
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>

          <Button
            type="button"
            onClick={handleEmailVerificationComplete}
            className="w-full rounded-xl gradient-primary text-white hover:opacity-90 py-3"
          >
            I've Verified My Email
          </Button>
        </div>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setAuthMode("signup");
              setPendingUser(undefined);
              setVerificationSent(false);
            }}
            className="text-primary hover:text-primary/80 p-0 h-auto"
          >
            ← Back to Sign Up
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={handleBackToLandingClick}
          className="mb-6 text-gray-600 hover:text-gray-900 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Landing
        </Button>

        {authMode === "signin" && renderSignIn()}
        {authMode === "signup" && renderSignUp()}
        {authMode === "forgot-password" && renderForgotPassword()}
        {authMode === "email-verification" && renderEmailVerification()}
      </div>
    </div>
  );
}
