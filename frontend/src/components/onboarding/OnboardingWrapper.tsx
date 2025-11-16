import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingFlow } from "./OnboardingFlow";
import { useAuth } from "../../stores/authStore";
import { getDefaultRouteByRole } from "../../utils/roleNavigation";

export function OnboardingWrapper() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If user is already onboarded, redirect to role-specific dashboard
    if (user?.isOnboarded) {
      const defaultRoute = getDefaultRouteByRole(user.roles);
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
