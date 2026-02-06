import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateOfBirthInput } from "@/components/ui/date-of-birth-input";
import { AddressInput } from "@/components/ui/address-input";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { updateChildDetails } from "../actions/parent-children-actions";
import type { ChildDetailData } from "../types";
import type { Address } from "@/types/common";
import { normalizeAddress } from "@/types/common";

interface EditChildDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  child: ChildDetailData;
}

interface ChildFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  medicalInfo: string;
  emergencyContact: string;
  phone: string;
  address: Address | null;
}

const POSITIONS = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
  "Winger",
  "Striker",
  "Center Back",
  "Full Back",
  "Defensive Midfielder",
  "Attacking Midfielder",
  "Other",
];

export function EditChildDialog({
  open,
  onClose,
  onSuccess,
  child,
}: EditChildDialogProps) {
  const [formData, setFormData] = useState<ChildFormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    position: "",
    medicalInfo: "",
    emergencyContact: "",
    phone: "",
    address: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  // Initialize form with child data when dialog opens
  useEffect(() => {
    if (open && child) {
      setFormData({
        firstName: child.firstName || "",
        lastName: child.lastName || "",
        dateOfBirth: child.dateOfBirth || "",
        position: child.position || "",
        medicalInfo: child.medicalInfo || "",
        emergencyContact: child.emergencyContact || "",
        phone: child.phone || "",
        address: normalizeAddress(child.address),
      });
    }
  }, [open, child]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (dobError) {
      toast.error("Please fix date of birth error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date to YYYY-MM-DD for backend
      const formattedDate = formData.dateOfBirth
        ? new Date(formData.dateOfBirth).toISOString().split('T')[0]
        : formData.dateOfBirth;

      await updateChildDetails(child.id.toString(), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formattedDate,
        position: formData.position || null,
        medicalInfo: formData.medicalInfo || null,
        emergencyContact: formData.emergencyContact || null,
        phone: formData.phone || null,
        address: formData.address ? JSON.stringify(formData.address) : null,
      });

      toast.success("Child information updated successfully!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error updating child:", error);
      const message = error instanceof Error ? error.message : "Failed to update child information";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit Child Information
          </DialogTitle>
          <DialogDescription>
            Update {child.firstName}'s profile information. All changes will be
            saved to their record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <DateOfBirthInput
              value={formData.dateOfBirth}
              onChange={(value) =>
                setFormData({ ...formData, dateOfBirth: value })
              }
              onError={setDobError}
              disabled={isSubmitting}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="e.g., 07123 456789"
              />
            </div>

            <AddressInput
              value={formData.address}
              onChange={(address) =>
                setFormData({ ...formData, address })
              }
              disabled={isSubmitting}
              showManualEntry={true}
            />
          </div>

          {/* Medical & Emergency Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Medical & Emergency Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="medicalInfo">Medical Conditions / Allergies</Label>
              <Textarea
                id="medicalInfo"
                value={formData.medicalInfo}
                onChange={(e) =>
                  setFormData({ ...formData, medicalInfo: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="e.g., Asthma, Peanut allergy, etc."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Textarea
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact: e.target.value })
                }
                disabled={isSubmitting}
                placeholder="Name and phone number of emergency contact"
                rows={2}
              />
            </div>
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
              disabled={isSubmitting || !!dobError}
              className="gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
