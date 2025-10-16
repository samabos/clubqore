import { Club, UserClub, ClubSearchParams, ClubSearchResponse, ClubBrowseResponse, CreateInviteCodeRequest, InviteCode, UpdateClubRequest } from '@/types/club';
import { CreateClubRequest } from '@/types/membership';
// ClubQore Clubs API

import { apiClient } from './base';

// Clubs API functions
export const clubsAPI = {
  // Create a new club
  createClub: async (data: CreateClubRequest): Promise<Club> => {
    const response = await apiClient('/clubs', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create club');
    }

    const result = await response.json();
    return result.club;
  },

  // Get current user's club (for club managers)
  getMyClub: async (): Promise<Club> => {
    const response = await apiClient('/clubs/my-club');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to get club');
    }

    const result = await response.json();
    return result.club;
  },
  // Get club details by ID
  getClub: async (clubId: number): Promise<Club> => {
    const response = await apiClient(`/clubs/${clubId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get club details');
    }

    const result = await response.json();
    return result.club;
  },

  // Update club information (club managers only)
  updateClub: async (clubId: number, data: UpdateClubRequest): Promise<Club> => {
    const response = await apiClient(`/clubs/${clubId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update club');
    }

    const result = await response.json();
    return result.club;
  },

  // Get current user's clubs
  getUserClubs: async (): Promise<UserClub[]> => {
    const response = await apiClient('/clubs/user');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user clubs');
    }

    const result = await response.json();
    return result.clubs;
  },

  // Get user's clubs by ID
  getUserClubsById: async (userId: string): Promise<UserClub[]> => {
    const response = await apiClient(`/clubs/user/${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user clubs');
    }

    const result = await response.json();
    return result.clubs;
  },

  // Search clubs with filters and pagination
  searchClubs: async (params: ClubSearchParams): Promise<ClubSearchResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params.q) searchParams.append('q', params.q);
    if (params.category) searchParams.append('category', params.category);
    if (params.location) searchParams.append('location', params.location);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient(`/clubs/search?${searchParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search clubs');
    }

    return response.json();
  },

  // Browse clubs by category with featured clubs
  browseClubs: async (limit?: number): Promise<ClubBrowseResponse> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient(`/clubs/browse${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to browse clubs');
    }

    return response.json();
  },

  // Create invite code for club
  createInviteCode: async (clubId: number, data: CreateInviteCodeRequest): Promise<InviteCode> => {
    const response = await apiClient(`/clubs/${clubId}/invite-codes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invite code');
    }

    const result = await response.json();
    return result.inviteCode;
  },

  // Get club invite codes
  getInviteCodes: async (clubId: number): Promise<InviteCode[]> => {
    const response = await apiClient(`/clubs/${clubId}/invite-codes`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invite codes');
    }

    const result = await response.json();
    return result.inviteCodes;
  },

  // Deactivate invite code
  deactivateInviteCode: async (codeId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient(`/clubs/invite-codes/${codeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deactivate invite code');
    }

    return response.json();
  },
};
