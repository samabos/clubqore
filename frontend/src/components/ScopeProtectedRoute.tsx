import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/stores/authStore';
import { NotAuthorizedPage } from '@/modules/authentication';

interface ScopeProtectedRouteProps {
  /** The resource name to check permission for (e.g., 'parent-dashboard', 'billing') */
  resource: string;
  /** The children to render if authorized */
  children: ReactNode;
  /** Optional: redirect to a specific path instead of showing NotAuthorized page */
  redirectTo?: string;
  /** Optional: the action to check (defaults to 'view') */
  action?: 'view' | 'create' | 'edit' | 'delete';
}

/**
 * Route guard component that checks if the user has the required scope
 * to access a resource. Shows NotAuthorized page or redirects if not allowed.
 *
 * @example
 * // In router:
 * <ScopeProtectedRoute resource="parent-dashboard">
 *   <ParentDashboard />
 * </ScopeProtectedRoute>
 *
 * @example
 * // With redirect:
 * <ScopeProtectedRoute resource="billing" redirectTo="/app">
 *   <BillingPage />
 * </ScopeProtectedRoute>
 *
 * @example
 * // Check edit permission:
 * <ScopeProtectedRoute resource="billing" action="edit">
 *   <BillingEditPage />
 * </ScopeProtectedRoute>
 */
export const ScopeProtectedRoute = ({
  resource,
  children,
  redirectTo,
  action = 'view',
}: ScopeProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasScope } = usePermission(resource);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // Check if user has the required scope
  const isAuthorized = hasScope(action);

  if (!isAuthorized) {
    // Redirect to specified path or show NotAuthorized page
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <NotAuthorizedPage />;
  }

  // User is authorized, render children
  return <>{children}</>;
};

export default ScopeProtectedRoute;
