import { useState } from "react";
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
import { Badge } from "../../ui/badge";
import { CalendarIcon, Upload, Camera, Send } from "lucide-react";
import { format } from "date-fns";
import { ChildInfo } from "../../../types/auth";

interface ChildRegistrationFormProps {
  parentEmail: string;
  showActionButtons?: boolean;
  onComplete: (data?: any) => void;
  onCancel: () => void;
}

export function ChildRegistrationForm({
  parentEmail,
  showActionButtons = true,
  onComplete,
  onCancel,
}: ChildRegistrationFormProps) {
  const [profileImage, setProfileImage] = useState<string>("");

  // Current user's club context (in real app, get from auth/context)
  const currentUserClub = {
    id: "manchester-united",
    name: "Manchester United Youth",
  };

  const [formData, setFormData] = useState<ChildInfo>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: undefined,
    clubId: currentUserClub.id,
    notes: "",
    experienceLevel: undefined,
    position: undefined,
    membershipCode: "",
    medicalConditions: "",
    profileImage: "",
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result as string;
        setProfileImage(img);
        setFormData((prev) => ({ ...prev, profileImage: img }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const submissionData: ChildInfo & { parentEmail: string } = {
      ...formData,
      parentEmail,
    };
    onComplete(submissionData);
  };

  const updateFormData = <K extends keyof ChildInfo>(
    field: K,
    value: ChildInfo[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-gray-900">
          Child (Player) Registration
        </CardTitle>
        <CardDescription className="text-gray-600">
          Register a child player. The parent account will manage this child's
          profile and activities.
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
                placeholder="Enter child's first name"
                value={formData.firstName || ""}
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
                placeholder="Enter child's last name"
                value={formData.lastName || ""}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="sex"
                className="text-sm font-medium text-gray-700"
              >
                Sex *
              </Label>
              <Select
                value={formData.sex || ""}
                onValueChange={(value) =>
                  updateFormData("sex", value as "male" | "female")
                }
                required
              >
                <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {formData.sex == undefined && (
                <p className="text-xs text-red-500 mt-1">Sex is required.</p>
              )}
            </div>
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
                    {formData.dateOfBirth ? (
                      format(new Date(formData.dateOfBirth), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl">
                  <Calendar
                    mode="single"
                    selected={
                      formData.dateOfBirth
                        ? new Date(formData.dateOfBirth)
                        : undefined
                    }
                    onSelect={(date) =>
                      updateFormData(
                        "dateOfBirth",
                        date ? date.toISOString().split("T")[0] : ""
                      )
                    }
                    initialFocus
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Club Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Club Information
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Club</Label>
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
                htmlFor="membershipCode"
                className="text-sm font-medium text-gray-700"
              >
                Membership Code
              </Label>
              <Input
                id="membershipCode"
                placeholder="Enter membership code (optional)"
                value={formData.membershipCode || ""}
                onChange={(e) =>
                  updateFormData("membershipCode", e.target.value)
                }
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="position"
                className="text-sm font-medium text-gray-700"
              >
                Playing Position
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formData.position || ""}
                onValueChange={(value) =>
                  updateFormData("position", value as ChildInfo["position"])
                }
              >
                <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="Select position (optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="experienceLevel"
                className="text-sm font-medium text-gray-700"
              >
                Experience Level
              </Label>
              <Select
                value={formData.experienceLevel || ""}
                onValueChange={(value) =>
                  updateFormData(
                    "experienceLevel",
                    value as ChildInfo["experienceLevel"]
                  )
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

            {/* Parent Information Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Parent/Guardian
              </Label>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  Managed by: {parentEmail}
                </p>
                <p className="text-xs text-blue-700">
                  Parent will receive all communications and manage this account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
            Additional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                value={formData.medicalConditions || ""}
                onChange={(e) =>
                  updateFormData("medicalConditions", e.target.value)
                }
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the child (optional)"
                rows={4}
                value={formData.notes || ""}
                onChange={(e) => updateFormData("notes", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActionButtons && (
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              onClick={handleSubmit}
              className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4 mr-2" />
              Register Child
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
