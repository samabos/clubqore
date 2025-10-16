import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Mail, CheckCircle } from "lucide-react";
import { AuthUser, SimpleSignUpData } from "../../types/auth";
import { useNavigate } from "react-router-dom";

interface EmailVerificationFormProps {
  pendingUser?: AuthUser;
  signUpData: SimpleSignUpData;
  verificationSent: boolean;
  isLoading: boolean;
  error: string | null;
  onResendVerification: () => void;
  onEmailVerificationComplete: () => void;
  onSwitchToSignUp: () => void;
}

export function EmailVerificationForm({
  pendingUser,
  signUpData,
  verificationSent,
  isLoading,
  error,
  onResendVerification,
  onEmailVerificationComplete,
  onSwitchToSignUp,
}: EmailVerificationFormProps) {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <Button
          variant="ghost"
          className="flex items-center justify-center gap-3 mb-4 p-0 h-auto hover:bg-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClubQore</h1>
          </div>
        </Button>
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
            onClick={onResendVerification}
            disabled={isLoading}
            className="w-full rounded-xl border-gray-200 hover:border-gray-300 py-3"
          >
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>

          <Button
            type="button"
            onClick={onEmailVerificationComplete}
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
            onClick={onSwitchToSignUp}
            className="text-primary hover:text-primary/80 p-0 h-auto"
          >
            ← Back to Sign Up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
