import { tokenManager } from '@/api/secureAuth';
import type { EnrichedChild, ChildDetailData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchParentChildren(): Promise<EnrichedChild[]> {
  const response = await fetch(`${API_BASE_URL}/parent/children`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch children');
  }

  const data = await response.json();
  return data.children;
}

export async function fetchChildDetails(childId: string): Promise<ChildDetailData> {
  const response = await fetch(`${API_BASE_URL}/parent/children/${childId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch child details');
  }

  const data = await response.json();
  return data.child;
}
