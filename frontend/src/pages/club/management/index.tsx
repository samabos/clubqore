import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Building2, Upload, Check, Save } from "lucide-react";
import { CreateClubRequest } from "../../../types/membership";
import { clubsAPI } from "../../../api/clubs";
import { Club } from "../../../types/club";
import { toast } from "sonner";
import { useAppStore } from "../../../store";

export default function ClubSetupPage() {
  const { setUserClub, setClubDataLoaded } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [clubLogo, setClubLogo] = useState<string>("");
  const [existingClub, setExistingClub] = useState<Club | null>(null);
  const [clubData, setClubData] = useState<Partial<CreateClubRequest>>({
    name: "",
    clubType: undefined,
    description: "",
    foundedYear: undefined,
    membershipCapacity: undefined,
    website: "",
    address: "",
    phone: "",
    email: "",
  });

  // Check if we're in update mode
  const isUpdateMode = existingClub !== null;

  // Load existing club data on component mount
  useEffect(() => {
    const loadClubData = async () => {
      try {
        setIsLoadingData(true);
        const club = await clubsAPI.getMyClub();
        setExistingClub(club);

        // Prefill form with existing data
        setClubData({
          name: club.name || "",
          clubType:
            (club.clubType as
              | "youth-academy"
              | "amateur-club"
              | "semi-professional"
              | "professional"
              | "training-center") || undefined,
          description: club.description || "",
          foundedYear: club.foundedYear || undefined,
          membershipCapacity: club.membershipCapacity || undefined,
          website: club.website || "",
          address: club.address || "",
          phone: club.phone || "",
          email: club.email || "",
        });

        if (club.logoUrl) {
          setClubLogo(club.logoUrl);
        }
      } catch {
        // If no club exists, we're in create mode
        console.log("No existing club found, creating new one");
        setExistingClub(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadClubData();
  }, []);

  const updateField = (
    field: keyof CreateClubRequest,
    value: string | number | undefined
  ) => {
    setClubData({ ...clubData, [field]: value });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setClubLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clean data before sending to API
  const cleanClubData = (data: Partial<CreateClubRequest>) => {
    const cleaned = { ...data };

    // Remove empty strings and convert to null for optional fields
    Object.keys(cleaned).forEach((key) => {
      const value = cleaned[key as keyof CreateClubRequest];
      if (value === "" || value === undefined) {
        delete cleaned[key as keyof CreateClubRequest];
      }
    });

    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanedData = cleanClubData(clubData);

      if (isUpdateMode && existingClub) {
        // Update existing club
        const updatedClub = await clubsAPI.updateClub(
          existingClub.id,
          cleanedData as CreateClubRequest
        );
        setExistingClub(updatedClub);
        setUserClub(updatedClub); // Update store
        setClubDataLoaded(true); // Mark as loaded
        toast.success("Club updated successfully!", {
          description: "Your club information has been saved.",
        });
      } else {
        // Create new club
        const newClub = await clubsAPI.createClub(
          cleanedData as CreateClubRequest
        );
        setExistingClub(newClub);
        setUserClub(newClub); // Update store
        setClubDataLoaded(true); // Mark as loaded
        toast.success("Club created successfully!", {
          description:
            "Your club has been set up and is ready to use. You can now update your club details anytime.",
        });
      }
    } catch (error) {
      console.error(
        `Failed to ${isUpdateMode ? "update" : "create"} club:`,
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(`Failed to ${isUpdateMode ? "update" : "create"} club`, {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    clubData.name && clubData.clubType && clubData.description;

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading club information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isUpdateMode ? "Update Your Club" : "Set Up Your Club"}
          </h1>
          <p className="text-gray-600">
            {isUpdateMode
              ? "Update your football club profile and settings"
              : "Create your football club profile to start managing members and activities"}
          </p>
        </div>
      </div>

      <Card className="border-0 ">
        <CardHeader className="text-center"></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Club Logo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32 rounded-2xl shadow-lg">
                  {clubLogo ? (
                    <AvatarImage
                      src={clubLogo}
                      className="rounded-2xl object-cover"
                    />
                  ) : (
                    <AvatarFallback className="rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white text-2xl">
                      <Building2 className="w-12 h-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <label
                  htmlFor="logo-upload"
                  className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Club Logo</p>
                <p className="text-xs text-gray-500">
                  Upload your club's logo or badge
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Basic Information
                </h3>

                <div className="space-y-2">
                  <Label
                    htmlFor="clubName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Name *
                  </Label>
                  <Input
                    id="clubName"
                    value={clubData.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter your club name"
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="clubType"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Type *
                  </Label>
                  <Select
                    value={clubData.clubType || ""}
                    onValueChange={(value) => updateField("clubType", value)}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Select club type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="youth-academy">
                        Youth Academy
                      </SelectItem>
                      <SelectItem value="amateur-club">Amateur Club</SelectItem>
                      <SelectItem value="semi-professional">
                        Semi-Professional
                      </SelectItem>
                      <SelectItem value="professional">
                        Professional Club
                      </SelectItem>
                      <SelectItem value="training-center">
                        Training Center
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={clubData.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Tell us about your club's history, mission, and values..."
                    rows={4}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="foundedYear"
                      className="text-sm font-medium text-gray-700"
                    >
                      Founded Year
                    </Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      value={clubData.foundedYear || ""}
                      onChange={(e) =>
                        updateField(
                          "foundedYear",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 1995"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="capacity"
                      className="text-sm font-medium text-gray-700"
                    >
                      Member Capacity
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={clubData.membershipCapacity || ""}
                      onChange={(e) =>
                        updateField(
                          "membershipCapacity",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 100"
                      className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="website"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={clubData.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://yourclub.com"
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={clubData.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="contact@yourclub.com"
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Contact & Location
                </h3>

                <div className="space-y-2">
                  <Label
                    htmlFor="clubAddress"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Address
                  </Label>
                  <Textarea
                    id="clubAddress"
                    value={clubData.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Enter your club's full address..."
                    rows={3}
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="clubPhone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Club Phone Number
                  </Label>
                  <Input
                    id="clubPhone"
                    type="tel"
                    value={clubData.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-100">
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  isUpdateMode ? (
                    "Updating Club..."
                  ) : (
                    "Creating Club..."
                  )
                ) : (
                  <>
                    {isUpdateMode ? (
                      <Save className="w-4 h-4 mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {isUpdateMode ? "Update Club" : "Create Club"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
