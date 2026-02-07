import type {
  MembershipTier,
  CreateMembershipTierRequest,
  UpdateMembershipTierRequest,
  MembershipTierStats,
  Subscription,
  SubscriptionFilters,
  SubscriptionStats,
  PaymentMethodsResponse,
  MandateSetupResponse,
  PaymentMethod,
} from "@/types/subscription";
import { apiClient } from "@/api/base";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubscriptionFromBackend(sub: any): Subscription {
  return {
    id: sub.id,
    club_id: sub.clubId ?? sub.club_id,
    parent_user_id: sub.parentUserId ?? sub.parent_user_id,
    child_user_id: sub.childUserId ?? sub.child_user_id,
    membership_tier_id: sub.membershipTierId ?? sub.membership_tier_id,
    team_id: sub.teamId ?? sub.team_id ?? null,
    payment_mandate_id: sub.paymentMandateId ?? sub.payment_mandate_id,
    status: sub.status,
    billing_frequency: sub.billingFrequency ?? sub.billing_frequency,
    billing_day_of_month: sub.billingDayOfMonth ?? sub.billing_day_of_month,
    amount: sub.amount,
    current_period_start: sub.currentPeriodStart ?? sub.current_period_start,
    current_period_end: sub.currentPeriodEnd ?? sub.current_period_end,
    next_billing_date: sub.nextBillingDate ?? sub.next_billing_date,
    failed_payment_count: sub.failedPaymentCount ?? sub.failed_payment_count ?? 0,
    last_failed_payment_date: sub.lastFailedPaymentDate ?? sub.last_failed_payment_date,
    paused_at: sub.pausedAt ?? sub.paused_at,
    resume_date: sub.resumeDate ?? sub.resume_date,
    cancelled_at: sub.cancelledAt ?? sub.cancelled_at,
    cancellation_reason: sub.cancellationReason ?? sub.cancellation_reason,
    created_at: sub.createdAt ?? sub.created_at,
    updated_at: sub.updatedAt ?? sub.updated_at,
    // Flatten nested objects
    tier_name: sub.tier?.name ?? sub.tier_name,
    team_name: sub.team?.name ?? sub.team_name,
    child_first_name: sub.child?.firstName ?? sub.child_first_name,
    child_last_name: sub.child?.lastName ?? sub.child_last_name,
    child_email: sub.child?.email ?? sub.child_email,
    parent_first_name: sub.parent?.firstName ?? sub.parent_first_name,
    parent_last_name: sub.parent?.lastName ?? sub.parent_last_name,
    parent_email: sub.parent?.email ?? sub.parent_email,
    club_name: sub.club?.name ?? sub.club_name,
  };
}

// ==================== MEMBERSHIP TIER ACTIONS (Club Manager) ====================

/**
 * Fetch all membership tiers for the club
 */
