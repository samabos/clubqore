import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { ForgotPasswordFormProps } from "../types";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand";

export function ForgotPasswordForm({
  forgotEmail,
  setForgotEmail,
  isLoading,
  error,
  onForgotPassword,
  onSwitchToSignIn,
}: ForgotPasswordFormProps) {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <Button
          variant="ghost"
          className="flex items-center justify-center mb-4 p-0 h-auto hover:bg-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Logo variant="full" size="sm" />
        </Button>
        <CardTitle className="text-xl text-gray-900">Reset Password</CardTitle>
        <CardDescription className="text-gray-600">
          Enter your email address and we'll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onForgotPassword} className="space-y-4">
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
            onClick={onSwitchToSignIn}
            className="text-primary hover:text-primary/80 p-0 h-auto"
          >
            ← Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
