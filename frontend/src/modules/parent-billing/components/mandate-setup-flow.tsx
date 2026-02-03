import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Shield, ExternalLink, Loader2 } from "lucide-react";

interface MandateSetupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetup: (scheme: "bacs" | "sepa_core" | "ach") => Promise<void>;
  isLoading?: boolean;
}

export function MandateSetupFlow({
  open,
  onOpenChange,
  onSetup,
  isLoading = false,
}: MandateSetupFlowProps) {
  const [step, setStep] = useState<"confirm" | "redirect">("confirm");

  const handleSetup = async () => {
    setStep("redirect");
    await onSetup("bacs"); // Default to BACS (UK)
  };

  const handleClose = () => {
    setStep("confirm");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Set Up Direct Debit
          </DialogTitle>
          <DialogDescription>
            Set up a Direct Debit mandate to enable automatic subscription payments.
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" && (
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to our secure payment partner to authorize the
                Direct Debit. Your bank details are never stored on our servers.
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">By continuing, you agree to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Authorize automatic payments from your bank account</li>
                <li>Receive advance notice before each payment is collected</li>
                <li>The Direct Debit Guarantee protects your rights</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Authorize Direct Debit
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "redirect" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Redirecting to secure payment authorization...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
