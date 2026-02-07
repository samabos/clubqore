import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Phone } from "lucide-react";
import { UserProfile } from "../../types/auth";

interface ProfileSetupProps {
  profile: Partial<UserProfile>;
  onProfileUpdate: (profile: Partial<UserProfile>) => void;
}

export function ProfileSetup({ profile, onProfileUpdate }: ProfileSetupProps) {
  const updateField = (field: keyof UserProfile, value: string) => {
    onProfileUpdate({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Profile Information
        </h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={profile.firstName || ""}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="First name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={profile.lastName || ""}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Last name"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="phone"
              type="tel"
              value={profile.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
