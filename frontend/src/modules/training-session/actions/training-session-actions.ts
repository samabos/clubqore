import { apiClient } from '@/api/base';
import type {
  TrainingSession,
  CreateTrainingSessionRequest,
  UpdateTrainingSessionRequest,
  TrainingSessionFilters,
  TrainingSessionResponse
} from '@/types/training-session';

const BASE_URL = '/training-sessions';

export async function fetchTrainingSessions(filters?: TrainingSessionFilters): Promise<TrainingSession[]> {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.season_id) params.append('season_id', filters.season_id.toString());
  if (filters?.team_id) params.append('team_id', filters.team_id.toString());
  if (filters?.from_date) params.append('from_date', filters.from_date);
  if (filters?.to_date) params.append('to_date', filters.to_date);

  // Always explicitly send expand parameter to avoid backend default behavior
  if (filters?.expand !== undefined) {
    params.append('expand', filters.expand ? 'true' : 'false');
  }

  const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
  const response = await apiClient(url);

  if (!response.ok) {
    throw new Error('Failed to fetch training sessions');
  }

  const data: TrainingSessionResponse = await response.json();
  return data.sessions || [];
}

export async function fetchUpcomingTrainingSessions(limit: number = 10): Promise<TrainingSession[]> {
  const response = await apiClient(`${BASE_URL}/upcoming?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch upcoming training sessions');
  }

  const data: TrainingSessionResponse = await response.json();
  return data.sessions || [];
}

export async function fetchTrainingSession(sessionId: number): Promise<TrainingSession> {
  const response = await apiClient(`${BASE_URL}/${sessionId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch training session');
  }

  const data: TrainingSessionResponse = await response.json();
  if (!data.session) {
    throw new Error('Training session not found');
  }

  return data.session;
}

export async function createTrainingSession(sessionData: CreateTrainingSessionRequest): Promise<number> {
  const response = await apiClient(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error creating training session:', error);

    // Handle Fastify validation errors
    if (error.validation) {
      const validationErrors = error.validation.map((v: { instancePath?: string; message?: string }) =>
        `${v.instancePath || 'body'}: ${v.message}`
      ).join(', ');
      throw new Error(`Validation error: ${validationErrors}`);
    }

    throw new Error(error.message || 'Failed to create training session');
  }

  const data: TrainingSessionResponse = await response.json();
  if (!data.session_id) {
    throw new Error('Failed to get session ID from response');
  }

  return data.session_id;
}

export async function updateTrainingSession(
  sessionId: number,
  sessionData: UpdateTrainingSessionRequest
): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error updating training session:', error);

    // Handle Fastify validation errors
    if (error.validation) {
      const validationErrors = error.validation.map((v: { instancePath?: string; message?: string }) =>
        `${v.instancePath || 'body'}: ${v.message}`
      ).join(', ');
      throw new Error(`Validation error: ${validationErrors}`);
    }

    throw new Error(error.message || 'Failed to update training session');
  }
}

export async function deleteTrainingSession(sessionId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete training session');
  }
}

export async function publishTrainingSession(sessionId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${sessionId}/publish`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish training session');
  }
}

export async function cancelTrainingSession(sessionId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${sessionId}/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel training session');
  }
}
