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
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Chrome } from "lucide-react";
import { SignInFormProps, SignInData } from "../types";
import { useNavigate } from "react-router-dom";

export function SignInForm({
  signInData,
  setSignInData,
  showPassword,
  setShowPassword,
  isLoading,
  error,
  onSignIn,
  onGoogleAuth,
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}: SignInFormProps) {
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
          onClick={onGoogleAuth}
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

        <form onSubmit={onSignIn} className="space-y-4">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignInData((prev: SignInData) => ({
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
                value={signInData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSignInData((prev: SignInData) => ({
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
              onClick={onSwitchToForgotPassword}
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
              onClick={onSwitchToSignUp}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Sign up
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
