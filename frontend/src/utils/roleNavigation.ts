/**
 * Get the default route for a user based on their role
 */
export const getDefaultRouteByRole = (roles: string[]): string => {
  for (const role of roles) {
    switch (role) {
      case "admin":
        return "/app/admin-dashboard";
      case "club_manager":
        return "/app/club-manager-dashboard";
      case "member":
        return "/app/member-dashboard";
      case "parent":
        return "/app/parent-dashboard";
      case "staff":
        return "/app/staff-dashboard";
      case "team_manager":
        return "/app/team-manager-dashboard";
    }
  }
  return "/app"; // Fallback
};


