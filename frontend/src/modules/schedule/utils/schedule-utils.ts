import type { TrainingSession, SessionType } from "@/types/training-session";
import type { Match, MatchType } from "@/types/match";
// SessionType and MatchType are used in parentEventToScheduleItem for type casting
import type {
  ScheduleItem,
  TrainingScheduleItem,
  MatchScheduleItem,
  ScheduleItemDisplay,
  ScheduleStatus,
} from "../types/schedule-types";

// Child info for parent events
export interface ParentChildInfo {
  first_name: string | null;
  last_name: string | null;
}

// Parent API event format (used in dashboard and parent schedule)
export interface ParentEventData {
  id: string;
  type: 'training' | 'match';
  date: string;
  start_time: string;
  end_time?: string | null;
  location: string;
  team_name: string;
  child_first_name?: string | null;
  child_last_name?: string | null;
  children?: ParentChildInfo[] | null; // Array of all children for this event

  // Training-specific fields
  title?: string;
  session_type?: string; // actual session type from backend

  // Match-specific fields
  opponent?: string | null;
  is_home?: boolean;
  match_type?: string; // actual match type from backend
}

// Type guards
export function isTrainingItem(
  item: ScheduleItem
): item is TrainingScheduleItem {
  return item.type === "training";
}

export function isMatchItem(item: ScheduleItem): item is MatchScheduleItem {
  return item.type === "match";
}

// Transformation utilities
export function trainingToScheduleItem(
  session: TrainingSession
): TrainingScheduleItem {
  return {
    type: "training",
    id: session.id,
    date: session.date,
    start_time: session.start_time,
    end_time: session.end_time,
    season_id: session.season_id,
    status: session.status as ScheduleStatus,
    created_at: session.created_at,
    updated_at: session.updated_at,
    season_name: session.season_name,
    data: session,
  };
}

export function matchToScheduleItem(match: Match): MatchScheduleItem {
  return {
    type: "match",
    id: match.id,
    date: match.date,
    start_time: match.start_time,
    end_time: match.end_time,
    season_id: match.season_id,
    status: match.status as ScheduleStatus,
    created_at: match.created_at,
    updated_at: match.updated_at,
    season_name: match.season_name,
    data: match,
  };
}

// Get opponent name for match
export function getOpponentName(match: Match): string {
  // External opponent
  if (match.opponent_name) {
    return match.opponent_name;
  }
  // Internal scrimmage
  if (match.away_team_name) {
    return match.away_team_name;
  }
  return "TBD";
}

// Display helper - converts schedule item to display-ready format
export function getDisplayInfo(item: ScheduleItem): ScheduleItemDisplay {
  if (isTrainingItem(item)) {
    return {
      id: item.data.id,
      type: "training",
      title: item.data.title,
      date: item.data.date,
      start_time: item.data.start_time,
      end_time: item.data.end_time,
      status: item.data.status as ScheduleStatus,
      venue: item.data.location,
      teams: item.data.teams?.map((t) => t.name) || [],
      color: getTrainingColor(item.data.session_type),
      badge: item.data.session_type,
      badgeColor: getTrainingBadgeColor(item.data.session_type),
      icon: "dumbbell",
    };
  } else {
    const opponentName = getOpponentName(item.data);
    return {
      id: item.data.id,
      type: "match",
      title: `${item.data.home_team_name} vs ${opponentName}`,
      date: item.data.date,
      start_time: item.data.start_time,
      end_time: item.data.end_time,
      status: item.data.status as ScheduleStatus,
      venue: item.data.venue,
      teams: [item.data.home_team_name, opponentName].filter((t): t is string => Boolean(t)),
      color: getMatchColor(item.data.match_type),
      badge: item.data.match_type,
      badgeColor: getMatchBadgeColor(item.data.match_type),
      icon: "trophy",
    };
  }
}

// Color coding for calendar items (background colors)
// Training sessions: deep distinct colors
// Matches: deep distinct colors
export function getTrainingColor(sessionType: SessionType): string {
  switch (sessionType) {
    case "training":
      return "bg-blue-600";
    case "practice":
      return "bg-indigo-600";
    case "conditioning":
      return "bg-purple-600";
    case "tactical":
      return "bg-violet-600";
    case "friendly":
      return "bg-cyan-600";
    default:
      return "bg-gray-600";
  }
}

