import { apiClient } from '@/api/base';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Change password for the logged-in user
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const response = await apiClient('/profile/change-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }

  return response.json();
}
