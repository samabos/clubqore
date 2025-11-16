import { apiClient } from "@/api/base";
import { ClubMember, CreateMemberRequest, ChildData } from "../types/component-types";

// Fetch all members for the current club
export const fetchClubMembers = async (): Promise<ClubMember[]> => {
  const response = await apiClient("/clubs/my-club/members");
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch club members");
  }

  const data = await response.json();
  return data.data || [];
};

// Get a specific member by ID
export const getMemberById = async (memberId: number): Promise<ClubMember> => {
  console.log("🔍 Fetching member with ID:", memberId);
  const response = await apiClient(`/clubs/my-club/members/${memberId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error("❌ API Error:", errorData);
    throw new Error(errorData.message || "Failed to fetch member");
  }

  const data = await response.json();
  console.log("🔍 API Response:", data);
  
  if (!data.success || !data.member) {
    throw new Error("Member not found");
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
    if (response.status === 409) {
      throw new Error('Email already exists');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create member");
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
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update member");
  }
};

// Delete a member
export const deleteMember = async (memberId: number): Promise<void> => {
  const response = await apiClient(`/clubs/my-club/members/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete member");
  }
};

// Bulk delete members
export const bulkDeleteMembers = async (memberIds: number[]): Promise<void> => {
  const response = await apiClient("/clubs/my-club/members/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ memberIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete members");
  }
};

// Export members data
export const exportMembers = async (memberIds: number[]): Promise<Blob> => {
  const response = await apiClient("/clubs/my-club/members/export", {
    method: "POST",
    body: JSON.stringify({ memberIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to export members");
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
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to end contract");
  }
};