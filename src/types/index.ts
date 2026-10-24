export type TaxType = 'none' | 'intra' | 'inter'; // none: Non-GST, intra: CGST+SGST, inter: IGST
export type DiscountType = 'percentage' | 'fixed';
export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
export type InvoiceStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Cash' | 'Credit/Debit Card' | 'Cheque';

export interface ShopProfile {
  id: string;
  shop_name: string;
  tagline: string;
  owner_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  state_code: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  upi_id: string;
  logo_url: string;
  signature_url: string;
  default_terms: string;
  default_validity_days: number;
  default_due_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  billing_address: string;
  city: string;
  state: string;
  gstin?: string;
  event_type: string;
  event_date: string;
  event_venue: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  default_price: number;
}

export interface DocumentLineItem {
  id: string;
  service_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_gstin?: string;
  event_type: string;
  event_date: string;
  event_venue: string;
  quotation_date: string;
  validity_date: string;
  items: DocumentLineItem[];
  subtotal: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  terms: string;
  notes: string;
  status: QuotationStatus;
  converted_to_invoice_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_reference: string;
  notes?: string;
  receipt_number: string;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  quotation_id?: string;
  quotation_number?: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_gstin?: string;
  event_type: string;
  event_date: string;
  event_venue: string;
  invoice_date: string;
  due_date: string;
  items: DocumentLineItem[];
  subtotal: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: InvoiceStatus;
  payment_method?: PaymentMethod;
  payments: PaymentRecord[];
  terms: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalQuotations: number;
  quotationsValue: number;
  acceptedQuotationsCount: number;
  totalInvoices: number;
  invoicesValue: number;
  totalCollected: number;
  totalOutstanding: number;
  pendingInvoicesCount: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;
}
