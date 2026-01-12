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
import { tokenManager } from "@/api/secureAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

  const response = await fetch(
    `${API_BASE_URL}/billing/invoices?${queryParams.toString()}`,
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
    throw new Error(error.message || "Failed to fetch invoices");
  }

  const data = await response.json();
  return data.invoices;
}

/**
 * Fetch a single invoice by ID
 */
export async function fetchInvoiceById(invoiceId: number): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/billing/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/publish`, {
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
  const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/cancel`, {
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
    throw new Error(error.message || "Failed to cancel invoice");
  }
}

/**
 * Get invoices for a specific user
 */
export async function fetchUserInvoices(userId: number): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE_URL}/billing/users/${userId}/invoices`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/billing/invoices/bulk/seasonal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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

  const response = await fetch(`${API_BASE_URL}/billing/summary?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/billing/settings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(`${API_BASE_URL}/billing/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
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
  const response = await fetch(`${API_BASE_URL}/billing/scheduled-jobs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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

  const response = await fetch(
    `${API_BASE_URL}/parent/billing/invoices?${queryParams.toString()}`,
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
    throw new Error(error.message || "Failed to fetch invoices");
  }

  const data = await response.json();
  return data.invoices;
}

/**
 * Fetch a single invoice by ID (for parent)
 */
export async function fetchParentInvoiceById(invoiceId: number): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/parent/billing/invoices/${invoiceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenManager.getAccessToken()}`,
    },
    credentials: "include",
  });

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
  const response = await fetch(
    `${API_BASE_URL}/parent/billing/children/${childUserId}/invoices`,
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
    throw new Error(error.message || "Failed to fetch child invoices");
  }

  const data = await response.json();
  return data.invoices;
}
