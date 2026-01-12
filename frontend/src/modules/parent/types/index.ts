import type { UserChild } from '@/api/profile';

export interface ChildTeam {
  id: number;
  name: string;
  assigned_at?: string;
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
