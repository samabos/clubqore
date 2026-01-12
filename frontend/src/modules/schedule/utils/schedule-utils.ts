import type { TrainingSession, SessionType } from "@/types/training-session";
import type { Match, MatchType } from "@/types/match";
import type {
  ScheduleItem,
  TrainingScheduleItem,
  MatchScheduleItem,
  ScheduleItemDisplay,
  ScheduleStatus,
} from "../types/schedule-types";

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
      teams: [item.data.home_team_name, opponentName].filter(Boolean),
      color: getMatchColor(item.data.match_type),
      badge: item.data.match_type,
      badgeColor: getMatchBadgeColor(item.data.match_type),
      icon: "trophy",
    };
  }
}

// Color coding for calendar items (background colors)
export function getTrainingColor(sessionType: SessionType): string {
  switch (sessionType) {
    case "training":
      return "bg-blue-500";
    case "practice":
      return "bg-green-500";
    case "conditioning":
      return "bg-orange-500";
    case "tactical":
      return "bg-purple-500";
    case "friendly":
      return "bg-pink-500";
    default:
      return "bg-gray-500";
  }
}

export function getMatchColor(matchType: MatchType): string {
  switch (matchType) {
    case "league":
      return "bg-blue-600";
    case "cup":
      return "bg-purple-600";
    case "tournament":
      return "bg-orange-600";
    case "scrimmage":
      return "bg-green-600";
    case "friendly":
      return "bg-pink-600";
    default:
      return "bg-gray-600";
  }
}

// Badge colors (for cards and labels)
export function getTrainingBadgeColor(sessionType: SessionType): string {
  switch (sessionType) {
    case "training":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "practice":
      return "bg-green-100 text-green-700 border-green-200";
    case "conditioning":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "tactical":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "friendly":
      return "bg-pink-100 text-pink-700 border-pink-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getMatchBadgeColor(matchType: MatchType): string {
  switch (matchType) {
    case "league":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "cup":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "tournament":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "scrimmage":
      return "bg-green-100 text-green-800 border-green-300";
    case "friendly":
      return "bg-pink-100 text-pink-800 border-pink-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

// Status colors (shared between training and matches)
export function getStatusColor(status: ScheduleStatus): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "published":
      return "bg-green-100 text-green-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700";
    case "completed":
      return "bg-purple-100 text-purple-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
