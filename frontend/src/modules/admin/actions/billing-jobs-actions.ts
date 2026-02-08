import { apiClient } from '@/api/base';

// ==================== ADMIN INVOICES ====================

export interface AdminInvoice {
  id: number;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoiceType: string | null;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  notes: string | null;
  club: {
    id: number;
    name: string;
  };
  child: {
    email: string;
    name: string | null;
  };
  parent: {
    email: string;
    name: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvoiceSummary {
  total: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  draftCount: number;
  cancelledCount: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface AdminInvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  clubId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AdminInvoicesResponse {
  invoices: AdminInvoice[];
  summary: AdminInvoiceSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch all invoices for admin (super admin only)
 */
export async function fetchAdminInvoices(
  filters: AdminInvoiceFilters = {}
): Promise<AdminInvoicesResponse> {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.set('page', filters.page.toString());
  if (filters.limit) queryParams.set('limit', filters.limit.toString());
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.clubId) queryParams.set('clubId', filters.clubId.toString());
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate);
  if (filters.toDate) queryParams.set('toDate', filters.toDate);

  const url = `/admin/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch invoices');
  }

  const data = await response.json();
  return {
    invoices: data.invoices,
    summary: data.summary,
    pagination: data.pagination
  };
}

// ==================== ADMIN SUBSCRIPTIONS ====================

export interface AdminSubscription {
  id: number;
  status: string;
  amount: string;
  billingFrequency: string;
  billingDayOfMonth: number | null;
  provider: string | null;
  providerSubscriptionId: string | null;
  providerSubscriptionStatus: string | null;
  mandateStatus: string | null;
  providerMandateId: string | null;
  tier: string | null;
  club: {
    id: number;
    name: string;
  };
  child: {
    email: string;
    name: string | null;
  };
  parent: {
    email: string;
    name: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionFilters {
  page?: number;
  limit?: number;
  status?: string;
  clubId?: number;
  search?: string;
  hasProviderSubscription?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface AdminSubscriptionsResponse {
  subscriptions: AdminSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch all subscriptions for admin (super admin only)
 */
export async function fetchAdminSubscriptions(
  filters: AdminSubscriptionFilters = {}
): Promise<AdminSubscriptionsResponse> {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.set('page', filters.page.toString());
  if (filters.limit) queryParams.set('limit', filters.limit.toString());
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.clubId) queryParams.set('clubId', filters.clubId.toString());
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.hasProviderSubscription !== undefined) {
    queryParams.set('hasProviderSubscription', filters.hasProviderSubscription.toString());
  }
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate);
  if (filters.toDate) queryParams.set('toDate', filters.toDate);

  const url = `/admin/billing/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch subscriptions');
  }

  const data = await response.json();
  return {
    subscriptions: data.subscriptions,
    pagination: data.pagination
  };
}

/**
 * Fetch clubs for filter dropdown
 */
export async function fetchAllClubs(): Promise<Array<{ id: number; name: string }>> {
  const response = await apiClient('/admin/clubs');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch clubs');
  }

  const data = await response.json();
  return data.clubs;
}

// ==================== WORKER EXECUTION ====================

export interface WorkerExecution {
  id: number;
  workerName: string;
  displayName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  itemsProcessed: number;
  itemsSuccessful: number;
  itemsFailed: number;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface WorkerStatus {
  workerName: string;
  displayName: string;
  schedule: string;
  lastExecution: WorkerExecution | null;
  isRunning: boolean;
}

export interface TriggerResult {
  processed?: number;
  successful?: number;
  failed?: number;
  errors?: Array<{ subscriptionId?: number; paymentId?: number; error: string }>;
}

export interface SubscriptionDiagnostic {
  id: number;
  club: string;
  tier: string;
  // Child details
  childUserId: number;
  childEmail: string;
  childName: string | null;
  // Parent details
  parentUserId: number;
  parentEmail: string;
  parentName: string | null;
  amount: string;
  billingFrequency: string;
  subscriptionStatus: string;
  paymentMandateId: number | null;
  providerSubscriptionId: string | null;
  // Direct mandate (linked to subscription)
  directMandateStatus: string | null;
  // Parent's mandate (found via payment_customer)
  parentMandateId: number | null;
  parentMandateStatus: string | null;
  // Usable mandate info (best available)
  mandateStatus: string | null;
  providerMandateId: string | null;
  provider: string | null;
  createdAt: string;
  needsSync: boolean;
  syncBlockers: string[];
}

export interface DiagnosticResult {
  summary: {
    total: number;
    needsSync: number;
    blocked: number;
  };
  subscriptionsNeedingSync: SubscriptionDiagnostic[];
  blockedSubscriptions: SubscriptionDiagnostic[];
}

/**
 * Fetch status of all billing workers
 */
export async function fetchWorkersStatus(): Promise<WorkerStatus[]> {
  const response = await apiClient('/admin/billing/workers/status');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch workers status');
  }

  const data = await response.json();
  return data.workers;
}

/**
 * Fetch execution history for a specific worker
 */
export async function fetchWorkerHistory(
  workerName: string,
  limit: number = 50
): Promise<WorkerExecution[]> {
  const response = await apiClient(
    `/admin/billing/workers/${workerName}/history?limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch worker history');
  }

  const data = await response.json();
  return data.executions;
}

/**
 * Trigger a specific worker to run immediately
 */
export async function triggerWorker(
  workerName: string
): Promise<{ success: boolean; message: string; result?: TriggerResult }> {
  const response = await apiClient(
    `/admin/billing/workers/${workerName}/trigger`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to trigger worker');
  }

  return response.json();
}

/**
 * Fetch all execution history (all workers)
 */
export async function fetchAllExecutionHistory(
  limit: number = 50
): Promise<WorkerExecution[]> {
  const response = await apiClient(
    `/admin/billing/workers/history?limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch execution history');
  }

  const data = await response.json();
  return data.executions || [];
}

/**
 * Fetch subscription sync diagnostic
 */
export async function fetchSubscriptionDiagnostic(): Promise<DiagnosticResult> {
  const response = await apiClient('/admin/billing/subscriptions/diagnostic');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch subscription diagnostic');
  }

  const data = await response.json();
  return {
    summary: data.summary,
    subscriptionsNeedingSync: data.subscriptionsNeedingSync || [],
    blockedSubscriptions: data.blockedSubscriptions || []
  };
}
