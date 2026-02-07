import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { emailVerificationAPI } from "../api/emailVerification";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { Button } from "./ui/button";

export function EmailVerificationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (verificationAttempted.current) {
      return;
    }

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    verificationAttempted.current = true;

    const verifyEmailToken = async () => {
      try {
        await emailVerificationAPI.verifyEmail(token);
        setStatus("success");
        setMessage("Email verified successfully! You can now sign in.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Email verification failed"
        );
      }
    };

    verifyEmailToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying your email...
                </h3>
                <p className="text-gray-600">
                  Please wait while we confirm your email address.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Verified!
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full rounded-xl gradient-primary text-white hover:opacity-90"
                >
                  Sign In
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/auth")}
                    className="w-full rounded-xl gradient-primary text-white hover:opacity-90"
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full rounded-xl border-gray-200 hover:border-gray-300"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
