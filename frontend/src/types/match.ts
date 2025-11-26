/**
 * Match types for managing club matches (internal scrimmages and external opponents)
 */

export type MatchType = 'friendly' | 'league' | 'cup' | 'tournament' | 'scrimmage';

export type MatchStatus = 'draft' | 'published' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';

export interface Match {
  id: number;
  season_id: number | null;
  club_id: number;
  match_type: MatchType;

  // Teams
  home_team_id: number;
  away_team_id: number | null; // Null for external opponents

  // External opponent details (for non-scrimmage matches)
  opponent_name: string | null;
  is_home: boolean; // True if home match, false if away

  venue: string;
  date: string; // ISO date string
  start_time: string; // HH:mm format
  end_time: string | null; // HH:mm format
  competition_name: string | null;

  // Results
  home_score: number | null;
  away_score: number | null;

  status: MatchStatus;
  created_by: number;
  created_at: string;
  updated_at: string;

  // Joined fields from backend
  home_team_name?: string;
  home_team_color?: string | null;
  away_team_name?: string | null;
  away_team_color?: string | null;
  season_name?: string;

  // Related data
  events?: MatchEvent[];
}

export interface MatchEvent {
  id: number;
  match_id: number;
  event_type: MatchEventType;
  minute: number;
  player_id: number | null;
  team_id: number;
  details: string | null;
  created_at: string;

  // Joined fields from backend
  player_first_name?: string;
  player_last_name?: string;
  team_name?: string;
  team_color?: string | null;
}

export interface CreateMatchRequest {
  season_id?: number | null;
  match_type?: MatchType;
  home_team_id: number;
  away_team_id?: number | null;
  opponent_name?: string | null;
  is_home?: boolean;
  venue: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  competition_name?: string | null;
  status?: MatchStatus;
}

export interface UpdateMatchRequest {
  season_id?: number | null;
  match_type?: MatchType;
  home_team_id?: number;
  away_team_id?: number | null;
  opponent_name?: string | null;
  is_home?: boolean;
  venue?: string;
  date?: string;
  start_time?: string;
  end_time?: string | null;
  competition_name?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  status?: MatchStatus;
}

export interface UpdateMatchResultRequest {
  home_score: number;
  away_score: number;
}

export interface CreateMatchEventRequest {
  event_type: MatchEventType;
  minute: number;
  player_id?: number | null;
  team_id: number;
  details?: string | null;
}

export interface MatchFilters {
  status?: MatchStatus;
  season_id?: number;
  team_id?: number;
  match_type?: MatchType;
  from_date?: string;
  to_date?: string;
}

export interface MatchResponse {
  success: boolean;
  match?: Match;
  matches?: Match[];
  match_id?: number;
  message?: string;
}

export interface MatchEventResponse {
  success: boolean;
  event?: MatchEvent;
  events?: MatchEvent[];
  event_id?: number;
  message?: string;
}

// Helper types for displaying match information
export interface MatchWithTeamInfo extends Match {
  // For display purposes
  opponent_display_name: string; // Either away_team_name or opponent_name
  is_scrimmage: boolean;
  result_display?: string; // e.g., "3-1" or "vs ExternalTeam"
}

export interface MatchEventWithPlayer extends MatchEvent {
  player_name?: string;
}
