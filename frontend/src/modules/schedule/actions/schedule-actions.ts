import {
  fetchTrainingSessions,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  publishTrainingSession,
} from "@/modules/training-session/actions/training-session-actions";
import {
  fetchMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  publishMatch,
} from "@/modules/match/actions/match-actions";
import type { CreateTrainingSessionRequest } from "@/types/training-session";
import type { CreateMatchRequest } from "@/types/match";
import type { ScheduleItem, ScheduleFilters } from "../types/schedule-types";
import { trainingToScheduleItem, matchToScheduleItem } from "../utils/schedule-utils";
import { apiClient } from "@/api/base";

/**
 * Fetch all schedule items (training sessions + matches) in parallel
 * and return as a unified, sorted array
 * @param filters - Optional filters to apply
 * @param expand - Whether to expand recurring sessions into virtual occurrences (default: false for table view)
 */
export async function fetchScheduleItems(
  filters?: ScheduleFilters,
  expand: boolean = false
): Promise<ScheduleItem[]> {
  try {
    // Fetch both in parallel
    const [sessions, matches] = await Promise.all([
      fetchTrainingSessions({ ...filters, expand }),
      fetchMatches(filters),
    ]);

    // Transform to unified type
    const sessionItems = sessions.map(trainingToScheduleItem);
    const matchItems = matches.map(matchToScheduleItem);

    // Combine and sort by date, then time
    const combined = [...sessionItems, ...matchItems];
    combined.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.start_time.localeCompare(b.start_time);
    });

    return combined;
  } catch (error) {
    console.error("Error fetching schedule items:", error);
    throw error;
  }
}

// Training session CRUD operations (re-export for convenience)
export async function createScheduleTrainingSession(
  data: CreateTrainingSessionRequest
): Promise<number> {
  return createTrainingSession(data);
}

export async function updateScheduleTrainingSession(
  sessionId: number,
  data: CreateTrainingSessionRequest
): Promise<void> {
  return updateTrainingSession(sessionId, data);
}

export async function deleteScheduleTrainingSession(
  sessionId: number
): Promise<void> {
  return deleteTrainingSession(sessionId);
}

export async function publishScheduleTrainingSession(
  sessionId: number
): Promise<void> {
  return publishTrainingSession(sessionId);
}

// Match CRUD operations (re-export for convenience)
export async function createScheduleMatch(
  data: CreateMatchRequest
): Promise<number> {
  return createMatch(data);
}

export async function updateScheduleMatch(
  matchId: number,
  data: CreateMatchRequest
): Promise<void> {
  return updateMatch(matchId, data);
}

export async function deleteScheduleMatch(matchId: number): Promise<void> {
  return deleteMatch(matchId);
}

export async function publishScheduleMatch(matchId: number): Promise<void> {
  return publishMatch(matchId);
}

export async function cancelScheduleTrainingSession(sessionId: number): Promise<void> {
  const { cancelTrainingSession } = await import("@/modules/training-session/actions/training-session-actions");
  return cancelTrainingSession(sessionId);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function cancelScheduleMatch(_matchId: number): Promise<void> {
  // TODO: Implement cancelMatch in match actions when match cancel endpoint is ready
  throw new Error('Match cancellation not yet implemented');
}

// ============================================================================
// RECURRING EVENT EXCEPTION OPERATIONS (Option B Architecture)
// ============================================================================

/**
 * Modify a single occurrence of a recurring training session
 */
export async function modifyTrainingOccurrence(
  sessionId: number,
  occurrenceDate: string,
  updates: Partial<CreateTrainingSessionRequest>
): Promise<void> {
  const response = await apiClient(
    `/training-sessions/${sessionId}/occurrences/${occurrenceDate}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to modify occurrence');
  }
}

/**
 * Edit this and all future occurrences (splits series)
 */
export async function editFutureTrainingOccurrences(
  sessionId: number,
  occurrenceDate: string,
  updates: Partial<CreateTrainingSessionRequest>
): Promise<void> {
  const response = await apiClient(
    `/training-sessions/${sessionId}/occurrences/${occurrenceDate}/future`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to edit future occurrences');
  }
}

/**
 * Edit all occurrences in recurring series
 */
export async function editAllTrainingOccurrences(
  sessionId: number,
  updates: Partial<CreateTrainingSessionRequest>
): Promise<void> {
  const response = await apiClient(
    `/training-sessions/${sessionId}/all`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to edit all occurrences');
  }
}
