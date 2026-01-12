import { apiClient } from '@/api/base';
import type { Season, CreateSeasonRequest, UpdateSeasonRequest, SeasonResponse } from '@/types/season';

const BASE_URL = '/seasons';

export async function fetchSeasons(): Promise<Season[]> {
  const response = await apiClient(BASE_URL);

  if (!response.ok) {
    throw new Error('Failed to fetch seasons');
  }

  const data: SeasonResponse = await response.json();
  return data.seasons || [];
}

export async function fetchActiveSeason(): Promise<Season | null> {
  const response = await apiClient(`${BASE_URL}/active`);

  if (!response.ok) {
    throw new Error('Failed to fetch active season');
  }

  const data: SeasonResponse = await response.json();
  return data.season || null;
}

export async function fetchSeason(seasonId: number): Promise<Season> {
  const response = await apiClient(`${BASE_URL}/${seasonId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch season');
  }

  const data: SeasonResponse = await response.json();
  if (!data.season) {
    throw new Error('Season not found');
  }

  return data.season;
}

export async function createSeason(seasonData: CreateSeasonRequest): Promise<number> {
  const response = await apiClient(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(seasonData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create season');
  }

  const data: SeasonResponse = await response.json();
  if (!data.season_id) {
    throw new Error('Failed to get season ID from response');
  }

  return data.season_id;
}

export async function updateSeason(seasonId: number, seasonData: UpdateSeasonRequest): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${seasonId}`, {
    method: 'PUT',
    body: JSON.stringify(seasonData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update season');
  }
}

export async function deleteSeason(seasonId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${seasonId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete season');
  }
}

export async function setActiveSeason(seasonId: number): Promise<void> {
  const response = await apiClient(`${BASE_URL}/${seasonId}/activate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set active season');
  }
}
