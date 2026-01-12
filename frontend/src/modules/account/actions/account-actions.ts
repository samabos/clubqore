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
  const response = await apiClient.put<ChangePasswordResponse>('/profile/change-password', data);
  return response.data;
}
