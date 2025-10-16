import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { CheckCircle, Mail, Key, ArrowRight } from "lucide-react";

interface RegistrationSuccessProps {
  type: "member" | "parent";
  name: string;
  email: string;
  isDirect?: boolean;
  onContinue: () => void;
  onRegisterAnother?: () => void;
}

export function RegistrationSuccess({
  type,
  name,
  email,
  isDirect = false,
  onContinue,
  onRegisterAnother,
}: RegistrationSuccessProps) {
  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
          Registration Successful!
        </CardTitle>

        <CardDescription className="text-gray-600 mb-6 text-lg">
          {isDirect
            ? `${name} has been successfully registered as a ${
                type === "member" ? "player" : "parent/guardian"
              }.`
            : `Welcome to the club! Your ${
                type === "member" ? "player" : "parent/guardian"
              } registration is complete.`}
        </CardDescription>

        {isDirect && (
          <div className="bg-white rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Account Details Sent
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <p>
                  An email has been sent to <strong>{email}</strong> with login
                  credentials
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <p>
                  They can log in using their email and the temporary password
                  provided
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <p>
                  They'll be prompted to change their password on first login
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onRegisterAnother && (
            <Button
              variant="outline"
              onClick={onRegisterAnother}
              className="rounded-xl px-6 py-3 border-gray-200 hover:border-primary hover:text-primary"
            >
              Register Another {type === "member" ? "Player" : "Parent"}
            </Button>
          )}

          <Button
            onClick={onContinue}
            className="rounded-xl px-6 py-3 gradient-primary text-white hover:opacity-90"
          >
            {isDirect ? "Back to Member Management" : "Continue to Dashboard"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {!isDirect && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 justify-center text-blue-700">
              <Key className="w-4 h-4" />
              <span className="text-sm font-medium">
                You can now access all club features!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
