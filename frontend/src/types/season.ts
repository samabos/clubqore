/**
 * Season types for managing club seasons
 */

export interface Season {
  id: number;
  club_id: number;
  name: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields from backend
  session_count?: number;
  match_count?: number;
}

export interface CreateSeasonRequest {
  name: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  is_active?: boolean;
}

export interface UpdateSeasonRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface SeasonResponse {
  success: boolean;
  season?: Season;
  seasons?: Season[];
  season_id?: number;
  message?: string;
}
