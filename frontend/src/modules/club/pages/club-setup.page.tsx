import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { CreateClubRequest } from "../types/component-types";
import { Club } from "../../../types/club";
import { toast } from "sonner";
import { useAuth } from "../../../stores/authStore";
import { tokenManager } from "../../../api/secureAuth";
import {
  ClubSetupHeader,
  ClubLogoUpload,
  BasicInformationForm,
  ContactLocationForm,
  ClubSetupActions,
  ClubSetupLoading,
} from "../components";
import { getMyClub, createClub, updateClub, uploadClubLogo } from "../actions";

export function ClubSetupPage() {
  const { setUserClub, setClubDataLoaded } = useAuth();
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
      // Only load if user is authenticated and has a valid token
      if (!tokenManager.getAccessToken()) {
        console.log("🔄 Skipping club data load - no token");
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        const club = await getMyClub();
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
        console.log("No existing club found, creating new one");
        setExistingClub(null);
      }

      setIsLoadingData(false);
    };

    loadClubData();
  }, [setUserClub, setClubDataLoaded]);

  const updateField = (
    field: keyof CreateClubRequest,
    value: string | number | undefined
  ) => {
    setClubData({ ...clubData, [field]: value });
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if user is authenticated
      if (!tokenManager.getAccessToken()) {
        toast.error("Please log in to upload a logo");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setClubLogo(base64Data);

        // If we have an existing club, upload the logo immediately
        if (existingClub) {
          try {
            await uploadClubLogo(existingClub.id, base64Data);
            toast.success("Club logo updated successfully!");
          } catch (error) {
            console.error("Error uploading logo:", error);
            if (
              error.message.includes("401") ||
              error.message.includes("Invalid access token")
            ) {
              toast.error("Please log in again to upload the logo.");
            } else if (
              error.message.includes("403") ||
              error.message.includes("permission")
            ) {
              toast.error(
                "You don't have permission to update this club's logo."
              );
            } else {
              toast.error("Failed to upload logo. Please try again.");
            }
          }
        }
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

    // Check authentication
    if (!tokenManager.getAccessToken()) {
      toast.error("Authentication required", {
        description: "Please log in to create or update your club.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const cleanedData = cleanClubData(clubData);

      if (isUpdateMode && existingClub) {
        // Update existing club
        const updatedClub = await updateClub(
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
        const newClub = await createClub(cleanedData as CreateClubRequest);
        setExistingClub(newClub);
        setUserClub(newClub); // Update store
        setClubDataLoaded(true); // Mark as loaded
        toast.success("Club created successfully!", {
          description:
            "Your club has been set up and is ready to use. You can now update your club details anytime.",
        });
      }
    } catch (error) {
      console.error("Error saving club:", error);
      toast.error("Failed to save club", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Boolean(
    clubData.name && clubData.clubType && clubData.description
  );

  // Show loading state while fetching data
  if (isLoadingData) {
    return <ClubSetupLoading />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ClubSetupHeader isUpdateMode={isUpdateMode} />

      <Card className="border-0">
        <CardHeader className="text-center"></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <ClubLogoUpload
              clubLogo={clubLogo}
              onLogoUpload={handleLogoUpload}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <BasicInformationForm
                clubData={clubData}
                updateField={updateField}
              />
              <ContactLocationForm
                clubData={clubData}
                updateField={updateField}
              />
            </div>

            <ClubSetupActions
              isUpdateMode={isUpdateMode}
              isLoading={isLoading}
              isFormValid={isFormValid}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
