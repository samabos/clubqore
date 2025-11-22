import { apiClient } from "@/api/base";
import { handleApiError } from "@/lib/errors";
import {
  Team,
  TeamWithDetails,
  TeamManager,
  TeamMember,
  CreateTeamRequest,
  UpdateTeamRequest,
  AssignManagerRequest,
  AssignMemberRequest,
  TeamManagerPersonnel
} from "../types";

// Load available personnel for team management
export const loadAvailablePersonnel = async (clubId: number): Promise<TeamManagerPersonnel[]> => {
  try {
    const response = await apiClient(`/clubs/${clubId}/personnel/team-managers`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to load personnel");
    }

    const data = await response.json();
    
    // The endpoint already returns only team managers, no need to filter
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("Invalid response format from personnel endpoint");
    }
    
    return data.data as TeamManagerPersonnel[];
  } catch (error) {
    console.error("Error loading personnel:", error);
    throw error;
  }
};

// Fetch all teams for the user's club
export const fetchTeams = async (): Promise<Team[]> => {
  try {
    const response = await apiClient('/teams');
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch teams: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
      const data = await response.json();
      console.log(data);
    return data.data || [];
  } catch (error) {
    console.error('Error in fetchTeams API call:', error);
    throw error;
  }
};

// Fetch team by ID with managers and members
export const fetchTeamById = async (teamId: number): Promise<TeamWithDetails> => {
  const response = await apiClient(`/teams/${teamId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch team');
  }
  
  const data = await response.json();
  return data.data;
};

// Create a new team
export const createTeam = async (teamData: CreateTeamRequest): Promise<{ team_id: number }> => {
  try {
    const response = await apiClient('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    if (!response.ok) {
      let errorMessage = `Failed to create team: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in createTeam API call:', error);
    throw error;
  }
};

// Update team
export const updateTeam = async (teamId: number, teamData: UpdateTeamRequest): Promise<{ success: boolean }> => {
  const response = await apiClient(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(teamData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update team');
  }
  
  const data = await response.json();
  return data;
};

// Delete team
export const deleteTeam = async (teamId: number): Promise<{ success: boolean }> => {
  console.log('🗑️ Deleting team with ID:', teamId, 'Type:', typeof teamId);
  
  const response = await apiClient(`/teams/${teamId}`, {
    method: 'DELETE',
  });
  
  console.log('🗑️ Delete response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('🗑️ Delete error response:', errorData);
    throw new Error(errorData.message || 'Failed to delete team');
  }
  
  const data = await response.json();
  console.log('🗑️ Delete success response:', data);
  return data;
};

// Assign team manager
export const assignTeamManager = async (teamId: number, request: AssignManagerRequest): Promise<{ success: boolean }> => {
  const response = await apiClient(`/teams/${teamId}/managers`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to assign team manager');
  }
  
  const data = await response.json();
  return data;
};

// Remove team manager
export const removeTeamManager = async (teamId: number, userId: number): Promise<{ success: boolean }> => {
  const response = await apiClient(`/teams/${teamId}/managers/${userId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove team manager');
  }
  
  const data = await response.json();
  return data;
};

// Get team managers
export const fetchTeamManagers = async (teamId: number): Promise<TeamManager[]> => {
  const response = await apiClient(`/teams/${teamId}/managers`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch team managers');
  }
  
  const data = await response.json();
  return data.data;
};

// Assign member to team
export const assignMemberToTeam = async (teamId: number, request: AssignMemberRequest): Promise<{ success: boolean }> => {
  console.log('🔍 Frontend: Assigning member to team:', { teamId, request });
  console.log('🔍 Frontend: Request body will be:', JSON.stringify(request));

  const response = await apiClient(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = await response.json();
  return data;
};

// Remove member from team
export const removeMemberFromTeam = async (teamId: number, memberId: number): Promise<{ success: boolean }> => {
  const response = await apiClient(`/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove member from team');
  }
  
  const data = await response.json();
  return data;
};

// Get team members
export const fetchTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
  const response = await apiClient(`/teams/${teamId}/members`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch team members');
  }
  
  const data = await response.json();
  return data.data;
};

// Get assigned players in club
export const fetchAssignedChildrenInClub = async (): Promise<number[]> => {
  const response = await apiClient('/teams/assigned-children');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch assigned players in club');
  }
  
  const data = await response.json();
  return data.data || [];
};
