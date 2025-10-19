import { apiClient } from './base';
import {
  CreateTeamManagerRequest,
  CreateTeamManagerResponse,
  UpdateTeamManagerRequest,
  TeamManager,
  GetTeamManagersResponse
} from '@/types/teamManager';

/**
 * Team Manager API functions
 */
export const teamManagersAPI = {
  /**
   * Create a new team manager (coach) account
   */
  createTeamManager: async (
    clubId: number,
    data: CreateTeamManagerRequest
  ): Promise<CreateTeamManagerResponse> => {
    const response = await apiClient(`/clubs/${clubId}/team-managers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create team manager');
    }

    return await response.json();
  },

  /**
   * Get all team managers for a club
   */
  getTeamManagers: async (clubId: number): Promise<TeamManager[]> => {
    const response = await apiClient(`/clubs/${clubId}/team-managers`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get team managers');
    }

    const result: GetTeamManagersResponse = await response.json();
    return result.data;
  },

  /**
   * Get team manager details by ID
   */
  getTeamManagerById: async (clubId: number, teamManagerId: number): Promise<TeamManager> => {
    const response = await apiClient(`/clubs/${clubId}/team-managers/${teamManagerId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get team manager');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Update team manager details
   */
  updateTeamManager: async (
    clubId: number,
    teamManagerId: number,
    data: UpdateTeamManagerRequest
  ): Promise<TeamManager> => {
    const response = await apiClient(`/clubs/${clubId}/team-managers/${teamManagerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update team manager');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Deactivate team manager
   */
  deactivateTeamManager: async (clubId: number, teamManagerId: number): Promise<void> => {
    const response = await apiClient(`/clubs/${clubId}/team-managers/${teamManagerId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate team manager');
    }
  },
};
