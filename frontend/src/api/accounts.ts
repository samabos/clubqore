// ClubQore Accounts API
// Updated to match actual backend implementation

import { apiClient } from './base';

// Account types matching backend
export interface GenerateAccountRequest {
  role: 'club_manager' | 'member' | 'parent';
  clubId?: number;
}

export interface GenerateAccountResponse {
  success: boolean;
  accountNumber: string; // Format: CQ2025-12345
  message: string;
}

export interface AccountDetails {
  account: {
    accountNumber: string;
    userId: string;
    role: string;
    clubId?: string;
    clubName?: string;
    isActive: boolean;
    createdAt: string;
    onboardingCompletedAt?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface AccountSearchResult {
  accountNumber: string;
  userFullName: string;
  role: string;
  clubName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccountSearchParams {
  query?: string; // Account number or partial account number
  role?: 'club_manager' | 'member' | 'parent';
}

// Accounts API functions
export const accountsAPI = {
  // Generate new account number (internal use)
  generateAccountNumber: async (data: GenerateAccountRequest): Promise<GenerateAccountResponse> => {
    const response = await apiClient('/accounts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate account number');
    }

    return response.json();
  },

  // Get account details by account number
  getAccountByNumber: async (accountNumber: string): Promise<AccountDetails> => {
    // Validate account number format
    if (!/^CQ\d{9}$/.test(accountNumber)) {
      throw new Error('Invalid account number format');
    }

    const response = await apiClient(`/accounts/${accountNumber}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get account details');
    }

    return response.json();
  },

  // Search accounts (admin/support function)
  searchAccounts: async (params: AccountSearchParams): Promise<AccountSearchResult[]> => {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.role) searchParams.append('role', params.role);

    const response = await apiClient(`/accounts/search?${searchParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search accounts');
    }

    const result = await response.json();
    return result.accounts;
  },

  // Validate account number format (client-side utility)
  validateAccountNumberFormat: (accountNumber: string): boolean => {
    return /^CQ\d{9}$/.test(accountNumber);
  },
};
