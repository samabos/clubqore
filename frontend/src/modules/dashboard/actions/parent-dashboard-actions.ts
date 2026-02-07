// Parent Dashboard Actions
// Data fetching and business logic for parent dashboard

import { profileAPI, type UserChild } from '@/api/profile';
import { parentAPI, type TrainingSession, type Match } from '@/api/parent';
import { fetchParentInvoices } from '@/modules/billing/actions/billing-actions';
import type { ParentDashboardData } from '../types';
import type { Invoice } from '@/types/billing';

/**
 * Fetch all data needed for the parent dashboard
 * Returns children, invoices, training sessions, and matches
 * Uses individual try-catch to allow partial data loading on error
 */
export async function fetchParentDashboardData(): Promise<ParentDashboardData> {
  let children: UserChild[] = [];
  let invoices: Invoice[] = [];
  let scheduleData: { trainingSessions: TrainingSession[]; matches: Match[] } = { trainingSessions: [], matches: [] };

  // Fetch children
  try {
    children = await profileAPI.getChildren();
  } catch (error) {
    console.error('Failed to fetch children:', error);
  }

  // Fetch invoices
  try {
    invoices = await fetchParentInvoices();
    console.log('Fetched invoices:', invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    // Don't throw - allow dashboard to load with partial data
  }

  // Fetch schedule
  try {
    scheduleData = await parentAPI.getChildrenSchedule();
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
  }

  return {
    children,
    invoices,
    trainingSessions: scheduleData.trainingSessions,
    matches: scheduleData.matches,
  };
}

/**
 * Fetch dashboard data for a specific child
 */
export async function fetchChildDashboardData(childId: string) {
  const [child, scheduleData] = await Promise.all([
    profileAPI.getChildren().then((children) =>
      children.find((c) => c.id === childId)
    ),
    parentAPI.getChildSchedule(childId),
  ]);

  if (!child) {
    throw new Error('Child not found');
  }

  return {
    child,
    trainingSessions: scheduleData.trainingSessions,
    matches: scheduleData.matches,
  };
}
