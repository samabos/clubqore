/**
 * Billing and invoice types
 */

export type InvoiceType = 'seasonal' | 'adhoc';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export type ItemCategory = 'membership' | 'training' | 'equipment' | 'tournament' | 'other';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'online';

export type ServiceChargeType = 'percentage' | 'fixed';

export type ScheduledJobStatus = 'pending' | 'completed' | 'failed';

export interface Invoice {
  id: number;
  club_id: number;
  parent_user_id: number;  // The parent/guardian responsible for payment (or self for direct members)
  child_user_id: number | null;  // The child/member the invoice is for
  season_id: number | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;

  issue_date: string; // ISO date string
  due_date: string; // ISO date string
  paid_date: string | null; // ISO date string

  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;

  notes: string | null;

  created_by: number;
  created_at: string;
  updated_at: string;

  // Joined fields from backend
  user_first_name?: string;  // Backward compatibility - same as child_first_name
  user_last_name?: string;   // Backward compatibility - same as child_last_name
  user_email?: string;        // Backward compatibility - same as child_email
  child_first_name?: string;  // Child's first name
  child_last_name?: string;   // Child's last name
  child_email?: string;        // Child's email
  parent_first_name?: string;  // Parent's first name
  parent_last_name?: string;   // Parent's last name
  parent_email?: string;        // Parent's email
  season_name?: string;
  club_name?: string;

  // Related data
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  category: ItemCategory | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: PaymentMethod | null;
  payment_date: string; // ISO date string
  reference_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  user_id: number;
  season_id?: number | null;
  invoice_type: InvoiceType;
  issue_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  items: CreateInvoiceItemRequest[];
}

export interface CreateInvoiceItemRequest {
  description: string;
  category?: ItemCategory;
  quantity?: number;
  unit_price: number;
}

export interface UpdateInvoiceRequest {
  user_id?: number;
  season_id?: number | null;
  invoice_type?: InvoiceType;
  issue_date?: string;
  due_date?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  items?: CreateInvoiceItemRequest[];
}

export interface MarkAsPaidRequest {
  payment_date?: string; // YYYY-MM-DD
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface BulkSeasonalInvoiceRequest {
  season_id: number;
  user_ids: number[];
  issue_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  notes?: string;
  items: CreateInvoiceItemRequest[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  season_id?: number;
  user_id?: number;
  invoice_type?: InvoiceType;
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  search?: string; // Search by invoice number or member name
}

export interface BillingSummary {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  overdue_count: number;
  overdue_amount: number;
  by_status: {
    draft: number;
    pending: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
}

export interface BillingSettings {
  id: number;
  club_id: number;

  // Service charge
  service_charge_enabled: boolean;
  service_charge_type: ServiceChargeType;
  service_charge_value: number;
  service_charge_description: string;

  // Auto-generation
  auto_generation_enabled: boolean;
  days_before_season: number;
  default_invoice_items: CreateInvoiceItemRequest[] | null;

  created_at: string;
  updated_at: string;
}

export interface UpdateBillingSettingsRequest {
  service_charge_enabled?: boolean;
  service_charge_type?: ServiceChargeType;
  service_charge_value?: number;
  service_charge_description?: string;
  auto_generation_enabled?: boolean;
  days_before_season?: number;
  default_invoice_items?: CreateInvoiceItemRequest[];
}

export interface ScheduledInvoiceJob {
  id: number;
  club_id: number;
  season_id: number;
  scheduled_date: string; // ISO date string
  status: ScheduledJobStatus;
  generated_at: string | null;
  invoices_generated: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  season_name?: string;
  season_start_date?: string;
  season_end_date?: string;
  club_name?: string;
}

// API Response types
export interface InvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  invoices?: Invoice[];
  invoice_id?: number;
  invoice_number?: string;
  message?: string;
}

export interface BillingSummaryResponse {
  success: boolean;
  summary?: BillingSummary;
  message?: string;
}

export interface BillingSettingsResponse {
  success: boolean;
  settings?: BillingSettings;
  message?: string;
}

export interface ScheduledJobsResponse {
  success: boolean;
  jobs?: ScheduledInvoiceJob[];
  message?: string;
}

export interface BulkInvoiceResponse {
  success: boolean;
  count?: number;
  message?: string;
}

// Helper types for display
export interface InvoiceWithMeta extends Invoice {
  is_overdue: boolean;
  days_until_due: number;
  user_display_name: string;
}

// Constants
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  seasonal: 'Seasonal',
  adhoc: 'Ad-hoc',
};

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  membership: 'Membership',
  training: 'Training',
  equipment: 'Equipment',
  tournament: 'Tournament',
  other: 'Other',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  online: 'Online',
};
