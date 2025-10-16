import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { getDefaultRouteByRole, getPrimaryRole } from "../utils/roleNavigation";

/**
 * Component that redirects users to their role-specific dashboard
 * when they navigate to /app directly
 */
export function RoleBasedRedirect() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  useEffect(() => {
    if (user) {
      console.log("RoleBasedRedirect - User:", user);
      const userRole = getPrimaryRole(user);
      console.log("RoleBasedRedirect - User Role:", userRole);
      const defaultRoute = getDefaultRouteByRole(userRole);
      console.log("RoleBasedRedirect - Default Route:", defaultRoute);

      // Extract the path after /app/ from the default route
      let dashboardPath;
      if (defaultRoute.startsWith("/app/")) {
        dashboardPath = defaultRoute.replace("/app/", "");
      } else if (defaultRoute === "/app") {
        dashboardPath = "dashboard";
      } else {
        dashboardPath = "dashboard"; // fallback
      }

      console.log("RoleBasedRedirect - Dashboard Path:", dashboardPath);
      navigate(dashboardPath, { replace: true });
    } else {
      console.log("RoleBasedRedirect - No user, redirecting to dashboard");
      // If no user, redirect to dashboard as fallback
      navigate("dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Render loading or nothing while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
