// Health API - System health checks
import { apiClient } from './base';

export const healthAPI = {
  // Check system health
  check: async (): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> => {
    const response = await apiClient('/health');

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  },
};