import { apiClient } from './base';

// Define types for parent-child relationships
export interface ChildInfo {
  id: string | number; // child_user_id or generated ID for unregistered children
  name: string;
  firstName: string;
  lastName: string;
  relationship: 'parent' | 'guardian' | 'grandparent' | 'relative' | 'other';
  membershipCode?: string;
  isRegistered: boolean; // true if child has their own account
  dateOfBirth?: string;
  position?: string; // position if child has their own account
}

export interface ParentInfo {
  id: number; // parent_user_id
  name: string;
  relationship: 'parent' | 'guardian' | 'grandparent' | 'relative' | 'other';
  phone?: string;
}

// Member types
export interface ClubMember {
  id: number;
  accountId: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  age?: number;
  status: "Active" | "Inactive" | "Pending";
  joinDate: string;
  membershipType: "member" | "parent";
  profileImage?: string;
  accountNumber: string;
  onboardingCompleted: boolean;
  // Parent-child relationships
  children: ChildInfo[];
  parents: ParentInfo[];
  hasChildren: boolean;
  hasParents: boolean;
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  players: number;
  parents: number;
  completedOnboarding: number;
  newThisMonth: number;
  pendingInvitations: number;
}

export interface ChildData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position?: string;
  medicalInfo?: string;
}

export interface CreateMemberRequest {
  email: string;
  password?: string;
  role: 'member' | 'parent';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  position?: string;
  parentPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  medicalInfo?: string;
  profileImage?: string;
  generatePassword?: boolean;
  sendWelcomeEmail?: boolean;
  children?: ChildData[]; // For parent registration with children
}

export interface CreateMemberResponse {
  success: boolean;
  member: {
    id: number;
    email: string;
    role: string;
    accountNumber: string;
    generatedPassword?: string;
  };
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  children?: ChildData[];
}

export interface UpdateMemberResponse {
  success: boolean;
  member: ClubMember;
}

export interface MembersResponse {
  success: boolean;
  members: ClubMember[];
  total: number;
}

export interface MemberStatsResponse {
  success: boolean;
  stats: MemberStats;
}

// Members API functions
export const membersAPI = {
  // Get all members for a specific club
  getClubMembers: async (clubId: number): Promise<ClubMember[]> => {
    const response = await apiClient(`/clubs/${clubId}/members`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch club members');
    }

    const result: MembersResponse = await response.json();
    return result.members;
  },

  // Get members for the current user's club (for club managers)
  getMyClubMembers: async (): Promise<ClubMember[]> => {
    const response = await apiClient('/clubs/my-club/members');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch club members');
    }

    const result: MembersResponse = await response.json();
    return result.members;
  },

  // Get member statistics for a club
  getClubMemberStats: async (clubId: number): Promise<MemberStats> => {
    const response = await apiClient(`/clubs/${clubId}/members/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch member statistics');
    }

    const result: MemberStatsResponse = await response.json();
    return result.stats;
  },

  // Get member statistics for the current user's club
  getMyClubMemberStats: async (): Promise<MemberStats> => {
    // First get the club ID from the current user's club
    const clubResponse = await apiClient('/clubs/my-club');
    
    if (!clubResponse.ok) {
      const error = await clubResponse.json();
      throw new Error(error.error || 'Failed to fetch club information');
    }

    const clubResult = await clubResponse.json();
    const clubId = clubResult.club.id;

    // Then get the stats for that club
    return membersAPI.getClubMemberStats(clubId);
  },

  // Create a new member for a specific club
  createClubMember: async (clubId: number, memberData: CreateMemberRequest): Promise<CreateMemberResponse> => {
    const response = await apiClient(`/clubs/${clubId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create club member');
    }

    return await response.json();
  },

  // Create a new member for the current user's club (for club managers)
  createMyClubMember: async (memberData: CreateMemberRequest): Promise<CreateMemberResponse> => {
    const response = await apiClient('/clubs/my-club/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create member');
    }

    return await response.json();
  },

  // Get a specific member by ID
  getMemberById: async (memberId: number): Promise<ClubMember> => {
    const response = await apiClient(`/clubs/my-club/members/${memberId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch member');
    }

    const result = await response.json();
    return result.member;
  },

  // Update a member for the current user's club
  updateMyClubMember: async (memberId: number, memberData: UpdateMemberRequest): Promise<UpdateMemberResponse> => {
    const response = await apiClient(`/clubs/my-club/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to update member');
    }

    return await response.json();
  },
};