export async function fetchMembershipTiers(includeInactive = false): Promise<MembershipTier[]> {
  const queryParams = new URLSearchParams();
  if (!includeInactive) queryParams.append("activeOnly", "true");

  const response = await apiClient(`/club/membership-tiers?${queryParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch membership tiers");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch a single membership tier by ID
 */
export async function fetchMembershipTierById(tierId: number): Promise<MembershipTier> {
  const response = await apiClient(`/club/membership-tiers/${tierId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch membership tier");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Create a new membership tier
 */
export async function createMembershipTier(tierData: CreateMembershipTierRequest): Promise<MembershipTier> {
  const response = await apiClient(`/club/membership-tiers`, {
    method: "POST",
    body: JSON.stringify(tierData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create membership tier");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update an existing membership tier
 */
export async function updateMembershipTier(
  tierId: number,
  tierData: UpdateMembershipTierRequest
): Promise<MembershipTier> {
  const response = await apiClient(`/club/membership-tiers/${tierId}`, {
    method: "PUT",
    body: JSON.stringify(tierData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update membership tier");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a membership tier
 */
export async function deleteMembershipTier(tierId: number): Promise<void> {
  const response = await apiClient(`/club/membership-tiers/${tierId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete membership tier");
  }
}

/**
 * Reorder membership tiers
 */
export async function reorderMembershipTiers(tierIds: number[]): Promise<void> {
  const response = await apiClient(`/club/membership-tiers/reorder`, {
    method: "PUT",
    body: JSON.stringify({ tierIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reorder membership tiers");
  }
}

/**
 * Fetch membership tier statistics
 */
export async function fetchMembershipTierStats(): Promise<MembershipTierStats[]> {
  const response = await apiClient(`/club/membership-tiers/stats`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch tier statistics");
  }

  const data = await response.json();
  return data.data;
}

// ==================== SUBSCRIPTION ACTIONS (Club Manager) ====================

/**
 * Fetch all subscriptions for the club
 */
export async function fetchSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
  const queryParams = new URLSearchParams();

  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.tierId) queryParams.append("tierId", filters.tierId.toString());
  if (filters?.search) queryParams.append("search", filters.search);

  const response = await apiClient(`/club/subscriptions?${queryParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch subscriptions");
  }

  const data = await response.json();
  const subscriptions = data.data || [];
  return subscriptions.map(mapSubscriptionFromBackend);
}

/**
 * Fetch a single subscription by ID
 */
export async function fetchSubscriptionById(subscriptionId: number): Promise<Subscription> {
  const response = await apiClient(`/club/subscriptions/${subscriptionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch subscription");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch subscription statistics
 */
export async function fetchSubscriptionStats(): Promise<SubscriptionStats> {
  const response = await apiClient(`/club/subscriptions/stats`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch subscription statistics");
  }

  const data = await response.json();
  // Map backend field names to frontend expected names
  const stats = data.data;
  return {
    totalSubscriptions: stats.totalActive || 0,
    activeSubscriptions: stats.activeCount || 0,
    pausedSubscriptions: stats.pausedCount || 0,
    cancelledSubscriptions: stats.cancelledCount || 0,
    suspendedSubscriptions: stats.suspendedCount || 0,
    monthlyRecurringRevenue: stats.monthlyRecurringRevenue || 0,
    annualRecurringRevenue: (stats.monthlyRecurringRevenue || 0) * 12,
  };
}

/**
 * Cancel a subscription (club manager)
 */
export async function cancelSubscription(
  subscriptionId: number,
  reason?: string,
  immediate?: boolean
): Promise<void> {
  const response = await apiClient(`/club/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason, immediate }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to cancel subscription");
  }
}

/**
 * Get members available for subscription (no active subscription)
 */
export async function fetchAvailableMembers(): Promise<{ id: number; email: string; first_name: string; last_name: string }[]> {
  const response = await apiClient(`/club/subscriptions/available-members`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch available members");
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Create a subscription for a member (club manager)
 */
export async function createSubscriptionForMember(
  childUserId: number,
  membershipTierId: number,
  billingFrequency?: "monthly" | "annual",
  billingDayOfMonth?: number,
  parentUserId?: number
): Promise<Subscription> {
  const response = await apiClient(`/club/subscriptions`, {
    method: "POST",
    body: JSON.stringify({
      childUserId,
      membershipTierId,
      billingFrequency,
      billingDayOfMonth,
      parentUserId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create subscription");
  }

  const data = await response.json();
  return data.data;
}

// ==================== PARENT SUBSCRIPTION ACTIONS ====================

/**
 * Fetch all subscriptions for the authenticated parent
 */
export async function fetchParentSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
  const queryParams = new URLSearchParams();

  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.clubId) queryParams.append("clubId", filters.clubId.toString());

  const response = await apiClient(`/parent/subscriptions?${queryParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch subscriptions");
  }

  const data = await response.json();
  const subscriptions = data.data || [];
  return subscriptions.map(mapSubscriptionFromBackend);
}

/**
 * Create a new subscription (parent)
 */
export async function createParentSubscription(
  clubId: number,
  childUserId: number,
  membershipTierId: number,
  paymentMandateId?: number,
  billingDayOfMonth?: number,
  billingFrequency?: "monthly" | "annual"
): Promise<Subscription> {
  const response = await apiClient(`/parent/subscriptions`, {
    method: "POST",
    body: JSON.stringify({
      clubId,
      childUserId,
      membershipTierId,
      paymentMandateId,
      billingDayOfMonth,
      billingFrequency,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create subscription");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Change subscription tier (parent)
 */
export async function changeSubscriptionTier(
  subscriptionId: number,
  newTierId: number,
  prorate?: boolean
): Promise<Subscription> {
  const response = await apiClient(`/parent/subscriptions/${subscriptionId}/tier`, {
    method: "PUT",
    body: JSON.stringify({ newTierId, prorate }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to change subscription tier");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Pause subscription (parent)
 */
export async function pauseSubscription(
  subscriptionId: number,
  resumeDate?: string
): Promise<Subscription> {
  const response = await apiClient(`/parent/subscriptions/${subscriptionId}/pause`, {
    method: "POST",
    body: JSON.stringify({ resumeDate }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to pause subscription");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Resume subscription (parent)
 */
export async function resumeSubscription(subscriptionId: number): Promise<Subscription> {
  const response = await apiClient(`/parent/subscriptions/${subscriptionId}/resume`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to resume subscription");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Cancel subscription (parent)
 */
export async function cancelParentSubscription(
  subscriptionId: number,
  reason?: string,
  immediate?: boolean
): Promise<void> {
  const response = await apiClient(`/parent/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason, immediate }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to cancel subscription");
  }
}

/**
 * Get available tiers for a club (parent view)
 */
export async function fetchAvailableTiers(clubId: number): Promise<MembershipTier[]> {
  const response = await apiClient(`/parent/subscriptions/clubs/${clubId}/membership-tiers`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch available tiers");
  }

  const data = await response.json();
  return data.data || [];
}

// ==================== PAYMENT METHOD ACTIONS (Parent) ====================

/**
 * Fetch all payment methods for the authenticated parent
 */
export async function fetchPaymentMethods(): Promise<PaymentMethodsResponse> {
  const response = await apiClient(`/parent/payment-methods`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch payment methods");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Initiate Direct Debit mandate setup
 */
export async function initiateMandateSetup(
  clubId: number,
  provider: "gocardless" = "gocardless",
  scheme: "bacs" | "sepa_core" | "ach" = "bacs"
): Promise<MandateSetupResponse> {
  const response = await apiClient(`/parent/payment-methods/mandate/setup`, {
    method: "POST",
    body: JSON.stringify({ clubId, provider, scheme }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to initiate mandate setup");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(paymentMethodId: number): Promise<PaymentMethod> {
  const response = await apiClient(`/parent/payment-methods/${paymentMethodId}/default`, {
    method: "PUT",
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to set default payment method");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(paymentMethodId: number): Promise<void> {
  const response = await apiClient(`/parent/payment-methods/${paymentMethodId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove payment method");
  }
}
