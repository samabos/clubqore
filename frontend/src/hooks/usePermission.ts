import { useAuth } from '@/stores/authStore';
import { hasScope, canView, canCreate, canEdit, canDelete } from '@/api/secureAuth';

/**
 * Hook to check user permissions for a specific resource
 * Uses scopes embedded in the JWT token
 *
 * @param resource - The resource name (e.g., 'parent-dashboard', 'billing')
 * @returns Object with permission flags
 *
 * @example
 * const { canView, canEdit } = usePermission('billing');
 * if (canView) {
 *   // Show billing page
 * }
 */
export const usePermission = (resource: string) => {
  const { scopes } = useAuth();

  return {
    canView: canView(scopes, resource),
    canCreate: canCreate(scopes, resource),
    canEdit: canEdit(scopes, resource),
    canDelete: canDelete(scopes, resource),
    hasScope: (action: 'view' | 'create' | 'edit' | 'delete') =>
      hasScope(scopes, resource, action),
  };
};

/**
 * Hook to check multiple resources at once
 * Useful for checking access to multiple features
 *
 * @param resources - Array of resource names
 * @returns Object with resource names as keys and permission objects as values
 *
 * @example
 * const permissions = usePermissions(['billing', 'teams', 'members']);
 * if (permissions.billing.canView) {
 *   // Show billing menu item
 * }
 */
export const usePermissions = (resources: string[]) => {
  const { scopes } = useAuth();

  const permissions: Record<
    string,
    {
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }
  > = {};

  for (const resource of resources) {
    permissions[resource] = {
      canView: canView(scopes, resource),
      canCreate: canCreate(scopes, resource),
      canEdit: canEdit(scopes, resource),
      canDelete: canDelete(scopes, resource),
    };
  }

  return permissions;
};

/**
 * Hook to check if user has any of the specified scopes
 *
 * @param requiredScopes - Array of scope strings (e.g., ['billing:view', 'billing:edit'])
 * @returns boolean - true if user has any of the required scopes
 *
 * @example
 * const hasAccess = useHasAnyScope(['billing:view', 'admin-dashboard:view']);
 */
export const useHasAnyScope = (requiredScopes: string[]): boolean => {
  const { scopes } = useAuth();
  return requiredScopes.some((scope) => scopes.includes(scope));
};

/**
 * Hook to check if user has all of the specified scopes
 *
 * @param requiredScopes - Array of scope strings
 * @returns boolean - true if user has all of the required scopes
 *
 * @example
 * const hasFullAccess = useHasAllScopes(['billing:view', 'billing:edit', 'billing:delete']);
 */
export const useHasAllScopes = (requiredScopes: string[]): boolean => {
  const { scopes } = useAuth();
  return requiredScopes.every((scope) => scopes.includes(scope));
};

export default usePermission;
