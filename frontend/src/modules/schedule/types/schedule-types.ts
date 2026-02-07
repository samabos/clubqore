import type { TrainingSession, SessionType } from "@/types/training-session";
import type { Match, MatchType } from "@/types/match";

// Base schedule item interface
export interface BaseScheduleItem {
  id: number;
  date: string;
  start_time: string;
  end_time: string | null;
  season_id: number | null;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
  season_name?: string;
  childNames?: string[]; // For parent view - shows which children the event is for
}

// Schedule item types
export type ScheduleItemType = "training" | "match";

// Unified status type (union of both)
export type ScheduleStatus = "draft" | "scheduled" | "cancelled";

// Discriminated union for schedule items
export interface TrainingScheduleItem extends BaseScheduleItem {
  type: "training";
  data: TrainingSession;
}

export interface MatchScheduleItem extends BaseScheduleItem {
  type: "match";
  data: Match;
}

export type ScheduleItem = TrainingScheduleItem | MatchScheduleItem;

// Filter types
export interface ScheduleFilters {
  type?: ScheduleItemType | "all";
  status?: ScheduleStatus;
  season_id?: number;
  team_id?: number;
  from_date?: string;
  to_date?: string;
  match_type?: MatchType;
  session_type?: SessionType;
}

// Display helper interface
export interface ScheduleItemDisplay {
  id: number;
  type: ScheduleItemType;
  title: string;
  date: string;
  start_time: string;
  end_time: string | null;
  status: ScheduleStatus;
  venue: string | null; // location for training, venue for match
  teams: string[]; // array of team names
  color: string; // for visual distinction
  badge: string; // type badge (training/practice/league/cup, etc.)
  badgeColor: string; // badge background color
  icon: "dumbbell" | "trophy";
}
