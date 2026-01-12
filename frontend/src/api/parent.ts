// ClubQore Parent API
// API endpoints for parent-specific functionality

import { apiClient } from './base';

// Schedule types
export interface ParentScheduleResponse {
  trainingSessions: TrainingSession[];
  matches: Match[];
}

export interface TrainingSession {
  id: string;
  team_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description?: string;
  session_type: string;
  status: string;
  team_name: string;
  child_first_name: string | null;
  child_last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  team_id: string;
  home_team_id: string;
  away_team_id: string | null;
  opponent: string | null;
  date: string;
  start_time: string;
  end_time?: string;
  location: string;
  is_home: boolean;
  match_type: string;
  competition?: string;
  home_score?: number;
  away_score?: number;
  status: string;
  team_name: string;
  child_first_name: string | null;
  child_last_name: string | null;
  created_at: string;
  updated_at: string;
}

export const parentAPI = {
  /**
   * Get all upcoming events (training sessions and matches) for parent's children
   */
  async getChildrenSchedule(): Promise<ParentScheduleResponse> {
    const response = await apiClient('/parent/schedule');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch children schedule');
    }
    return response.json();
  },

  /**
   * Get schedule for a specific child
   */
  async getChildSchedule(childId: string): Promise<ParentScheduleResponse> {
    const response = await apiClient(`/parent/children/${childId}/schedule`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch child schedule');
    }
    return response.json();
  }
};
