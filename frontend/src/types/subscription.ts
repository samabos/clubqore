/**
 * Subscription and payment types
 */

// ==================== ENUMS ====================

export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'cancelled' | 'suspended';

export type BillingFrequency = 'monthly' | 'annual';

export type PaymentMethodType = 'card' | 'direct_debit';

export type PaymentMandateStatus = 'pending' | 'active' | 'cancelled' | 'failed' | 'expired';

export type ProviderPaymentStatus = 'pending' | 'pending_submission' | 'submitted' | 'confirmed' | 'paid_out' | 'failed' | 'cancelled' | 'charged_back';

// ==================== MEMBERSHIP TIERS ====================

export interface MembershipTier {
  id: number;
  clubId: number;
  name: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number | null;
  billingFrequency: BillingFrequency;
  features: string[] | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipTierRequest {
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  billingFrequency?: BillingFrequency;
  features?: string[];
  isActive?: boolean;
}

export interface UpdateMembershipTierRequest {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  billingFrequency?: BillingFrequency;
  features?: string[];
  isActive?: boolean;
}

export interface MembershipTierStats {
  tierId: number;
  tierName: string;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// ==================== SUBSCRIPTIONS ====================

export interface Subscription {
  id: number;
  club_id: number;
  parent_user_id: number;
  child_user_id: number;
  membership_tier_id: number;
  payment_mandate_id: number | null;
  status: SubscriptionStatus;
  billing_frequency: BillingFrequency;
  billing_day_of_month: number;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  failed_payment_count: number;
  last_failed_payment_date: string | null;
  paused_at: string | null;
  resume_date: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  tier_name?: string;
  child_first_name?: string;
  child_last_name?: string;
  child_email?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_email?: string;
  club_name?: string;
}

export interface CreateSubscriptionRequest {
  clubId: number;
  childUserId: number;
  membershipTierId: number;
  paymentMandateId?: number;
  billingDayOfMonth?: number;
  billingFrequency?: BillingFrequency;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  clubId?: number;
  tierId?: number;
  parentUserId?: number;
  search?: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
}

// ==================== PAYMENT METHODS ====================

export interface PaymentMethod {
  id: number;
  user_id: number;
  type: PaymentMethodType;
  provider: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  payment_mandate_id: number | null;
  is_default: boolean;
  status: string;
  provider_payment_method_id: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  mandate_status?: PaymentMandateStatus;
  mandate_reference?: string;
  mandate_scheme?: string;
}

export interface PaymentMethodsResponse {
  total: number;
  directDebits: number;
  cards: number;
  hasDefault: boolean;
  defaultMethod: PaymentMethod | null;
  methods: PaymentMethod[];
}

export interface MandateSetupResponse {
  authorisationUrl: string;
  expiresAt: string;
}

// ==================== PROVIDER PAYMENTS ====================

export interface ProviderPayment {
  id: number;
  subscription_id: number | null;
  invoice_id: number | null;
  provider: string;
  provider_payment_id: string;
  payment_mandate_id: number | null;
  amount: number;
  currency: string;
  status: ProviderPaymentStatus;
  charge_date: string | null;
  description: string | null;
  failure_reason: string | null;
  retry_count: number;
  payout_id: string | null;
  paid_out_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// ==================== SUBSCRIPTION EVENTS ====================

export interface SubscriptionEvent {
  id: number;
  subscription_id: number;
  event_type: string;
  previous_status: SubscriptionStatus | null;
  new_status: SubscriptionStatus | null;
  previous_tier_id: number | null;
  new_tier_id: number | null;
  description: string | null;
  actor_type: 'user' | 'system' | 'webhook';
  actor_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ==================== API RESPONSE TYPES ====================

export interface MembershipTierResponse {
  success: boolean;
  tier?: MembershipTier;
  tiers?: MembershipTier[];
  message?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  subscriptions?: Subscription[];
  message?: string;
}

export interface SubscriptionStatsResponse {
  success: boolean;
  stats?: SubscriptionStats;
  message?: string;
}

export interface PaymentMethodResponse {
  success: boolean;
  data?: PaymentMethodsResponse;
  message?: string;
}

// ==================== CONSTANTS ====================

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  suspended: 'Suspended',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-800',
};

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  card: 'Card',
  direct_debit: 'Direct Debit',
};

export const MANDATE_STATUS_LABELS: Record<PaymentMandateStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  cancelled: 'Cancelled',
  failed: 'Failed',
  expired: 'Expired',
};

export const MANDATE_STATUS_COLORS: Record<PaymentMandateStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-500',
};
