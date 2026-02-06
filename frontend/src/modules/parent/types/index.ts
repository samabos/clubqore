import type { UserChild } from '@/api/profile';

export interface MembershipTierInfo {
  id: number;
  name: string;
  monthlyPrice: number;
  annualPrice: number | null;
  billingFrequency: 'monthly' | 'annual';
}

export interface ChildTeam {
  id: number;
  name: string;
  assigned_at?: string;
  membershipTier?: MembershipTierInfo | null;
}

export interface EnrichedChild extends UserChild {
  teams: ChildTeam[];
  upcomingEventsCount: number;
  pendingInvoices: {
    count: number;
    total: number;
  };
  position?: string | null;
  profileImage?: string | null;
  enrollmentStatus: string;
  age?: number; // Calculated client-side
}

export interface ChildDetailData extends EnrichedChild {
  medicalInfo?: string;
  emergencyContact?: string;
  phone?: string;
  address?: string;
}
