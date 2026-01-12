import { BillingSettings, UpdateBillingSettingsRequest } from '@/types/billing';
import { tokenManager } from '@/api/secureAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  const token = tokenManager.getAccessToken();
  const response = await fetch(`${API_BASE_URL}/admin/clubs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

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
  const token = tokenManager.getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/clubs/${clubId}/billing/settings`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    }
  );

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
  const token = tokenManager.getAccessToken();

  // Transform data to match backend schema expectations
  const transformedData = {
    ...settingsData,
    // Convert empty array to null for default_invoice_items
    default_invoice_items:
      settingsData.default_invoice_items && settingsData.default_invoice_items.length > 0
        ? settingsData.default_invoice_items
        : null,
  };

  const response = await fetch(
    `${API_BASE_URL}/admin/clubs/${clubId}/billing/settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(transformedData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update billing settings");
  }

  const data = await response.json();
  return data.settings;
}
