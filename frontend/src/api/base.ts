// Base API client configuration
import { tokenManager } from './secureAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API client with auth headers and automatic token refresh
export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenManager.getAccessToken();
  
  // Debug token status
  console.log(`🔐 API Request to ${endpoint}:`, {
    hasToken: !!token,
    tokenValid: tokenManager.isTokenValid(),
    tokenLength: token?.length || 0
  });
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle token refresh on 401
    if (response.status === 401 && token) {
      console.log('🔐 Received 401, attempting token refresh...');
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        console.log('🔐 Token refreshed successfully, retrying request...');
        // Retry request with new token
        const newToken = tokenManager.getAccessToken();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return fetch(url, config);
      } else {
        console.log('🔐 Token refresh failed, redirecting to auth...');
        // Refresh failed, redirect to login
        tokenManager.clearTokens();
        window.location.href = '/auth';
        throw new Error('Session expired');
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Refresh access token helper
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    console.log('🔐 No refresh token available');
    return false;
  }

  try {
    console.log('🔐 Attempting token refresh...');
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.log('🔐 Token refresh failed with status:', response.status);
      return false;
    }

    const result = await response.json();
    tokenManager.setTokens(result.accessToken, result.refreshToken);
    console.log('🔐 Token refresh successful');
    return true;
  } catch (error) {
    console.error('🔐 Token refresh failed:', error);
    return false;
  }
};
