import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Calendar, Phone, Upload, User } from "lucide-react";
import { UserProfile } from "../../types/auth";

interface ProfileSetupProps {
  profile: Partial<UserProfile>;
  onProfileUpdate: (profile: Partial<UserProfile>) => void;
}

export function ProfileSetup({ profile, onProfileUpdate }: ProfileSetupProps) {
  const [profileImage, setProfileImage] = useState<string>(
    profile.profileImage || ""
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
        onProfileUpdate({ ...profile, profileImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateField = (
    field: keyof UserProfile,
    value: string | UserProfile["address"]
  ) => {
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

      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-24 h-24 rounded-2xl shadow-lg">
            {profileImage ? (
              <AvatarImage
                src={profileImage}
                className="rounded-2xl object-cover"
              />
            ) : (
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            )}
          </Avatar>
          <label
            htmlFor="profile-upload"
            className="absolute bottom-1 right-1 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
          >
            <Upload className="w-3 h-3" />
          </label>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <p className="text-sm text-gray-500">Upload a profile picture</p>
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
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="dateOfBirth"
              type="date"
              value={profile.dateOfBirth || ""}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
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

        <div className="space-y-2">
          <Label>Address</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="street"
              value={profile.address?.street || ""}
              onChange={(e) =>
                updateField("address", {
                  street: e.target.value,
                  city: profile.address?.city || "",
                  county: profile.address?.county || "",
                  postcode: profile.address?.postcode || "",
                  country: profile.address?.country || "",
                })
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Street Address"
            />
            <Input
              id="city"
              value={profile.address?.city || ""}
              onChange={(e) =>
                updateField("address", {
                  street: profile.address?.street || "",
                  city: e.target.value,
                  county: profile.address?.county || "",
                  postcode: profile.address?.postcode || "",
                  country: profile.address?.country || "",
                })
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="City"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input
              id="county"
              value={profile.address?.county || ""}
              onChange={(e) =>
                updateField("address", {
                  street: profile.address?.street || "",
                  city: profile.address?.city || "",
                  county: e.target.value,
                  postcode: profile.address?.postcode || "",
                  country: profile.address?.country || "",
                })
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="County"
            />
            <Input
              id="postcode"
              value={profile.address?.postcode || ""}
              onChange={(e) =>
                updateField("address", {
                  street: profile.address?.street || "",
                  city: profile.address?.city || "",
                  county: profile.address?.county || "",
                  postcode: e.target.value,
                  country: profile.address?.country || "",
                })
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Postcode"
            />
          </div>
          <div className="mt-2">
            <Input
              id="country"
              value={profile.address?.country || ""}
              onChange={(e) =>
                updateField("address", {
                  street: profile.address?.street || "",
                  city: profile.address?.city || "",
                  county: profile.address?.county || "",
                  postcode: profile.address?.postcode || "",
                  country: e.target.value,
                })
              }
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              placeholder="Country"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
