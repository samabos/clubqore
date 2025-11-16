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
//import { Separator } from "../ui/separator";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { SignUpFormProps, SimpleSignUpData } from "../types";
import { useNavigate } from "react-router-dom";

export function SignUpForm({
  signUpData,
  setSignUpData,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isLoading,
  error,
  onSignUp,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-2xl rounded-2xl">
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
          Create Club Account
        </CardTitle>
        <CardDescription className="text-gray-600">
          Join as a club manager to start managing your football club
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sign Up
        <Button
          type="button"
          variant="outline"
          onClick={onGoogleAuth}
          disabled={isLoading}
          className="w-full rounded-xl border-gray-200 hover:border-gray-300 py-3"
        >
          <Chrome className="w-5 h-5 mr-3" />
          {isLoading
            ? "Creating club manager account with Google..."
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
 */}
        <form onSubmit={onSignUp} className="space-y-4">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignUpData((prev: SimpleSignUpData) => ({
                    ...prev,
                    email: e.target.value,
                  }))
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignUpData((prev: SimpleSignUpData) => ({
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignUpData((prev: SimpleSignUpData) => ({
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
            {isLoading
              ? "Creating club manager account..."
              : "Create Club Manager Account"}
          </Button>
        </form>
        {/** 
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Club Manager Signup
              </h4>
              <p className="text-sm text-blue-800">
                After creating your account, we'll help you set up your club
                profile and configure your club management settings.
              </p>
            </div>
          </div>
        </div>*/}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToSignIn}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Sign in
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
