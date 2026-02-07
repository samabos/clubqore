import { apiClient } from "@/api/base";
import { CreateClubRequest } from "../types/component-types";
import { Club } from "../../../types/club";

// Get the current user's club
export const getMyClub = async (): Promise<Club> => {
  const response = await apiClient("/clubs/my-club");
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch club");
  }

  const data = await response.json();
  console.log('🔍 getMyClub API response:', data);
  
  // Handle different response structures
  if (data.data) {
    return data.data;
  } else if (data.club) {
    return data.club;
  } else if (data) {
    return data;
  } else {
    console.error('🔍 Unexpected API response structure:', data);
    throw new Error('Invalid API response structure');
  }
};

// Get club details by ID
export const getClub = async (clubId: number): Promise<Club> => {
  const response = await apiClient(`/clubs/${clubId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch club details");
  }

  const data = await response.json();
  console.log('🔍 getClub API response:', data);
  
  // Handle different response structures
  if (data.data) {
    return data.data;
  } else if (data.club) {
    return data.club;
  } else if (data) {
    return data;
  } else {
    console.error('🔍 Unexpected API response structure:', data);
    throw new Error('Invalid API response structure');
  }
};

// Create a new club
export const createClub = async (clubData: CreateClubRequest): Promise<Club> => {
  const response = await apiClient("/clubs", {
    method: "POST",
    body: JSON.stringify(clubData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create club");
  }

  const data = await response.json();
  return data.data;
};

// Update an existing club
export const updateClub = async (
  clubId: number,
  clubData: CreateClubRequest
): Promise<Club> => {
  const response = await apiClient(`/clubs/${clubId}`, {
    method: "PUT",
    body: JSON.stringify(clubData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update club");
  }

  const data = await response.json();
  return data.data;
};

// Upload club logo
export const uploadClubLogo = async (
  clubId: number,
  logoData: string
): Promise<{ logoUrl: string }> => {
  const response = await apiClient(`/clubs/${clubId}/logo`, {
    method: "POST",
    body: JSON.stringify({ logoData }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to upload logo");
  }

  const data = await response.json();
  return data.data;
};

// Get club statistics for dashboard
export const getClubStats = async (): Promise<{
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  newThisMonth: number;
  upcomingSessions: number;
  monthlyGoals: {
    target: number;
    current: number;
    percentage: number;
  };
}> => {
  const response = await apiClient("/clubs/stats");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch club statistics");
  }

  const data = await response.json();
  return data.data;
};

// Get recent members for dashboard
export const getRecentMembers = async (limit: number = 5): Promise<Array<{
  id: number;
  name: string;
  email: string;
  joinDate: string;
  status: string;
  avatar?: string;
}>> => {
  const response = await apiClient(`/clubs/recent-members?limit=${limit}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch recent members");
  }

  const data = await response.json();
  return data.data;
};

// Get upcoming sessions for dashboard
export const getUpcomingSessions = async (): Promise<Array<{
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  participants: number;
  maxParticipants: number;
}>> => {
  const response = await apiClient("/clubs/upcoming-sessions");
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch upcoming sessions");
  }

  const data = await response.json();
  return data.data;
};

// Get club alerts/notifications
export const getClubAlerts = async (): Promise<Array<{
  id: number;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}>> => {
  const response = await apiClient("/clubs/alerts");
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch club alerts");
  }

  const data = await response.json();
  return data.data;
};
