import { apiClient } from '@/api/base';
import type {
  Match,
  MatchEvent,
  CreateMatchRequest,
  UpdateMatchRequest,
  UpdateMatchResultRequest,
  CreateMatchEventRequest,
  MatchFilters,
  MatchResponse,
  MatchEventResponse
} from '@/types/match';

const BASE_URL = '/matches';

export async function fetchMatches(filters?: MatchFilters): Promise<Match[]> {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.season_id) params.append('season_id', filters.season_id.toString());
  if (filters?.team_id) params.append('team_id', filters.team_id.toString());
  if (filters?.match_type) params.append('match_type', filters.match_type);
  if (filters?.from_date) params.append('from_date', filters.from_date);
  if (filters?.to_date) params.append('to_date', filters.to_date);

  // Always explicitly send expand parameter to avoid backend default behavior
  if (filters?.expand !== undefined) {
    params.append('expand', filters.expand ? 'true' : 'false');
  }

  const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
  const response = await apiClient(url);

  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }

  const data: MatchResponse = await response.json();
  return data.matches || [];
}

export async function fetchUpcomingMatches(limit: number = 10): Promise<Match[]> {
  const response = await apiClient(`${BASE_URL}/upcoming?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch upcoming matches');
  }

  const data: MatchResponse = await response.json();
  return data.matches || [];
}

export async function fetchMatch(matchId: number): Promise<Match> {
  const response = await apiClient(`${BASE_URL}/${matchId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch match');
  }

  const data: MatchResponse = await response.json();
  if (!data.match) {
    throw new Error('Match not found');
  }

  return data.match;
}

export async function createMatch(matchData: CreateMatchRequest): Promise<number> {
  const response = await apiClient(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(matchData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create match');
  }

  const data: MatchResponse = await response.json();
  if (!data.match_id) {
    throw new Error('Failed to get match ID from response');
  }

  return data.match_id;
}

export async function updateMatch(matchId: number, matchData: UpdateMatchRequest): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${matchId}`, {
    method: 'PUT',
    body: JSON.stringify(matchData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update match');
  }
}

export async function deleteMatch(matchId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${matchId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete match');
  }
}

export async function publishMatch(matchId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${matchId}/publish`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish match');
  }
}

export async function updateMatchResult(
  matchId: number,
  resultData: UpdateMatchResultRequest
): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${matchId}/result`, {
    method: 'PUT',
    body: JSON.stringify(resultData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update match result');
  }
}

export async function addMatchEvent(matchId: number, eventData: CreateMatchEventRequest): Promise<number> {
  const response = await apiClient(`${BASE_URL}/${matchId}/events`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add match event');
  }

  const data: MatchEventResponse = await response.json();
  if (!data.event_id) {
    throw new Error('Failed to get event ID from response');
  }

  return data.event_id;
}

export async function fetchMatchEvents(matchId: number): Promise<MatchEvent[]> {
  const response = await apiClient(`${BASE_URL}/${matchId}/events`);

  if (!response.ok) {
    throw new Error('Failed to fetch match events');
  }

  const data: MatchEventResponse = await response.json();
  return data.events || [];
}

export async function deleteMatchEvent(eventId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/events/${eventId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete match event');
  }
}
