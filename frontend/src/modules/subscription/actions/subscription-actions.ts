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
import { tokenManager } from "@/api/secureAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ==================== MEMBERSHIP TIER ACTIONS (Club Manager) ====================

/**
 * Fetch all membership tiers for the club
 */
export async function fetchMembershipTiers(includeInactive = false): Promise<MembershipTier[]> {
  const queryParams = new URLSearchParams();
  if (!includeInactive) queryParams.append("activeOnly", "true");

  const response = await fetch(
    `${API_BASE_URL}/club/membership-tiers?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: "include",
    }
  );

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
  const response = await fetch(`${API_BASE_URL}/club/membership-tiers/${tierId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/club/membership-tiers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/club/membership-tiers/${tierId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/club/membership-tiers/${tierId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/club/membership-tiers/reorder`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/club/membership-tiers/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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

  const response = await fetch(
    `${API_BASE_URL}/club/subscriptions?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch subscriptions");
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch a single subscription by ID
 */
export async function fetchSubscriptionById(subscriptionId: number): Promise<Subscription> {
  const response = await fetch(`${API_BASE_URL}/club/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/club/subscriptions/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/club/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/club/subscriptions/available-members`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/club/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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

  const response = await fetch(
    `${API_BASE_URL}/parent/subscriptions?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch subscriptions");
  }

  const data = await response.json();
  return data.data || [];
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
  const response = await fetch(`${API_BASE_URL}/parent/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/parent/subscriptions/${subscriptionId}/tier`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/parent/subscriptions/${subscriptionId}/pause`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/parent/subscriptions/${subscriptionId}/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/parent/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(
    `${API_BASE_URL}/parent/subscriptions/clubs/${clubId}/membership-tiers`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: "include",
    }
  );

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
  const response = await fetch(`${API_BASE_URL}/parent/payment-methods`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/parent/payment-methods/mandate/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(
    `${API_BASE_URL}/parent/payment-methods/${paymentMethodId}/default`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: "include",
    }
  );

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
  const response = await fetch(
    `${API_BASE_URL}/parent/payment-methods/${paymentMethodId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove payment method");
  }
}
