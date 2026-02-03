import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { createParentInvite } from "../actions/parent-invite-actions";

interface InviteParentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clubId?: number;
}

export function InviteParentDialog({
  open,
  onClose,
  onSuccess,
  clubId,
}: InviteParentDialogProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clubId) {
      toast.error("Club information is missing");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await createParentInvite({
        clubId,
        inviteeEmail: email,
        inviteeFirstName: firstName || undefined,
        inviteeLastName: lastName || undefined,
      });

      // Reset form
      setEmail("");
      setFirstName("");
      setLastName("");

      onSuccess();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setEmail("");
      setFirstName("");
      setLastName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invite Parent to Register
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a parent. They'll receive a link to complete
            their registration and add their children to the club.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              The parent will receive an invitation link at this address
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="given-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name (Optional)</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-900">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Parent receives an email with a registration link</li>
              <li>Link is valid for 7 days</li>
              <li>Parent completes their profile and adds their children</li>
              <li>Account is created automatically</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
