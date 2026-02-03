import { apiClient } from "@/api/base";

export interface CreateParentInviteRequest {
  clubId: number;
  inviteeEmail: string;
  inviteeFirstName?: string;
  inviteeLastName?: string;
}

export interface ParentInvite {
  id: number;
  inviteCode: string;
  clubId: number;
  invitedBy: number;
  inviteeEmail: string;
  inviteeFirstName?: string;
  inviteeLastName?: string;
  isUsed: boolean;
  usedBy?: number;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteValidationResult {
  valid: boolean;
  message?: string;
  errorCode?: string;
  invite?: ParentInvite;
  club?: {
    id: number;
    name: string;
    clubType: string;
  };
}

export interface CompleteRegistrationRequest {
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
    };
  };
  account: {
    password: string;
  };
  children: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    position?: string;
    medicalInfo?: string;
  }>;
}

/**
 * Create a new parent invite
 */
export async function createParentInvite(
  data: CreateParentInviteRequest
): Promise<{ success: boolean; invite: ParentInvite }> {
  const response = await apiClient("/api/parent-invites", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create parent invite");
  }

  return await response.json();
}

/**
 * Validate an invite code (public)
 */
export async function validateInviteCode(
  inviteCode: string
): Promise<InviteValidationResult> {
  const response = await apiClient(
    `/api/public/parent-invites/${encodeURIComponent(inviteCode)}/validate`
  );

  if (!response.ok) {
    const error = await response.json();
    return {
      valid: false,
      message: error.message || "Invalid invite code",
      errorCode: error.errorCode,
    };
  }

  return await response.json();
}

/**
 * Get invite details (public)
 */
export async function getInviteDetails(
  inviteCode: string
): Promise<InviteValidationResult> {
  const response = await apiClient(
    `/api/public/parent-invites/${encodeURIComponent(inviteCode)}`
  );

  if (!response.ok) {
    const error = await response.json();
    return {
      valid: false,
      message: error.message || "Failed to get invite details",
      errorCode: error.errorCode,
    };
  }

  return await response.json();
}

/**
 * Complete registration using an invite code (public)
 */
export async function completeInviteRegistration(
  inviteCode: string,
  data: CompleteRegistrationRequest
): Promise<{
  success: boolean;
  message: string;
  userId: number;
  accountNumber: string;
}> {
  const response = await apiClient(
    `/api/public/parent-invites/${encodeURIComponent(inviteCode)}/complete`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to complete registration");
  }

  return await response.json();
}

/**
 * Get all parent invites for a club
 */
export async function getClubInvites(
  clubId: number,
  status?: "active" | "used" | "expired"
): Promise<{ invites: ParentInvite[] }> {
  const query = status ? `?status=${status}` : "";
  const response = await apiClient(`/api/clubs/${clubId}/parent-invites${query}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get club invites");
  }

  return await response.json();
}

/**
 * Cancel an invite
 */
export async function cancelInvite(
  inviteCode: string,
  clubId: number
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient(`/api/parent-invites/${encodeURIComponent(inviteCode)}`, {
    method: "DELETE",
    body: JSON.stringify({ clubId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel invite");
  }

  return await response.json();
}

/**
 * Resend an invite email
 */
export async function resendInvite(
  inviteCode: string,
  clubId: number
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient(
    `/api/parent-invites/${encodeURIComponent(inviteCode)}/resend`,
    {
      method: "POST",
      body: JSON.stringify({ clubId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to resend invite");
  }

  return await response.json();
}
