/**
 * Team Manager (Coach) Types
 */

export interface TeamManager {
  id: string;
  accountNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  specialization?: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTeamManagerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  specialization?: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
  sendLoginEmail?: boolean;
}

export interface CreateTeamManagerResponse {
  success: boolean;
  teamManager: {
    id: string;
    accountNumber: string;
    email: string;
    fullName: string;
    role: string;
    clubId: string;
    clubName: string;
    isActive: boolean;
    createdAt: string;
  };
  temporaryPassword: string;
  emailSent: boolean;
  message: string;
}

export interface UpdateTeamManagerRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialization?: string;
  certificationLevel?: string;
  yearsOfExperience?: number;
  bio?: string;
}

export interface GetTeamManagersResponse {
  success: boolean;
  data: TeamManager[];
  count: number;
}
