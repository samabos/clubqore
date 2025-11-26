/**
 * Calendar types for unified event display (training sessions + matches)
 */

import { TrainingSession } from './training-session';
import { Match } from './match';

export type CalendarEventType = 'session' | 'match';

export interface CalendarEvent {
  id: number;
  type: CalendarEventType;
  title: string;
  date: string; // ISO date string
  start_time: string; // HH:mm format
  end_time: string | null; // HH:mm format
  location: string | null;
  status: string;
  teams: Array<{
    id: number;
    name: string;
    color: string | null;
  }>;

  // Original event data for detail view
  session?: TrainingSession;
  match?: Match;
}

export interface CalendarFilters {
  team_id?: number;
  from_date?: string;
  to_date?: string;
  event_types?: CalendarEventType[];
  statuses?: string[];
}

export interface CalendarEventGroup {
  date: string; // ISO date string
  events: CalendarEvent[];
}

// Helper function type for converting sessions/matches to calendar events
export type ToCalendarEventFn<T> = (item: T) => CalendarEvent;
