import { BillingSettings, UpdateBillingSettingsRequest } from '@/types/billing';
import { apiClient } from '@/api/base';

export interface Club {
  id: number;
  name: string;
  club_type: string;
  verified: boolean;
  created_at: string;
}

/**
 * Fetch all clubs for super admin dropdown
 */
export async function fetchAllClubs(): Promise<Club[]> {
  const response = await apiClient(`/admin/clubs`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch clubs");
  }

  const data = await response.json();
  return data.clubs;
}

/**
 * Get billing settings for any club (super admin only)
 */
export async function adminFetchBillingSettings(clubId: number): Promise<BillingSettings> {
  const response = await apiClient(`/admin/clubs/${clubId}/billing/settings`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch billing settings");
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update billing settings for any club (super admin only)
 */
export async function adminUpdateBillingSettings(
  clubId: number,
  settingsData: UpdateBillingSettingsRequest
): Promise<BillingSettings> {
  // Transform data to match backend schema expectations
  const transformedData = {
    ...settingsData,
    // Convert empty array to null for default_invoice_items
    default_invoice_items:
      settingsData.default_invoice_items && settingsData.default_invoice_items.length > 0
        ? settingsData.default_invoice_items
        : null,
  };

  const response = await apiClient(`/admin/clubs/${clubId}/billing/settings`, {
    method: "PUT",
    body: JSON.stringify(transformedData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update billing settings");
  }

  const data = await response.json();
  return data.settings;
}
