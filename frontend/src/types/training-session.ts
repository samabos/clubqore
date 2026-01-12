/**
 * Training Session types for managing club training sessions
 */

export type SessionType = 'training' | 'practice' | 'conditioning' | 'tactical' | 'friendly' | 'other';

export type SessionStatus = 'draft' | 'published' | 'scheduled' | 'completed' | 'cancelled';

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface TrainingSession {
  id: number;
  season_id: number | null;
  club_id: number;
  title: string;
  description: string | null;
  session_type: SessionType;
  date: string; // ISO date string
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  location: string | null;
  coach_id: number | null;
  max_participants: number | null;
  status: SessionStatus;
  created_by: number;
  created_at: string;
  updated_at: string;

  // Recurring fields
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_days: number[] | null; // Days of week (0=Sunday, 6=Saturday)
  recurrence_end_date: string | null;
  parent_session_id: number | null;

  // Joined fields from backend
  coach_user_id?: number;
  coach_email?: string;
  coach_first_name?: string;
  coach_last_name?: string;
  season_name?: string;

  // Related data
  teams?: SessionTeam[];
  team_count?: number;
}

export interface SessionTeam {
  id: number;
  name: string;
  color: string | null;
}

export interface CreateTrainingSessionRequest {
  season_id?: number | null;
  title: string;
  description?: string | null;
  session_type?: SessionType;
  date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  coach_id?: number | null;
  max_participants?: number | null;
  status?: SessionStatus;
  team_ids?: number[];

  // Recurring fields
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
}

export interface UpdateTrainingSessionRequest {
  season_id?: number | null;
  title?: string;
  description?: string | null;
  session_type?: SessionType;
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string | null;
  coach_id?: number | null;
  max_participants?: number | null;
  status?: SessionStatus;
  team_ids?: number[];
}

export interface TrainingSessionFilters {
  status?: SessionStatus;
  season_id?: number;
  team_id?: number;
  from_date?: string;
  to_date?: string;
}

export interface TrainingSessionResponse {
  success: boolean;
  session?: TrainingSession;
  sessions?: TrainingSession[];
  session_id?: number;
  message?: string;
}

// Helper type for displaying session with coach name
export interface TrainingSessionWithCoach extends TrainingSession {
  coach_name?: string;
}
