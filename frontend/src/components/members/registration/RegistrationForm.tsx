import { useState } from "react";
import { AuthUser } from "@/types/auth";
import { useAuth } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Checkbox } from "../../ui/checkbox";
import { Badge } from "../../ui/badge";
import { CalendarIcon, Upload, Camera, Save, Send } from "lucide-react";
import { format } from "date-fns";
import { MembershipType } from "../shared/types";

interface RegistrationFormProps {
  type: MembershipType;
  isDirect?: boolean; // true if club manager is registering directly
  invitationId?: string; // if this is from an invitation
  preFilledEmail?: string; // for pre-filled email
  showActionButtons?: boolean; // whether to show submit/cancel buttons
  onComplete: (data?: any) => void;
  onCancel: () => void;
}

export function RegistrationForm({
  type,
  isDirect = false,
  invitationId,
  preFilledEmail,
  showActionButtons = true,
  onComplete,
  onCancel,
}: RegistrationFormProps) {
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [profileImage, setProfileImage] = useState<string>("");
  const [generatePassword, setGeneratePassword] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Form data states
  // Get current user's club from auth store
  const { userClub } = useAuth();
  const currentUserClub = userClub || {
    id: 0,
    name: "Default Club",
  };

  const [formData, setFormData] = useState<AuthUser>({
    id: "",
    email: preFilledEmail || "",
    primaryRole: type === "member" ? "member" : "parent",
    isOnboarded: false,
    // Optionally set other AuthUser fields as needed
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result as string;
        setProfileImage(img);
        setFormData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            profileImage: img,
            // Ensure all required fields are preserved or set to empty string if undefined
            firstName: prev.profile?.firstName ?? "",
            lastName: prev.profile?.lastName ?? "",
            phone: prev.profile?.phone ?? "",
            emergencyContactName: prev.profile?.emergencyContactName ?? "",
            emergencyContactPhone: prev.profile?.emergencyContactPhone ?? "",
            emergencyContactRelation:
              prev.profile?.emergencyContactRelation ?? "",
            position: prev.profile?.position ?? undefined,
            experienceLevel: prev.profile?.experienceLevel ?? undefined,
            notes: prev.profile?.notes ?? "",
            medicalConditions: prev.profile?.medicalConditions ?? "",
            address: prev.profile?.address ?? {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const submissionData = {
      type,
      formData,
      isDirect,
      invitationId,
    };
    onComplete(submissionData);
  };

  // Helper to update top-level AuthUser fields or nested profile fields
  const updateFormData = (field: string, value: any) => {
    if (
      [
        "firstName",
        "lastName",
        "dateOfBirth",
        "sex",
        "notes",
        "experienceLevel",
        "position",
        "membershipCode",
        "medicalConditions",
        "profileImage",
        "fullName",
        "phone",
        "emergencyContactName",
        "emergencyContactPhone",
        "emergencyContactRelation",
        "profileCompletedAt",
        "address",
        "street",
        "city",
        "state",
        "zipCode",
        "country",
      ].includes(field)
    ) {
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value ?? "",
          // Ensure all required string fields are never undefined
          firstName:
            field === "firstName" ? value ?? "" : prev.profile?.firstName ?? "",
          lastName:
            field === "lastName" ? value ?? "" : prev.profile?.lastName ?? "",
          phone: field === "phone" ? value ?? "" : prev.profile?.phone ?? "",
          emergencyContactName:
            field === "emergencyContactName"
              ? value
              : prev.profile?.emergencyContactName,
          emergencyContactPhone:
            field === "emergencyContactPhone"
              ? value
              : prev.profile?.emergencyContactPhone,
          emergencyContactRelation:
            field === "emergencyContactRelation"
              ? value
              : prev.profile?.emergencyContactRelation,
          notes: field === "notes" ? value : prev.profile?.notes,
          medicalConditions:
            field === "medicalConditions"
              ? value
              : prev.profile?.medicalConditions,
          address: prev.profile?.address ?? {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Card className="border-0">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-gray-900">
          {type === "member" ? "Member (Player)" : "Parent/Guardian"}{" "}
          Registration
        </CardTitle>
        <CardDescription className="text-gray-600">
          {isDirect
            ? `Register a new ${
                type === "member" ? "player" : "parent/guardian"
              } directly. Account details will be sent via email.`
            : `Complete your ${
                type === "member" ? "player" : "parent/guardian"
              } registration.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-32 h-32 rounded-2xl shadow-lg">
              {profileImage ? (
                <AvatarImage
                  src={profileImage}
                  className="rounded-2xl object-cover"
                />
              ) : (
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl">
                  <Camera className="w-12 h-12" />
                </AvatarFallback>
              )}
            </Avatar>
            <label
              htmlFor="profile-upload"
              className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Profile Picture</p>
            <p className="text-xs text-gray-500">
              Upload a profile picture (optional)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Personal Information
            </h3>

            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-700"
              >
                First Name *
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.profile?.firstName || ""}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-700"
              >
                Last Name *
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.profile?.lastName || ""}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.profile?.phone || ""}
                onChange={(e) => updateFormData("phone", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            {type === "member" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Date of Birth *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-primary"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth ? (
                        format(dateOfBirth, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={setDateOfBirth}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Right Column - Club Info and Address for Members, Address for Parents */}
          <div className="space-y-6">
            {type === "member" ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Club Information
                </h3>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Club
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {currentUserClub.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Current Club
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="position"
                    className="text-sm font-medium text-gray-700"
                  >
                    Playing Position *
                  </Label>
                  <Select
                    value={formData.profile?.position || ""}
                    onValueChange={(value) => updateFormData("position", value)}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                      <SelectItem value="defender">Defender</SelectItem>
                      <SelectItem value="midfielder">Midfielder</SelectItem>
                      <SelectItem value="forward">Forward</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="experience"
                    className="text-sm font-medium text-gray-700"
                  >
                    Experience Level
                  </Label>
                  <Select
                    value={formData.profile?.experienceLevel || ""}
                    onValueChange={(value) =>
                      updateFormData("experienceLevel", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Address Information
                </h3>

                <div className="space-y-2">
                  <Label
                    htmlFor="street"
                    className="text-sm font-medium text-gray-700"
                  >
                    Street Address
                  </Label>
                  <Input
                    id="street"
                    placeholder="Enter street address"
                    value={formData.profile?.address?.street || ""}
                    onChange={(e) =>
                      updateFormData("address", {
                        ...formData.profile?.address,
                        street: e.target.value,
                      })
                    }
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-sm font-medium text-gray-700"
                    >
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.profile?.address?.city || ""}
                      onChange={(e) =>
                        updateFormData("address", {
                          ...formData.profile?.address,
                          city: e.target.value,
                        })
                      }
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="state"
                      className="text-sm font-medium text-gray-700"
                    >
                      State
                    </Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={formData.profile?.address?.state || ""}
                      onChange={(e) =>
                        updateFormData("address", {
                          ...formData.profile?.address,
                          state: e.target.value,
                        })
                      }
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="zipCode"
                      className="text-sm font-medium text-gray-700"
                    >
                      ZIP Code
                    </Label>
                    <Input
                      id="zipCode"
                      placeholder="ZIP Code"
                      value={formData.profile?.address?.zipCode || ""}
                      onChange={(e) =>
                        updateFormData("address", {
                          ...formData.profile?.address,
                          zipCode: e.target.value,
                        })
                      }
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="country"
                      className="text-sm font-medium text-gray-700"
                    >
                      Country
                    </Label>
                    <Input
                      id="country"
                      placeholder="Country"
                      value={formData.profile?.address?.country || ""}
                      onChange={(e) =>
                        updateFormData("address", {
                          ...formData.profile?.address,
                          country: e.target.value,
                        })
                      }
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Address Information for Members */}
        {type === "member" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="street"
                  className="text-sm font-medium text-gray-700"
                >
                  Street Address
                </Label>
                <Input
                  id="street"
                  placeholder="Enter street address"
                  value={formData.profile?.address?.street || ""}
                  onChange={(e) =>
                    updateFormData("address", {
                      ...formData.profile?.address,
                      street: e.target.value,
                    })
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-gray-700"
                >
                  City
                </Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.profile?.address?.city || ""}
                  onChange={(e) =>
                    updateFormData("address", {
                      ...formData.profile?.address,
                      city: e.target.value,
                    })
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="state"
                  className="text-sm font-medium text-gray-700"
                >
                  State
                </Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={formData.profile?.address?.state || ""}
                  onChange={(e) =>
                    updateFormData("address", {
                      ...formData.profile?.address,
                      state: e.target.value,
                    })
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="zipCode"
                  className="text-sm font-medium text-gray-700"
                >
                  ZIP Code
                </Label>
                <Input
                  id="zipCode"
                  placeholder="ZIP Code"
                  value={formData.profile?.address?.zipCode || ""}
                  onChange={(e) =>
                    updateFormData("address", {
                      ...formData.profile?.address,
                      zipCode: e.target.value,
                    })
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-gray-700"
                >
                  Country
                </Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={formData.profile?.address?.country || ""}
                  onChange={(e) =>
                    updateFormData("address", {
                      ...formData.profile?.address,
                      country: e.target.value,
                    })
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact Section (for members) */}
        {type === "member" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyContact"
                  className="text-sm font-medium text-gray-700"
                >
                  Contact Name *
                </Label>
                <Input
                  id="emergencyContact"
                  placeholder="Emergency contact name"
                  value={formData.profile?.emergencyContactName || ""}
                  onChange={(e) =>
                    updateFormData("emergencyContactName", e.target.value)
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emergencyPhone"
                  className="text-sm font-medium text-gray-700"
                >
                  Contact Phone *
                </Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  placeholder="Emergency contact phone"
                  value={formData.profile?.emergencyContactPhone || ""}
                  onChange={(e) =>
                    updateFormData("emergencyContactPhone", e.target.value)
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="relation"
                  className="text-sm font-medium text-gray-700"
                >
                  Relationship
                </Label>
                <Select
                  value={formData.profile?.emergencyContactRelation || ""}
                  onValueChange={(value) =>
                    updateFormData("emergencyContactRelation", value)
                  }
                >
                  <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Additional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {type === "member" && (
              <div className="space-y-2">
                <Label
                  htmlFor="medicalConditions"
                  className="text-sm font-medium text-gray-700"
                >
                  Medical Conditions
                </Label>
                <Textarea
                  id="medicalConditions"
                  placeholder="Any medical conditions or allergies (optional)"
                  rows={4}
                  value={formData.profile?.medicalConditions || ""}
                  onChange={(e) =>
                    updateFormData("medicalConditions", e.target.value)
                  }
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder={`Any additional information about the ${
                  type === "member" ? "player" : "parent"
                } (optional)`}
                rows={4}
                value={formData.profile?.notes || ""}
                onChange={(e) => updateFormData("notes", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Direct Registration Options */}
        {isDirect && (
          <div className="space-y-6 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Account Setup Options
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="generate-password"
                  checked={generatePassword}
                  onCheckedChange={(checked) =>
                    setGeneratePassword(checked as boolean)
                  }
                />
                <Label htmlFor="generate-password" className="cursor-pointer">
                  Generate secure password automatically
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="send-welcome"
                  checked={sendWelcomeEmail}
                  onCheckedChange={(checked) =>
                    setSendWelcomeEmail(checked as boolean)
                  }
                />
                <Label htmlFor="send-welcome" className="cursor-pointer">
                  Send welcome email with login instructions
                </Label>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-white rounded-lg p-4">
              <p className="font-medium mb-2">What will be sent:</p>
              <ul className="space-y-1 text-sm">
                <li>• Login credentials and temporary password</li>
                <li>• Link to complete profile setup</li>
                <li>• Club information and next steps</li>
                <li>• Instructions for first login</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActionButtons && (
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              onClick={handleSubmit}
              className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              {isDirect ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Register & Send Credentials
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Complete Registration
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
