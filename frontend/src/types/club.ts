import { Address } from './common';

export interface Club {
  id: number;
  name: string;
  description?: string;
  clubType: string;
  email?: string;
  phone?: string;
  address?: Address | string; // Support both new Address object and legacy string
  website?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  settings?: {
    membership_fee?: number;
    requires_approval?: boolean;
    public_visibility?: boolean;
    allow_child_members?: boolean;
  };
  isActive: boolean;
  verified: boolean;
  memberCount: number;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  membershipCapacity: number; // Maximum number of members allowed
  foundedYear: number; // Year the club was founded
}

export interface ClubSummary {
  id: string;
  name: string;
  clubType: string;
  description?: string;
  address?: string;
  verified: boolean;
  memberCount: number;
  logoUrl?: string;
  distance?: number; // If location-based search
}

export interface ClubSearchParams {
  q?: string; // Search query
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface ClubSearchResponse {
  clubs: ClubSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClubBrowseResponse {
  featured: ClubSummary[];
  byCategory: {
    [key: string]: ClubSummary[];
  };
  recommended?: ClubSummary[];
}

export interface UserClub {
  id: string;
  name: string;
  clubType: string;
  role: 'club_manager' | 'member';
  isActive: boolean;
  joinedAt: string;
}

export interface CreateInviteCodeRequest {
  expires_at?: string; // ISO date-time
  max_uses?: number;
  role?: 'member' | 'parent';
}

export interface InviteCode {
  id: string;
  code: string;
  expires_at: string;
  max_uses?: number;
  used_count: number;
  is_active: boolean;
  role: string;
  created_at: string;
}

export interface UpdateClubRequest {
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  settings?: {
    membership_fee?: number;
    requires_approval?: boolean;
    public_visibility?: boolean;
    allow_child_members?: boolean;
  };
}