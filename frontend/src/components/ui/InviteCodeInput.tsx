// InviteCodeInput Component
// Demonstrates the new invite code validation functionality

import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { invitesAPI } from "../../api/invites";
import {
  Check,
  AlertTriangle,
  Loader2,
  Users,
  Code,
  Building2,
} from "lucide-react";

interface InviteCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidCode?: (clubInfo: any) => void;
  showPreview?: boolean;
  label?: string;
  placeholder?: string;
}

interface ClubPreview {
  id: string;
  name: string;
  clubType: string;
  description?: string;
  logoUrl?: string;
  memberCount: number;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  message: string;
  club?: ClubPreview;
  userCanJoin: boolean;
  alreadyMember: boolean;
}

export function InviteCodeInput({
  value,
  onChange,
  onValidCode,
  showPreview = true,
  label = "Club Invite Code",
  placeholder = "Enter invite code from your club",
}: InviteCodeInputProps) {
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    isValid: null,
    message: "",
    userCanJoin: false,
    alreadyMember: false,
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Debounced validation
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (value.length >= 6) {
      // Minimum code length
      const timer = setTimeout(() => {
        validateInviteCode(value);
      }, 500); // 500ms debounce

      setDebounceTimer(timer);
    } else {
      setValidation((prev) => ({
        ...prev,
        isValid: null,
        message: "",
        club: undefined,
      }));
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [value]);

  const validateInviteCode = async (code: string) => {
    setValidation((prev) => ({ ...prev, isValidating: true }));

    try {
      if (showPreview) {
        // Use preview endpoint for detailed information
        const result = await invitesAPI.previewCode(code);

        setValidation({
          isValidating: false,
          isValid: result.valid,
          message: result.message,
          club: result.club,
          userCanJoin: result.userCanJoin, // Note: using correct property name
          alreadyMember: result.alreadyMember,
        });

        if (result.valid && result.userCanJoin && onValidCode) {
          onValidCode(result.club);
        }
      } else {
        // Use basic validation endpoint
        const result = await invitesAPI.validateCode(code);

        setValidation({
          isValidating: false,
          isValid: result.valid,
          message:
            result.message ||
            (result.valid ? "Valid invite code" : "Invalid invite code"),
          club: result.club,
          userCanJoin: true, // Assume can join if valid
          alreadyMember: false,
        });

        if (result.valid && onValidCode) {
          onValidCode(result.club);
        }
      }
    } catch (error) {
      console.error("Failed to validate invite code:", error);
      setValidation({
        isValidating: false,
        isValid: false,
        message: "Failed to validate code. Please try again.",
        userCanJoin: false,
        alreadyMember: false,
      });
    }
  };

  const getValidationIcon = () => {
    if (validation.isValidating) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (validation.isValid === true) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    if (validation.isValid === false) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <Code className="w-4 h-4 text-gray-400" />;
  };

  const getValidationColor = () => {
    if (validation.isValidating) return "border-blue-300";
    if (validation.isValid === true) return "border-green-300";
    if (validation.isValid === false) return "border-red-300";
    return "border-gray-300";
  };

  return (
    <div className="space-y-3">
      {/* Input Field */}
      <div>
        <Label htmlFor="inviteCode">{label}</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
          <Input
            id="inviteCode"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className={`pl-10 ${getValidationColor()}`}
            placeholder={placeholder}
            maxLength={20}
          />
        </div>

        {/* Validation Message */}
        {validation.message && (
          <p
            className={`text-sm mt-1 ${
              validation.isValid === true
                ? "text-green-600"
                : validation.isValid === false
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {validation.message}
          </p>
        )}
      </div>

      {/* Club Preview Card */}
      {showPreview && validation.club && validation.isValid && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {/* Club Logo */}
              <div className="flex-shrink-0">
                {validation.club.logoUrl ? (
                  <img
                    src={validation.club.logoUrl}
                    alt={`${validation.club.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Club Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {validation.club.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {validation.club.clubType.replace("_", " ")}
                  </Badge>
                </div>

                {validation.club.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {validation.club.description}
                  </p>
                )}

                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{validation.club.memberCount} members</span>
                </div>
              </div>
            </div>

            {/* Join Status */}
            <div className="mt-3 pt-3 border-t border-green-200">
              {validation.alreadyMember ? (
                <div className="flex items-center text-blue-600">
                  <Check className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    You're already a member of this club
                  </span>
                </div>
              ) : validation.userCanJoin ? (
                <div className="flex items-center text-green-600">
                  <Check className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Ready to join this club!
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-orange-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Unable to join this club
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {validation.isValid === false && value.length >= 6 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                {validation.message || "Invalid invite code"}
              </span>
            </div>
            <p className="text-sm text-red-500 mt-1">
              Please check the code and try again, or contact your club manager
              for a new code.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
