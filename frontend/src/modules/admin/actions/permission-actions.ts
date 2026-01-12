import { tokenManager } from '@/api/secureAuth';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = tokenManager.getAccessToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ===== RESOURCES =====

/**
 * Fetch all resources
 */
export async function fetchResources(): Promise<Resource[]> {
  const response = await fetch(`${API_BASE_URL}/auth/resources`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/resources/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/resources`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
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
  const response = await fetch(`${API_BASE_URL}/auth/resources/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
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
  const response = await fetch(`${API_BASE_URL}/auth/resources/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
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
  const response = await fetch(`${API_BASE_URL}/auth/roles`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/permissions/matrix`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/permissions`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/permissions/${resourceId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
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
  const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/permissions`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
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
  const response = await fetch(`${API_BASE_URL}/auth/roles/${roleId}/permissions/${resourceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete permission');
  }
}
