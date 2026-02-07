import { apiClient } from "@/api/base";
import { ClubMember, CreateMemberRequest, ChildData } from "../types/component-types";
import { handleApiError, NotFoundError } from "@/api/errors";

// Fetch all members for the current club
export const fetchClubMembers = async (): Promise<ClubMember[]> => {
  const response = await apiClient("/clubs/my-club/members");

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = await response.json();
  return data.data || [];
};

// Get a specific member by ID
export const getMemberById = async (memberId: number): Promise<ClubMember> => {
  console.log("🔍 Fetching member with ID:", memberId);
  const response = await apiClient(`/clubs/my-club/members/${memberId}`);

  if (!response.ok) {
    console.error("❌ API Error - Status:", response.status);
    await handleApiError(response);
  }

  const data = await response.json();
  console.log("🔍 API Response:", data);

  if (!data.success || !data.member) {
    throw new NotFoundError("Member");
  }

  return data.member;
};

// Create a new member (parent with children)
export const createMember = async (memberData: CreateMemberRequest): Promise<{ member: ClubMember & { generatedPassword?: string } }> => {
  const response = await apiClient("/clubs/my-club/members", {
    method: "POST",
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.json();
};

export const checkMemberEmailAvailable = async (email: string): Promise<boolean> => {
  if (!email) return false;
  const response = await apiClient(`/auth/email-available?email=${encodeURIComponent(email)}`);
  if (!response.ok) return false;
  const data = await response.json();
  return Boolean(data.available);
};

// Update an existing member
export const updateMember = async (
  memberId: number,
  updateData: {
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    children: ChildData[];
  }
): Promise<void> => {
  const response = await apiClient(`/clubs/my-club/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

// Delete a member
export const deleteMember = async (memberId: number): Promise<void> => {
  const response = await apiClient(`/clubs/my-club/members/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

// Bulk delete members
export const bulkDeleteMembers = async (memberIds: number[]): Promise<void> => {
  const response = await apiClient("/clubs/my-club/members/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ memberIds }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};

// Export members data
export const exportMembers = async (memberIds: number[]): Promise<Blob> => {
  const response = await apiClient("/clubs/my-club/members/export", {
    method: "POST",
    body: JSON.stringify({ memberIds }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.blob();
};

// Soft end a member contract (deactivate)
export const endMemberContract = async (
  memberId: number,
  contractEndDate: string
): Promise<void> => {
  const response = await apiClient(`/clubs/my-club/members/${memberId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Inactive", contractEndDate }),
  });

  if (!response.ok) {
    await handleApiError(response);
  }
};