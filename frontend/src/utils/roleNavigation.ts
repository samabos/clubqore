import { AuthUser, UserRole } from "../types/auth";

/**
 * Get the default route for a user based on their role
 */
export const getDefaultRouteByRole = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "/app/admin-dashboard";
    case "club_manager":
      return "/app/club-manager-dashboard";
    case "member":
      return "/app/member-dashboard";
    case "parent":
      return "/app/parent-dashboard";
    default:
      return "/app"; // Default to welcome page for users without role
  }
};

/**
 * Get the primary role for a user using AuthUser.primaryRole
 */
export const getPrimaryRole = (user: AuthUser ): UserRole => {
  // Use primaryRole from AuthUser if available
  if (user.primaryRole) {
    return user.primaryRole as UserRole;
  }
  
  // Fallback to first role in roles array if available
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0].role as UserRole;
  }
  
  // Fallback to role property
//  if (user.role) {
//    return user.role as UserRole;
//  }
  
  // Return null/undefined to indicate no role (will navigate to welcome page)
  return undefined as unknown as UserRole;
};
