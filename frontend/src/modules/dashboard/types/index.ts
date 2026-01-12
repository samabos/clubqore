// Dashboard Module Types

import type { UserChild } from '@/api/profile';
import type { Invoice } from '@/types/billing';
import type { TrainingSession, Match } from '@/api/parent';

/**
 * Combined data structure for parent dashboard
 */
export interface ParentDashboardData {
  children: UserChild[];
  invoices: Invoice[];
  trainingSessions: TrainingSession[];
  matches: Match[];
}

/**
 * Event type for unified display (training sessions + matches)
 */
export interface DashboardEvent {
  id: string;
  type: 'training' | 'match';
  date: string;
  start_time: string;
  end_time?: string;
  location: string;
  team_name: string;
  child_first_name: string | null;
  child_last_name: string | null;

  // Training-specific fields
  title?: string;

  // Match-specific fields
  opponent?: string | null;
  is_home?: boolean;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalChildren: number;
  upcomingEvents: number;
  pendingInvoices: number;
  nextEventDate?: string;
}
