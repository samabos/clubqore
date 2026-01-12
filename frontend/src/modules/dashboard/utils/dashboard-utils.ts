// Dashboard Utilities

import type { TrainingSession, Match } from '@/api/parent';
import type { DashboardEvent } from '../types';

/**
 * Combine and sort training sessions and matches into a unified event list
 */
export function combineAndSortEvents(
  trainingSessions: TrainingSession[],
  matches: Match[]
): DashboardEvent[] {
  const events: DashboardEvent[] = [
    ...trainingSessions.map((ts) => ({
      id: ts.id,
      type: 'training' as const,
      date: ts.date,
      start_time: ts.start_time,
      end_time: ts.end_time,
      location: ts.location,
      team_name: ts.team_name,
      child_first_name: ts.child_first_name,
      child_last_name: ts.child_last_name,
      title: ts.title,
    })),
    ...matches.map((m) => ({
      id: m.id,
      type: 'match' as const,
      date: m.date,
      start_time: m.start_time,
      end_time: m.end_time,
      location: m.location,
      team_name: m.team_name,
      child_first_name: m.child_first_name,
      child_last_name: m.child_last_name,
      opponent: m.opponent,
      is_home: m.is_home,
    })),
  ];

  // Sort by date and time (soonest first)
  return events.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.start_time}`);
    const dateB = new Date(`${b.date}T${b.start_time}`);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Get status badge variant for invoice status
 */
export function getInvoiceStatusVariant(status: string) {
  switch (status) {
    case 'paid':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
}
