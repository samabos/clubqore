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

export async function createChild(
  childData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    position: string | null;
    medicalInfo: string | null;
    emergencyContact: string | null;
    phone: string | null;
    address: string | null;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/parent/children`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: 'include',
    body: JSON.stringify(childData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add child');
  }

  return await response.json();
}

export async function updateChildDetails(
  childId: string,
  updateData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    position: string | null;
    medicalInfo: string | null;
    emergencyContact: string | null;
    phone: string | null;
    address: string | null;
  }
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/parent/children/${childId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update child information');
  }

  return await response.json();
}
