import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export interface BasicDetailsData {
  email?: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  role?: "team_manager" | "staff";
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
  dateOfBirth?: string;
  sendLoginEmail?: boolean;
}

export interface BasicDetailsFormProps {
  formData: BasicDetailsData;
  onChange: (
    field: keyof BasicDetailsData,
    value: string | number | boolean
  ) => void;
  showEmail?: boolean;
  showAvatar?: boolean;
  showRole?: boolean;
  showAdditionalFields?: boolean;
  showNotificationSettings?: boolean;
  emailReadOnly?: boolean;
  requiredFields?: (keyof BasicDetailsData)[];
  className?: string;
  fieldClassName?: string;
}

export function BasicDetailsForm({
  formData,
  onChange,
  showEmail = false,
  showAvatar = false,
  showRole = false,
  showAdditionalFields = false,
  showNotificationSettings = false,
  emailReadOnly = false,
  requiredFields = [],
  className = "",
  fieldClassName = "",
}: BasicDetailsFormProps) {
  const isRequired = (field: keyof BasicDetailsData): boolean => {
    return requiredFields.includes(field);
  };

  const handleInputChange =
    (field: keyof BasicDetailsData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === "number"
          ? parseFloat(e.target.value) || 0
          : e.target.value;
      onChange(field, value);
    };

  const handleSelectChange = (field: keyof BasicDetailsData, value: string) => {
    onChange(field, value);
  };

  const handleSwitchChange = (
    field: keyof BasicDetailsData,
    checked: boolean
  ) => {
    onChange(field, checked);
  };

  return (
    <div className={className}>
      <div
        className={
          showAdditionalFields
            ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
            : "max-w-2xl"
        }
      >
        <div>
          {/* Email Field */}
          {showEmail && (
            <div className="space-y-2 mb-6">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email {isRequired("email") ? "*" : ""}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange("email")}
                className={fieldClassName}
                required={isRequired("email")}
                disabled={emailReadOnly}
                placeholder="Enter email address"
              />
              {emailReadOnly && (
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              )}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-700"
              >
                First Name {isRequired("firstName") ? "*" : ""}
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                className={fieldClassName}
                required={isRequired("firstName")}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-700"
              >
                Last Name {isRequired("lastName") ? "*" : ""}
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                className={fieldClassName}
                required={isRequired("lastName")}
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2 mb-6">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700"
            >
              Phone {isRequired("phone") ? "*" : ""}
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              className={fieldClassName}
              required={isRequired("phone")}
              placeholder="Enter phone number"
            />
          </div>


          {/* Role Selection */}
          {showRole && (
            <div className="space-y-2 mb-6">
              <Label
                htmlFor="role"
                className="text-sm font-medium text-gray-700"
              >
                Role {isRequired("role") ? "*" : ""}
              </Label>
              <Select
                value={formData.role || ""}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger className={fieldClassName}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_manager">Team Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notification Settings */}
          {showNotificationSettings && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <div className="space-y-0.5 flex-1">
                  <Label
                    htmlFor="sendLoginEmail"
                    className="text-base font-medium text-gray-700"
                  >
                    Send Login Credentials Email
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically send welcome email with login credentials
                  </p>
                </div>
                <Switch
                  id="sendLoginEmail"
                  checked={formData.sendLoginEmail ?? true}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("sendLoginEmail", checked)
                  }
                />
              </div>
            </div>
          )}

          {/* Avatar Field */}
          {showAvatar && (
            <div className="space-y-2 mb-6">
              <Label
                htmlFor="avatar"
                className="text-sm font-medium text-gray-700"
              >
                Avatar URL {isRequired("avatar") ? "*" : ""}
              </Label>
              <Input
                id="avatar"
                name="avatar"
                value={formData.avatar || ""}
                onChange={handleInputChange("avatar")}
                className={fieldClassName}
                required={isRequired("avatar")}
                placeholder="Enter avatar URL"
              />
            </div>
          )}
        </div>
        <div>
          {/* Date of Birth */}
          {showAdditionalFields && (
            <div className="space-y-2 mb-6">
              <Label
                htmlFor="dateOfBirth"
                className="text-sm font-medium text-gray-700"
              >
                Date of Birth {isRequired("dateOfBirth") ? "*" : ""}
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={handleInputChange("dateOfBirth")}
                className={fieldClassName}
                required={isRequired("dateOfBirth")}
              />
            </div>
          )}

          {/* Additional Personnel Fields */}
          {showAdditionalFields && (
            <>
              {/* Certification and Experience */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="certificationLevel"
                    className="text-sm font-medium text-gray-700"
                  >
                    Certification Level{" "}
                    {isRequired("certificationLevel") ? "*" : ""}
                  </Label>
                  <Input
                    id="certificationLevel"
                    name="certificationLevel"
                    value={formData.certificationLevel || ""}
                    onChange={handleInputChange("certificationLevel")}
                    className={fieldClassName}
                    required={isRequired("certificationLevel")}
                    placeholder="e.g., UEFA A License, Level 3"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="yearsOfExperience"
                    className="text-sm font-medium text-gray-700"
                  >
                    Years of Experience{" "}
                    {isRequired("yearsOfExperience") ? "*" : ""}
                  </Label>
                  <Input
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience || ""}
                    onChange={handleInputChange("yearsOfExperience")}
                    className={fieldClassName}
                    required={isRequired("yearsOfExperience")}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label
                  htmlFor="bio"
                  className="text-sm font-medium text-gray-700"
                >
                  Bio/Description {isRequired("bio") ? "*" : ""}
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleInputChange("bio")}
                  className={fieldClassName}
                  required={isRequired("bio")}
                  placeholder="Brief description of coaching experience and qualifications..."
                  rows={4}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BasicDetailsForm;
