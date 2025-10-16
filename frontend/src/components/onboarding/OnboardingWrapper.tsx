import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingFlow } from "./OnboardingFlow";
import { useAppStore } from "../../store";
import {
  getDefaultRouteByRole,
  getPrimaryRole,
} from "../../utils/roleNavigation";

export function OnboardingWrapper() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  useEffect(() => {
    // If user is already onboarded, redirect to role-specific dashboard
    if (user?.isOnboarded) {
      const userRole = getPrimaryRole(user);
      const defaultRoute = getDefaultRouteByRole(userRole);
      navigate(defaultRoute);
      return;
    }

    // If no user, redirect to auth
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  // Don't render anything while redirecting
  if (!user || user.isOnboarded) {
    return null;
  }

  return <OnboardingFlow />;
}
