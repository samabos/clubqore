/**
 * System Configuration API
 *
 * API actions for managing platform-wide system configurations
 * Requires super_admin role
 */

import { apiClient } from './base';

// Types
export interface SystemConfig {
  id: number;
  key: string;
  value: any;
  category: 'registration' | 'financial' | 'system' | 'notifications';
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'enum';
  validation_rules?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowed_values?: string[];
  };
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemConfigAudit {
  id: number;
  config_id: number;
  key: string;
  old_value: any;
  new_value: any;
  changed_by: number;
  changed_at: string;
  change_reason?: string;
  ip_address?: string;
  user_agent?: string;
  changed_by_first_name?: string;
  changed_by_last_name?: string;
  changed_by_email?: string;
}

export interface CreateConfigPayload {
  key: string;
  value: any;
  category: 'registration' | 'financial' | 'system' | 'notifications';
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'enum';
  validation_rules?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowed_values?: string[];
  };
  description?: string;
}

export interface UpdateConfigPayload {
  value?: any;
  description?: string;
  validation_rules?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowed_values?: string[];
  };
  change_reason?: string;
}

export interface CacheStats {
  size: number;
  ttl_ms: number;
  keys: string[];
}

/**
 * Get all system configurations (public endpoint for all authenticated users)
 * Use this for client-side features like age restrictions, currency settings, etc.
 */
export async function getAllSystemConfigs(params?: {
  category?: 'registration' | 'financial' | 'system' | 'notifications';
  activeOnly?: boolean;
}): Promise<SystemConfig[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.activeOnly !== undefined) searchParams.append('activeOnly', params.activeOnly.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/system-config/public?${queryString}` : '/api/system-config/public';

  const response = await apiClient(endpoint);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch system configurations');
  }

  const data = await response.json();
  return data.configs;
}

/**
 * Get all system configurations (admin endpoint - requires super_admin role)
 * Use this in admin pages only
 */
export async function getAllSystemConfigsAdmin(params?: {
  category?: 'registration' | 'financial' | 'system' | 'notifications';
  activeOnly?: boolean;
}): Promise<SystemConfig[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.activeOnly !== undefined) searchParams.append('activeOnly', params.activeOnly.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/admin/system-config?${queryString}` : '/api/admin/system-config';

  const response = await apiClient(endpoint);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch system configurations');
  }

  const data = await response.json();
  return data.configs;
}

/**
 * Get a single configuration by ID
 */
export async function getSystemConfigById(id: number): Promise<SystemConfig> {
  const response = await apiClient(`/api/admin/system-config/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Get a single configuration value by key
 */
export async function getSystemConfigByKey(key: string): Promise<{ key: string; value: any }> {
  const response = await apiClient(`/api/admin/system-config/key/${key}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch configuration');
  }

  const data = await response.json();
  return { key: data.key, value: data.value };
}

/**
 * Create a new system configuration
 */
export async function createSystemConfig(payload: CreateConfigPayload): Promise<SystemConfig> {
  const response = await apiClient('/api/admin/system-config', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Update an existing system configuration
 */
export async function updateSystemConfig(id: number, payload: UpdateConfigPayload): Promise<SystemConfig> {
  const response = await apiClient(`/api/admin/system-config/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Delete a system configuration (soft delete)
 */
export async function deleteSystemConfig(id: number): Promise<SystemConfig> {
  const response = await apiClient(`/api/admin/system-config/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Get audit history for a configuration by ID
 */
export async function getConfigAuditHistory(configId: number, limit?: number): Promise<SystemConfigAudit[]> {
  const endpoint = limit
    ? `/api/admin/system-config/${configId}/audit?limit=${limit}`
    : `/api/admin/system-config/${configId}/audit`;

  const response = await apiClient(endpoint);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch audit history');
  }

  const data = await response.json();
  return data.history;
}

/**
 * Get audit history by configuration key
 */
export async function getConfigAuditHistoryByKey(key: string, limit?: number): Promise<SystemConfigAudit[]> {
  const endpoint = limit
    ? `/api/admin/system-config/key/${key}/audit?limit=${limit}`
    : `/api/admin/system-config/key/${key}/audit`;

  const response = await apiClient(endpoint);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch audit history');
  }

  const data = await response.json();
  return data.history;
}

/**
 * Clear configuration cache
 */
export async function clearSystemConfigCache(): Promise<void> {
  const response = await apiClient('/api/admin/system-config/cache/clear', {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear cache');
  }
}

/**
 * Get cache statistics
 */
export async function getSystemConfigCacheStats(): Promise<CacheStats> {
  const response = await apiClient('/api/admin/system-config/cache/stats');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch cache stats');
  }

  const data = await response.json();
  return data.stats;
}
