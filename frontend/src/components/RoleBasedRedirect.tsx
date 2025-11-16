import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../stores/authStore";
import { getDefaultRouteByRole } from "../utils/roleNavigation";
import { Loading } from "./ui/loading";

/**
 * Component that redirects users to their role-specific dashboard
 * when they navigate to /app directly
 */
export function RoleBasedRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log("RoleBasedRedirect - User:", user);
      const defaultRoute = getDefaultRouteByRole(user.roles);
      console.log("RoleBasedRedirect - Default Route:", defaultRoute);
      navigate(defaultRoute, { replace: true });
    } else {
      console.log("RoleBasedRedirect - No user, redirecting to dashboard");
      // If no user, redirect to dashboard as fallback
      navigate("dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Render loading or nothing while redirecting
  return (
    <Loading message="Loading dashboard..." containerClassName="min-h-screen" />
  );
}
