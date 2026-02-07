import { apiClient } from '@/api/base';
import {
  Resource,
  Role,
  RolePermission,
  PermissionMatrix,
  CreateResourceData,
  UpdateResourceData,
  UpdatePermissionData,
  BulkUpdatePermissionData,
} from '@/types/permission';

// ===== RESOURCES =====

/**
 * Fetch all resources
 */
export async function fetchResources(): Promise<Resource[]> {
  const response = await apiClient('/auth/resources');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch resources');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch a single resource by ID
 */
export async function fetchResourceById(id: number): Promise<Resource> {
  const response = await apiClient(`/auth/resources/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch resource');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Create a new resource
 */
export async function createResource(resourceData: CreateResourceData): Promise<Resource> {
  const response = await apiClient('/auth/resources', {
    method: 'POST',
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create resource');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update a resource
 */
export async function updateResource(id: number, resourceData: UpdateResourceData): Promise<Resource> {
  const response = await apiClient(`/auth/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update resource');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a resource
 */
export async function deleteResource(id: number): Promise<void> {
  const response = await apiClient(`/auth/resources/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete resource');
  }
}

// ===== ROLES =====

/**
 * Fetch all roles
 */
export async function fetchRoles(): Promise<Role[]> {
  const response = await apiClient('/auth/roles');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch roles');
  }

  const data = await response.json();
  return data.data;
}

// ===== PERMISSIONS =====

/**
 * Fetch the full permission matrix
 */
export async function fetchPermissionMatrix(): Promise<PermissionMatrix> {
  const response = await apiClient('/auth/permissions/matrix');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch permission matrix');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch permissions for a specific role
 */
export async function fetchRolePermissions(roleId: number): Promise<{ role: Role; permissions: RolePermission[] }> {
  const response = await apiClient(`/auth/roles/${roleId}/permissions`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch role permissions');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update a single role-resource permission
 */
export async function updateRolePermission(
  roleId: number,
  resourceId: number,
  permissions: UpdatePermissionData
): Promise<RolePermission> {
  const response = await apiClient(`/auth/roles/${roleId}/permissions/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(permissions),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update permission');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Bulk update permissions for a role
 */
export async function bulkUpdateRolePermissions(
  roleId: number,
  permissions: BulkUpdatePermissionData[]
): Promise<RolePermission[]> {
  const response = await apiClient(`/auth/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update permissions');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a role permission
 */
export async function deleteRolePermission(roleId: number, resourceId: number): Promise<void> {
  const response = await apiClient(`/auth/roles/${roleId}/permissions/${resourceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete permission');
  }
}
