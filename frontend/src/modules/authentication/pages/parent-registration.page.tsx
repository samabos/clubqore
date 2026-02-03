import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/ui/address-input";
import { DateOfBirthInput } from "@/components/ui/date-of-birth-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  getInviteDetails,
  completeInviteRegistration,
  type InviteValidationResult,
} from "@/modules/member/actions/parent-invite-actions";
import type { Address } from "@/types/common";

interface ChildData {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  medicalInfo: string;
}

export function ParentRegistrationPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  // Invite validation state
  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteValidationResult | null>(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentData, setParentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: null as Address | null,
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [children, setChildren] = useState<ChildData[]>([
    {
      id: 1,
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      position: "",
      medicalInfo: "",
    },
  ]);

  // Validate invite code on mount
  useEffect(() => {
    if (!inviteCode) {
      setIsValidating(false);
      return;
    }

    const validateInvite = async () => {
      try {
        const result = await getInviteDetails(inviteCode);
        setInviteData(result);

        // Pre-fill parent data from invite if available
        if (result.valid && result.invite) {
          setParentData((prev) => ({
            ...prev,
            email: result.invite!.inviteeEmail,
            firstName: result.invite!.inviteeFirstName || "",
            lastName: result.invite!.inviteeLastName || "",
          }));
        }
      } catch (error) {
        console.error("Error validating invite:", error);
        setInviteData({
          valid: false,
          message: "Failed to validate invitation",
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateInvite();
  }, [inviteCode]);

  const handleAddChild = () => {
    const newId = Math.max(...children.map((c) => c.id), 0) + 1;
    setChildren([
      ...children,
      {
        id: newId,
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        position: "",
        medicalInfo: "",
      },
    ]);
  };

  const handleRemoveChild = (childId: number) => {
    if (children.length > 1) {
      setChildren(children.filter((c) => c.id !== childId));
    } else {
      toast.error("You must have at least one child");
    }
  };

  const handleChildChange = (childId: number, field: keyof ChildData, value: string) => {
    setChildren(
      children.map((child) =>
        child.id === childId ? { ...child, [field]: value } : child
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode) {
      toast.error("Invalid invitation code");
      return;
    }

    // Validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!parentData.email) {
      toast.error("Email address is required");
      return;
    }

    if (!parentData.phone) {
      toast.error("Phone number is required");
      return;
    }

    if (!parentData.address) {
      toast.error("Please enter your address");
      return;
    }

    // Validate children data
    for (const child of children) {
      if (!child.firstName || !child.lastName || !child.dateOfBirth) {
        toast.error("Please complete all required fields for each child");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await completeInviteRegistration(inviteCode, {
        parent: {
          firstName: parentData.firstName,
          lastName: parentData.lastName,
          email: parentData.email,
          phone: parentData.phone,
          address: parentData.address,
        },
        account: {
          password: password,
        },
        children: children.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
          position: child.position || undefined,
          medicalInfo: child.medicalInfo || undefined,
        })),
      });

      toast.success("Registration completed successfully!");

      // Redirect to login page with success message
      setTimeout(() => {
        navigate("/auth", {
          state: {
            message: "Registration complete! Please login with your credentials.",
            accountNumber: result.accountNumber,
          },
        });
      }, 1500);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to complete registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid invite
  if (!inviteData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-gray-900">Invalid Invitation</h1>
          <p className="mt-2 text-gray-600">
            {inviteData?.message || "This invitation link is invalid or has expired."}
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="mt-6 gradient-primary"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to {inviteData.club?.name}!
              </h1>
              <p className="text-sm text-gray-600">
                Complete your registration to join the club
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={parentData.firstName}
                    onChange={(e) =>
                      setParentData({ ...parentData, firstName: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={parentData.lastName}
                    onChange={(e) =>
                      setParentData({ ...parentData, lastName: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={parentData.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  This email is pre-filled from your invitation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={parentData.phone}
                  onChange={(e) =>
                    setParentData({ ...parentData, phone: e.target.value })
                  }
                  placeholder="+44 7XXX XXXXXX"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Address <span className="text-destructive">*</span>
                </Label>
                <AddressInput
                  value={parentData.address}
                  onChange={(address) =>
                    setParentData({ ...parentData, address })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Children Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Children
                </h2>
              </div>
              <Button
                type="button"
                onClick={handleAddChild}
                variant="outline"
                size="sm"
                disabled={isSubmitting}
              >
                Add Child
              </Button>
            </div>

            <div className="space-y-6">
              {children.map((child, index) => (
                <div key={child.id} className="border rounded-lg p-4 relative">
                  {children.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveChild(child.id)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-destructive"
                      disabled={isSubmitting}
                    >
                      Remove
                    </Button>
                  )}

                  <h3 className="font-medium mb-4">Child {index + 1}</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={child.firstName}
                        onChange={(e) =>
                          handleChildChange(child.id, "firstName", e.target.value)
                        }
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={child.lastName}
                        onChange={(e) =>
                          handleChildChange(child.id, "lastName", e.target.value)
                        }
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <DateOfBirthInput
                      value={child.dateOfBirth}
                      onChange={(value) =>
                        handleChildChange(child.id, "dateOfBirth", value)
                      }
                      required
                      disabled={isSubmitting}
                    />

                    <div className="space-y-2 col-span-2">
                      <Label>Position</Label>
                      <Select
                        value={child.position}
                        onValueChange={(value) =>
                          handleChildChange(child.id, "position", value)
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                          <SelectItem value="Defender">Defender</SelectItem>
                          <SelectItem value="Midfielder">Midfielder</SelectItem>
                          <SelectItem value="Forward">Forward</SelectItem>
                          <SelectItem value="Any">Any Position</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Medical Information</Label>
                      <textarea
                        value={child.medicalInfo}
                        onChange={(e) =>
                          handleChildChange(child.id, "medicalInfo", e.target.value)
                        }
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Any allergies, medications, or medical conditions..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/auth")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gradient-primary min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing Registration...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
