import { Mail, CheckCircle } from "lucide-react";
import { useAuth } from "../../stores/authStore";

interface OnboardingCompleteProps {
  selectedRole: string | null;
}

export function OnboardingComplete({ selectedRole: _selectedRole }: OnboardingCompleteProps) {
  const { user } = useAuth();

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto">
        <Mail className="w-10 h-10 text-blue-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600">
          We've sent a verification link to{" "}
          <span className="font-medium text-gray-900">{user?.email}</span>
        </p>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl text-left">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              Check your inbox
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Click the verification link in your email to activate your
              account. The link will expire in 24 hours.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your spam/junk folder if you don't see it</li>
              <li>• Make sure the email address is correct</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Once verified, you'll be redirected to your dashboard.
      </p>
    </div>
  );
}
