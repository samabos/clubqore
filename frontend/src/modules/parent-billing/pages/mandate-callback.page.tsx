import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/api/base";

export function MandateCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // Prevent double-call in React strict mode
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    const completeMandateSetup = async () => {
      const state = searchParams.get("state");
      const callbackStatus = searchParams.get("status");

      // Check if user cancelled
      if (callbackStatus === "cancelled") {
        setStatus("error");
        setMessage("Direct Debit setup was cancelled.");
        return;
      }

      if (!state) {
        setStatus("error");
        setMessage("Invalid callback - missing state parameter");
        return;
      }

      try {
        const response = await apiClient(
          `/parent/payment-methods/mandate/complete?state=${encodeURIComponent(state)}`
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage("Your Direct Debit has been set up successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to complete mandate setup");
        }
      } catch (error: unknown) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "An unexpected error occurred");
      }
    };

    completeMandateSetup();
  }, [searchParams]);

  const handleContinue = () => {
    navigate("/app/parent/payment-methods");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing Setup...
              </h2>
              <p className="text-gray-600">
                Please wait while we finalize your Direct Debit mandate.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Setup Complete!
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={handleContinue} className="w-full">
                Continue to Payment Methods
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Setup Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                Back to Payment Methods
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MandateCallbackPage;