export function getMatchColor(matchType: MatchType): string {
  switch (matchType) {
    case "league":
      return "bg-emerald-600";
    case "cup":
      return "bg-teal-600";
    case "tournament":
      return "bg-green-600";
    case "scrimmage":
      return "bg-lime-600";
    case "friendly":
      return "bg-amber-600";
    default:
      return "bg-gray-600";
  }
}

// Badge colors (for cards and labels)
export function getTrainingBadgeColor(sessionType: SessionType): string {
  switch (sessionType) {
    case "training":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "practice":
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    case "conditioning":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "tactical":
      return "bg-violet-100 text-violet-800 border-violet-300";
    case "friendly":
      return "bg-cyan-100 text-cyan-800 border-cyan-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getMatchBadgeColor(matchType: MatchType): string {
  switch (matchType) {
    case "league":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "cup":
      return "bg-teal-100 text-teal-800 border-teal-300";
    case "tournament":
      return "bg-green-100 text-green-800 border-green-300";
    case "scrimmage":
      return "bg-lime-100 text-lime-800 border-lime-300";
    case "friendly":
      return "bg-amber-100 text-amber-800 border-amber-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

// Status colors (shared between training and matches)
export function getStatusColor(status: ScheduleStatus): string {
  switch (status) {
  //  case "draft":
  //    return "bg-gray-100 text-gray-700";
  //  case "published":
  //    return "bg-green-100 text-green-700";
  //  case "scheduled":
  //    return "bg-blue-100 text-blue-700";
  //  case "in_progress":
  //    return "bg-yellow-100 text-yellow-700";
  //  case "completed":
  //    return "bg-purple-100 text-purple-700";
  //  case "cancelled":
  //    return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

// Convert parent API event data to ScheduleItem
// Used by ParentDashboard and other parent views
export function parentEventToScheduleItem(event: ParentEventData): ScheduleItem {
  // Build child names array from children array or fall back to single child fields
  let childNames: string[] | undefined;
  if (event.children && event.children.length > 0) {
    childNames = event.children
      .filter(c => c.first_name && c.last_name)
      .map(c => `${c.first_name} ${c.last_name}`);
  } else if (event.child_first_name && event.child_last_name) {
    childNames = [`${event.child_first_name} ${event.child_last_name}`];
  }

  const baseItem = {
    id: parseInt(event.id),
    date: event.date,
    start_time: event.start_time,
    end_time: event.end_time || null,
    season_id: null,
    status: 'scheduled' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    childNames: childNames && childNames.length > 0 ? childNames : undefined,
  };

  if (event.type === 'training') {
    // Use actual session_type from backend, fallback to 'training'
    const sessionType = (event.session_type || 'training') as SessionType;
    return {
      ...baseItem,
      type: 'training',
      data: {
        id: parseInt(event.id),
        season_id: null,
        club_id: 0,
        title: event.title || 'Training Session',
        description: null,
        session_type: sessionType,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time || '',
        location: event.location,
        coach_id: null,
        max_participants: null,
        status: 'scheduled' as const,
        created_by: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_days: null,
        recurrence_end_date: null,
        parent_session_id: null,
        teams: [{
          id: 0,
          name: event.team_name,
          color: null
        }]
      }
    };
  } else {
    // Use actual match_type from backend, fallback to 'league'
    const matchType = (event.match_type || 'league') as MatchType;
    return {
      ...baseItem,
      type: 'match',
      status: 'scheduled' as const,
      data: {
        id: parseInt(event.id),
        season_id: null,
        club_id: 0,
        match_type: matchType,
        home_team_id: 0,
        away_team_id: null,
        opponent_name: event.opponent || null,
        is_home: event.is_home || false,
        venue: event.location,
        date: event.date,
        start_time: event.start_time,
        end_time: null,
        competition_name: null,
        home_score: null,
        away_score: null,
        status: 'scheduled' as const,
        created_by: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        home_team_name: event.is_home ? event.team_name : (event.opponent || 'TBD'),
        away_team_name: event.is_home ? (event.opponent || 'TBD') : event.team_name
      }
    };
  }
}
