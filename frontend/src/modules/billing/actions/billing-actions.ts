import type {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  MarkAsPaidRequest,
  BulkSeasonalInvoiceRequest,
  InvoiceFilters,
  BillingSummary,
  BillingSettings,
  UpdateBillingSettingsRequest,
  ScheduledInvoiceJob,
} from "@/types/billing";
import { apiClient } from "@/api/base";

// ==================== CLUB MANAGER ACTIONS ====================

/**
 * Fetch all invoices for the club
 */
export async function fetchInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  const queryParams = new URLSearchParams();

  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.season_id) queryParams.append("season_id", filters.season_id.toString());
  if (filters?.user_id) queryParams.append("user_id", filters.user_id.toString());
  if (filters?.invoice_type) queryParams.append("invoice_type", filters.invoice_type);
  if (filters?.from_date) queryParams.append("from_date", filters.from_date);
  if (filters?.to_date) queryParams.append("to_date", filters.to_date);
  if (filters?.search) queryParams.append("search", filters.search);

  const response = await apiClient(`/billing/invoices?${queryParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch invoices");
  }

  const data = await response.json();
  return data.invoices;
}

/**
 * Fetch a single invoice by ID
 */
export async function fetchInvoiceById(invoiceId: number): Promise<Invoice> {
  const response = await apiClient(`/billing/invoices/${invoiceId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch invoice");
  }

  const data = await response.json();
  return data.invoice;
}

/**
 * Create a new invoice
 */
export async function createInvoice(invoiceData: CreateInvoiceRequest): Promise<Invoice> {
  const response = await apiClient(`/billing/invoices`, {
    method: "POST",
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create invoice");
  }

  const data = await response.json();
  return data;
}

/**
 * Update an existing invoice (draft only)
 */
export async function updateInvoice(
  invoiceId: number,
  invoiceData: UpdateInvoiceRequest
): Promise<void> {
  const response = await apiClient(`/billing/invoices/${invoiceId}`, {
    method: "PUT",
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update invoice");
  }
}

/**
 * Delete an invoice (draft only)
 */
export async function deleteInvoice(invoiceId: number): Promise<void> {
  const response = await apiClient(`/billing/invoices/${invoiceId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete invoice");
  }
}

/**
 * Publish an invoice (draft -> pending)
 */
export async function publishInvoice(invoiceId: number): Promise<void> {
  const response = await apiClient(`/billing/invoices/${invoiceId}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to publish invoice");
  }
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(
  invoiceId: number,
  paymentData: MarkAsPaidRequest
): Promise<void> {
  const response = await apiClient(`/billing/invoices/${invoiceId}/paid`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to mark invoice as paid");
  }
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(invoiceId: number): Promise<void> {
  const response = await apiClient(`/billing/invoices/${invoiceId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to cancel invoice");
  }
}

/**
 * Get invoices for a specific user
 */
export async function fetchUserInvoices(userId: number): Promise<Invoice[]> {
  const response = await apiClient(`/billing/users/${userId}/invoices`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user invoices");
  }

  const data = await response.json();
  return data.invoices;
}

/**
 * Generate seasonal invoices in bulk
 */
export async function generateSeasonalInvoices(
  bulkData: BulkSeasonalInvoiceRequest
): Promise<{ count: number }> {
  const response = await apiClient(`/billing/invoices/bulk/seasonal`, {
    method: "POST",
    body: JSON.stringify(bulkData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate seasonal invoices");
  }

  const data = await response.json();
  return { count: data.count };
}

/**
 * Get billing summary statistics
 */
export async function fetchBillingSummary(filters?: InvoiceFilters): Promise<BillingSummary> {
  const queryParams = new URLSearchParams();

  if (filters?.season_id) queryParams.append("season_id", filters.season_id.toString());
  if (filters?.from_date) queryParams.append("from_date", filters.from_date);
  if (filters?.to_date) queryParams.append("to_date", filters.to_date);

  const response = await apiClient(`/billing/summary?${queryParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch billing summary");
  }

  const data = await response.json();
  return data.summary;
}

// ==================== BILLING SETTINGS ACTIONS ====================

/**
 * Fetch billing settings for the club
 */
export async function fetchBillingSettings(): Promise<BillingSettings> {
  const response = await apiClient(`/billing/settings`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch billing settings");
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update billing settings
 */
export async function updateBillingSettings(
  settingsData: UpdateBillingSettingsRequest
): Promise<void> {
  const response = await apiClient(`/billing/settings`, {
    method: "PUT",
    body: JSON.stringify(settingsData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update billing settings");
  }
}

// ==================== SCHEDULED JOBS ACTIONS ====================

/**
 * Fetch scheduled invoice jobs
 */
export async function fetchScheduledJobs(): Promise<ScheduledInvoiceJob[]> {
  const response = await apiClient(`/billing/scheduled-jobs`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch scheduled jobs");
  }

  const data = await response.json();
  return data.jobs;
}

// ==================== PARENT ACTIONS ====================

/**
 * Fetch all invoices for parent's children
 */
export async function fetchParentInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  const queryParams = new URLSearchParams();

  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.user_id) queryParams.append("user_id", filters.user_id.toString());

  const response = await apiClient(`/parent/billing/invoices?${queryParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch invoices");
  }

  const data = await response.json();
  return data.invoices;
}

/**
 * Fetch a single invoice by ID (for parent)
 */
export async function fetchParentInvoiceById(invoiceId: number): Promise<Invoice> {
  const response = await apiClient(`/parent/billing/invoices/${invoiceId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch invoice");
  }

  const data = await response.json();
  return data.invoice;
}

/**
 * Fetch invoices for a specific child
 */
export async function fetchChildInvoices(childUserId: number): Promise<Invoice[]> {
  const response = await apiClient(`/parent/billing/children/${childUserId}/invoices`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch child invoices");
  }

  const data = await response.json();
  return data.invoices;
}
