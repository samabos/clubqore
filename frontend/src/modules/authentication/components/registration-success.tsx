import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand";

interface RegistrationSuccessProps {
  email: string;
  onResendVerification: () => Promise<void>;
  isLoading: boolean;
}

export function RegistrationSuccess({
  email,
  onResendVerification,
  isLoading,
}: RegistrationSuccessProps) {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <Button
          variant="ghost"
          className="flex items-center justify-center mb-4 p-0 h-auto hover:bg-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Logo variant="full" size="lg" />
        </Button>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-xl text-gray-900">Check Your Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <p className="text-gray-600">
          We've sent a verification link to{" "}
          <span className="font-semibold text-gray-900">{email}</span>
        </p>

        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-start gap-3 text-left">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>Come back here to sign in</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={onResendVerification}
            disabled={isLoading}
            className="w-full rounded-xl border-gray-200"
          >
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>

          <Button
            type="button"
            onClick={() => navigate("/auth")}
            className="w-full rounded-xl gradient-primary text-white hover:opacity-90"
          >
            Back to Sign In
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Check your spam folder if you don't see the email within a few minutes
        </p>
      </CardContent>
    </Card>
  );
}
