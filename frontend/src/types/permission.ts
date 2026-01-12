export interface Resource {
  id: number;
  name: string;
  display_name: string;
  type: 'page' | 'menu' | 'feature' | 'api';
  path: string | null;
  parent_id: number | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
}

export interface RolePermission {
  id?: number;
  role_id: number;
  resource_id: number;
  resource_name?: string;
  resource_display_name?: string;
  resource_type?: string;
  resource_path?: string;
  resource_icon?: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
}

export interface PermissionMatrixEntry {
  resource_id: number;
  resource_name: string;
  resource_display_name: string;
  resource_type: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
}

export interface RoleWithPermissions {
  role: Role;
  permissions: PermissionMatrixEntry[];
}

export interface PermissionMatrix {
  roles: Role[];
  resources: Resource[];
  matrix: RoleWithPermissions[];
}

export type ResourceType = 'page' | 'menu' | 'feature' | 'api';

export interface CreateResourceData {
  name: string;
  display_name: string;
  type: ResourceType;
  path?: string | null;
  parent_id?: number | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateResourceData {
  name?: string;
  display_name?: string;
  type?: ResourceType;
  path?: string | null;
  parent_id?: number | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdatePermissionData {
  can_view?: boolean;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  is_active?: boolean;
}

export interface BulkUpdatePermissionData {
  resource_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active?: boolean;
}
