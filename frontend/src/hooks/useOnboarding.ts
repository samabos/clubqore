import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../stores/authStore";
import { getDefaultRouteByRole } from "../utils/roleNavigation";
import { onboardingAPI } from "../api/onboarding";
import { emailVerificationAPI } from "../api/emailVerification";
import {
  UserProfile,
  UserPreferences
} from "../types/auth";
import {
    CreateClubRequest,
    OnboardingStep
} from "../types/membership";

interface OnboardingData {
  // Profile data (goes to user_profiles table)
  profile: Partial<UserProfile>;
  // Preferences data (goes to user_preferences table)
  preferences: Partial<UserPreferences>;
  // Role-specific setup data - only club_manager supported
  selectedRole: 'club_manager' | null;
  // Club creation (for club_manager role)
  clubData: Partial<CreateClubRequest>;
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
    selectedRole: 'club_manager', // Always club_manager, no selection needed
    clubData: {},
  });

  // Simplified 3-step onboarding flow (profile, club, complete)
  const universalSteps: OnboardingStep[] = [
    {
      id: "profile-setup",
      title: "Profile Information",
      description: "Tell us about yourself",
      completed: false,
    },
    {
      id: "club-setup",
      title: "Club Setup",
      description: "Create your football club",
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
          phone: onboardingData.profile.phone,
          profileImage: onboardingData.profile.profileImage,
        },
        clubData: {
          ...onboardingData.clubData,
          type: 'sports', // Default type for football clubs
        },
        preferences: {
          notifications: {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            marketing_emails: false,
          },
          privacy: {
            profile_visibility: "members_only",
            contact_visibility: "private",
            activity_visibility: "members_only",
          },
          communication: {
            preferred_language: "en",
            timezone: "UTC",
            communication_method: "email" as const,
          },
        },
      };

      console.log("Completing onboarding with data:", apiData);

      // Complete onboarding on the backend
      await onboardingAPI.completeOnboarding(apiData as unknown as Parameters<typeof onboardingAPI.completeOnboarding>[0]);

      // Send email verification
      try {
        await emailVerificationAPI.sendVerification();
        console.log("Verification email sent successfully");
      } catch (emailError) {
        // Don't block onboarding if email fails - user can resend later
        console.warn("Failed to send verification email:", emailError);
      }

      // Get updated user profile from backend
      await getCurrentUser();

      // Navigate to role-specific dashboard - user will be updated in store
      const defaultRoute = getDefaultRouteByRole(user!.roles);
      navigate(defaultRoute);
      setIsLoading(false);
    } catch (error: unknown) {
      console.error("Failed to complete onboarding:", error);
      setIsLoading(false);

      // Extract error message from different possible formats
      let errorMessage = "Failed to complete onboarding. Please try again.";

      if (error && typeof error === 'object') {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setError(errorMessage);
    }
  };

  const canProceed = () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case "profile-setup":
        // Only require first name and last name
        return (
          onboardingData.profile.firstName &&
          onboardingData.profile.lastName
        );
      case "club-setup":
        // Only require club name
        return Boolean(onboardingData.clubData.name);
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

  const updateClubData = (clubData: Partial<CreateClubRequest>) => {
    setOnboardingData((prev) => ({ ...prev, clubData }));
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
    updateClubData,
  };
}
