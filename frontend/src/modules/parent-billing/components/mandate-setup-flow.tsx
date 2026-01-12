import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Shield, ExternalLink, Loader2 } from "lucide-react";

interface MandateSetupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetup: (clubId: number, scheme: "bacs" | "sepa_core" | "ach") => Promise<void>;
  clubs: { id: number; name: string }[];
  isLoading?: boolean;
}

export function MandateSetupFlow({
  open,
  onOpenChange,
  onSetup,
  clubs,
  isLoading = false,
}: MandateSetupFlowProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [scheme, setScheme] = useState<"bacs" | "sepa_core" | "ach">("bacs");
  const [step, setStep] = useState<"select" | "confirm" | "redirect">("select");

  const handleSetup = async () => {
    if (!selectedClubId) return;
    setStep("redirect");
    await onSetup(parseInt(selectedClubId), scheme);
  };

  const handleClose = () => {
    setStep("select");
    setSelectedClubId("");
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

        {step === "select" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Club</label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Scheme</label>
              <Select
                value={scheme}
                onValueChange={(v) => setScheme(v as "bacs" | "sepa_core" | "ach")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bacs">BACS (UK)</SelectItem>
                  <SelectItem value="sepa_core">SEPA (Europe)</SelectItem>
                  <SelectItem value="ach">ACH (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You'll be redirected to our secure payment partner to authorize the
                Direct Debit. Your bank details are never stored on our servers.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!selectedClubId}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Club</span>
                <span className="font-medium">
                  {clubs.find((c) => c.id.toString() === selectedClubId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Type</span>
                <span className="font-medium">
                  {scheme === "bacs"
                    ? "Direct Debit (UK)"
                    : scheme === "sepa_core"
                    ? "SEPA Direct Debit"
                    : "ACH Debit"}
                </span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">By continuing, you agree to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Authorize automatic payments from your bank account</li>
                <li>
                  Receive advance notice before each payment is collected
                </li>
                <li>
                  The Direct Debit Guarantee protects your rights
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
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
