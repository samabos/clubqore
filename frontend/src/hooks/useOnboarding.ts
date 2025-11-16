import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../stores/authStore";
import { getDefaultRouteByRole } from "../utils/roleNavigation";
import { onboardingAPI } from "../api/onboarding";
import {
  UserRole,
  UserProfile,
  UserPreferences
} from "../types/auth";
import {
    CreateClubRequest,
    JoinClubAsMemberRequest,
    SetupParentAccountRequest,
    OnboardingStep
} from "../types/membership";

interface OnboardingData {
  // Profile data (goes to user_profiles table)
  profile: Partial<UserProfile>;
  // Preferences data (goes to user_preferences table)
  preferences: Partial<UserPreferences>;
  // Role-specific setup data
  selectedRole: UserRole | null;
  // Club creation (for club_manager role)
  clubData: Partial<CreateClubRequest>;
  // Member setup (for member role)
  memberData: Partial<JoinClubAsMemberRequest>;
  // Parent setup (for parent role)
  parentData: Partial<SetupParentAccountRequest>;
}

export function useOnboarding() {
  const navigate = useNavigate();
  const { user , getCurrentUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: {
      profileImage: "",
    },
    preferences: {
      scheduleChanges: true,
      paymentReminders: true,
      emergencyAlerts: true,
      generalUpdates: false,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      profileVisibility: "members_only",
      showContactInfo: false,
      theme: "auto",
      language: "en",
    },
    selectedRole: null,
    clubData: {},
    memberData: {},
    parentData: { children: [] },
  });

  // Universal onboarding steps - matches new backend flow
  const universalSteps: OnboardingStep[] = [
    {
      id: "role-selection",
      title: "Choose Your Role",
      description: "How will you be using ClubQore?",
      completed: false,
    },
    {
      id: "profile-setup",
      title: "Profile Information",
      description: "Tell us about yourself",
      completed: false,
    },
    {
      id: "role-specific-setup",
      title: "Role Setup",
      description: "Complete your role-specific information",
      completed: false,
    },
    {
      id: "preferences-setup",
      title: "Preferences",
      description: "Set your notification and privacy preferences",
      completed: false,
    },
    {
      id: "setup-complete",
      title: "Welcome to ClubQore!",
      description: "You're all set to get started",
      completed: false,
    },
  ];

  const steps = universalSteps;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    // Skip role-specific setup for club managers since they'll set up their club later
    if (onboardingData.selectedRole === "club_manager" && steps[currentStep].id === "role-specific-setup") {
      // Skip to preferences setup
      setCurrentStep(currentStep + 2);
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - call API
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Transform the onboarding data to match the backend API
      const apiData = {
        role: onboardingData.selectedRole!,
        personalData: {
          firstName: onboardingData.profile.firstName || "",
          lastName: onboardingData.profile.lastName || "",
          dateOfBirth: onboardingData.profile.dateOfBirth,
          phone: onboardingData.profile.phone,
          address: { ...onboardingData.profile.address },
          profileImage: onboardingData.profile.profileImage,
        },
        clubData: undefined, // Club managers will set up their club later in the dashboard
        memberData:
          onboardingData.selectedRole === "member"
            ? {
                clubInviteCode: onboardingData.memberData.clubInviteCode,
                position: onboardingData.memberData.position,
                medicalInfo: onboardingData.memberData.medicalInfo,
                emergencyContactName: onboardingData.memberData.emergencyContactName,
                emergencyContactPhone: onboardingData.memberData.emergencyContactPhone,
                emergencyContactRelation: onboardingData.memberData.emergencyContactRelation,
                notes: onboardingData.memberData.notes,
              }
            : undefined,
        parentData:
          onboardingData.selectedRole === "parent"
            ? {
                children: (onboardingData.parentData.children || []).map(
                  (child) => ({
                    firstName: child.firstName || "",
                    lastName: child.lastName || "",
                    dateOfBirth: child.dateOfBirth || "",
                    clubId: child.clubId,
                    membershipCode: child.membershipCode,
                  })
                ),
              }
            : undefined,
        preferences: {
          notifications: {
            email_notifications:
              onboardingData.preferences.emailNotifications ?? true,
            push_notifications:
              onboardingData.preferences.pushNotifications ?? true,
            sms_notifications:
              onboardingData.preferences.smsNotifications ?? false,
            marketing_emails:
              onboardingData.preferences.generalUpdates ?? false,
          },
          privacy: {
            profile_visibility:
              onboardingData.preferences.profileVisibility || "members_only",
            contact_visibility: onboardingData.preferences.showContactInfo
              ? "public"
              : "private",
            activity_visibility: "members_only",
          },
          communication: {
            preferred_language: onboardingData.preferences.language || "en",
            timezone: "UTC",
            communication_method: "email" as const,
          },
        },
      };

      console.log("Completing onboarding with data:", apiData);

      // Complete onboarding on the backend
      await onboardingAPI.completeOnboarding(apiData as any);

      // Get updated user profile from backend
      await getCurrentUser();

      // Navigate to role-specific dashboard - user will be updated in store
      const defaultRoute = getDefaultRouteByRole(user!.roles);
      navigate(defaultRoute);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      setIsLoading(false);

      // Extract error message from different possible formats
      let errorMessage = "Failed to complete onboarding. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setError(errorMessage);
    }
  };

  const canProceed = () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case "role-selection":
        return onboardingData.selectedRole !== null;
      case "profile-setup":
        return (
          onboardingData.profile.firstName &&
          onboardingData.profile.lastName &&
          onboardingData.profile.dateOfBirth
        );
      case "role-specific-setup":
        // Club managers skip this step, so always return true
        if (onboardingData.selectedRole === "club_manager") {
          return true;
        } else if (onboardingData.selectedRole === "member") {
          return onboardingData.memberData.clubInviteCode;
        } else if (onboardingData.selectedRole === "parent") {
          return (onboardingData.parentData.children?.length || 0) > 0;
        }
        return true;
      case "preferences-setup":
      case "setup-complete":
        return true;
      default:
        return true;
    }
  };

  // Update functions for each data section
  const updateProfile = (profile: Partial<UserProfile>) => {
    setOnboardingData((prev) => ({ ...prev, profile }));
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    setOnboardingData((prev) => ({ ...prev, preferences }));
  };

  const updateRole = (role: UserRole | null) => {
    setOnboardingData((prev) => ({ ...prev, selectedRole: role }));
  };

  const updateClubData = (clubData: Partial<CreateClubRequest>) => {
    setOnboardingData((prev) => ({ ...prev, clubData }));
  };

  const updateMemberData = (memberData: Partial<JoinClubAsMemberRequest>) => {
    setOnboardingData((prev) => ({ ...prev, memberData }));
  };

  const updateParentData = (parentData: Partial<SetupParentAccountRequest>) => {
    setOnboardingData((prev) => ({ ...prev, parentData }));
  };

  return {
    // State
    currentStep,
    steps,
    progress,
    isLoading,
    error,
    onboardingData,
    user,
    
    // Actions
    handleNext,
    handleBack,
    canProceed,
    setError,
    
    // Data updates
    updateProfile,
    updatePreferences,
    updateRole,
    updateClubData,
    updateMemberData,
    updateParentData,
  };
}
