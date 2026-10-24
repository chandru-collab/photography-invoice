'use client';

import {
  Customer,
  DashboardStats,
  Invoice,
  InvoiceStatus,
  PaymentRecord,
  Quotation,
  QuotationStatus,
  ServiceItem,
  ShopProfile,
} from '@/types';
import {
  DEFAULT_SERVICES,
  DEFAULT_SHOP_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_QUOTATIONS,
} from './constants';
import { isSupabaseConfigured, supabase } from './supabase';

export const STORAGE_KEYS = {
  SHOP_PROFILE: 'photo_shop_profile_v1',
  CUSTOMERS: 'photo_customers_v1',
  SERVICES: 'photo_services_v1',
  QUOTATIONS: 'photo_quotations_v1',
  INVOICES: 'photo_invoices_v1',
};

// Safe LocalStorage helpers
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Initialize default data if not present
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_PROFILE)) {
    saveToLocalStorage(STORAGE_KEYS.SHOP_PROFILE, DEFAULT_SHOP_PROFILE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    saveToLocalStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
    saveToLocalStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    saveToLocalStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }
}

// Caching flag for Supabase schema availability to prevent slow 404 retries
let supabaseSchemaAvailable: boolean | null = null;

// Helper to execute any Promise or Supabase thenable with a strict 1200ms timeout
async function withTimeout<T = any>(thenable: any, ms = 1200): Promise<T | null> {
  const p = Promise.resolve(thenable);
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// ================= SHOP PROFILE =================
export function getShopProfileSync(): ShopProfile {
  return getFromLocalStorage<ShopProfile>(STORAGE_KEYS.SHOP_PROFILE, DEFAULT_SHOP_PROFILE);
}

export async function getShopProfile(): Promise<ShopProfile> {
  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      const res = await withTimeout(
        supabase.from('shop_profile').select('*').limit(1).single()
      );
      if (res && !res.error && res.data) {
        supabaseSchemaAvailable = true;
        return res.data as ShopProfile;
      }
      if (res?.error?.code === 'PGRST205') {
        supabaseSchemaAvailable = false;
      }
    } catch {
      supabaseSchemaAvailable = false;
    }
  }
  return getShopProfileSync();
}

export async function saveShopProfile(profile: ShopProfile): Promise<ShopProfile> {
  const updated = { ...profile, updated_at: new Date().toISOString() };
  saveToLocalStorage(STORAGE_KEYS.SHOP_PROFILE, updated);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('shop_profile').upsert(updated), 1500);
    } catch (e) {
      console.warn('Supabase sync error (profile):', e);
    }
  }
  return updated;
}

// ================= CUSTOMERS =================
export function getCustomersSync(): Customer[] {
  return getFromLocalStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export async function getCustomers(): Promise<Customer[]> {
  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      const res = await withTimeout(
        supabase.from('customers').select('*').order('created_at', { ascending: false })
      );
      if (res && !res.error && res.data && res.data.length > 0) {
        supabaseSchemaAvailable = true;
        return res.data as Customer[];
      }
      if (res?.error?.code === 'PGRST205') {
        supabaseSchemaAvailable = false;
      }
    } catch {
      supabaseSchemaAvailable = false;
    }
  }
  return getCustomersSync();
}

export async function saveCustomer(customer: Omit<Customer, 'id'> & { id?: string }): Promise<Customer> {
  const customers = getCustomersSync();
  const id = customer.id || `cust-${Date.now()}`;
  const now = new Date().toISOString();
  const newCustomer: Customer = {
    ...customer,
    id,
    created_at: customer.id ? (customer as Customer).created_at || now : now,
    updated_at: now,
  };

  const existingIdx = customers.findIndex((c) => c.id === id);
  let updatedList: Customer[];
  if (existingIdx >= 0) {
    updatedList = [...customers];
    updatedList[existingIdx] = newCustomer;
  } else {
    updatedList = [newCustomer, ...customers];
  }

  saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, updatedList);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('customers').upsert(newCustomer), 1500);
    } catch (e) {
      console.warn('Supabase sync error (customers):', e);
    }
  }
  return newCustomer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const customers = getCustomersSync();
  const updated = customers.filter((c) => c.id !== id);
  saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, updated);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('customers').delete().eq('id', id), 1500);
    } catch (e) {
      console.warn('Supabase sync error (delete customer):', e);
    }
  }
}

// ================= SERVICES =================
export function getServicesSync(): ServiceItem[] {
  return getFromLocalStorage<ServiceItem[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
}

export async function getServices(): Promise<ServiceItem[]> {
  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      const res = await withTimeout(
        supabase.from('services').select('*').order('name')
      );
      if (res && !res.error && res.data && res.data.length > 0) {
        supabaseSchemaAvailable = true;
        return res.data as ServiceItem[];
      }
      if (res?.error?.code === 'PGRST205') {
        supabaseSchemaAvailable = false;
      }
    } catch {
      supabaseSchemaAvailable = false;
    }
  }
  return getServicesSync();
}

export async function saveService(service: Omit<ServiceItem, 'id'> & { id?: string }): Promise<ServiceItem> {
  const services = getServicesSync();
  const id = service.id || `srv-${Date.now()}`;
  const newService: ServiceItem = { ...service, id };

  const existingIdx = services.findIndex((s) => s.id === id);
  let updatedList: ServiceItem[];
  if (existingIdx >= 0) {
    updatedList = [...services];
    updatedList[existingIdx] = newService;
  } else {
    updatedList = [...services, newService];
  }

  saveToLocalStorage(STORAGE_KEYS.SERVICES, updatedList);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('services').upsert(newService), 1500);
    } catch (e) {
      console.warn('Supabase sync error (services):', e);
    }
  }
  return newService;
}

export async function deleteService(id: string): Promise<void> {
  const services = getServicesSync();
  const updated = services.filter((s) => s.id !== id);
  saveToLocalStorage(STORAGE_KEYS.SERVICES, updated);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('services').delete().eq('id', id), 1500);
    } catch (e) {
      console.warn('Supabase sync error (delete service):', e);
    }
  }
}

export async function deleteServicesByCategory(category: string): Promise<void> {
  const services = getServicesSync();
  const updated = services.filter((s) => s.category.toLowerCase() !== category.toLowerCase());
  saveToLocalStorage(STORAGE_KEYS.SERVICES, updated);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('services').delete().ilike('category', category), 1500);
    } catch (e) {
      console.warn('Supabase sync error (delete category services):', e);
    }
  }
}


// ================= QUOTATIONS =================
export function normalizeQuotation(quotation: Quotation): Quotation {
  if (!quotation) return quotation;
  const totalAmount = Number(quotation.total_amount) || 0;
  const advanceAmount = Number(quotation.advance_amount) || 0;
  const balance = Math.max(0, totalAmount - advanceAmount);
  return {
    ...quotation,
    advance_amount: advanceAmount,
    balance_amount: balance,
  };
}

export function getQuotationsSync(): Quotation[] {
  const list = getFromLocalStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  return list.map(normalizeQuotation);
}

export async function getQuotations(): Promise<Quotation[]> {
  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      const res = await withTimeout(
        supabase.from('quotations').select('*').order('created_at', { ascending: false })
      );
      if (res && !res.error && res.data && res.data.length > 0) {
        supabaseSchemaAvailable = true;
        return (res.data as Quotation[]).map(normalizeQuotation);
      }
      if (res?.error?.code === 'PGRST205') {
        supabaseSchemaAvailable = false;
      }
    } catch {
      supabaseSchemaAvailable = false;
    }
  }
  return getQuotationsSync();
}

export function getQuotationByIdSync(id: string): Quotation | null {
  const list = getQuotationsSync();
  return list.find((q) => q.id === id) || null;
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  const list = await getQuotations();
  return list.find((q) => q.id === id) || null;
}

export async function generateNextQuotationNumber(): Promise<string> {
  const list = await getQuotations();
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;
  let maxSeq = 0;

  list.forEach((q) => {
    if (q.quotation_number.startsWith(prefix)) {
      const parts = q.quotation_number.split('-');
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export async function saveQuotation(quotation: Quotation): Promise<Quotation> {
  const normalized = normalizeQuotation(quotation);
  const list = getQuotationsSync();
  const now = new Date().toISOString();
  const toSave: Quotation = {
    ...normalized,
    created_at: normalized.created_at || now,
    updated_at: now,
  };

  const existingIdx = list.findIndex((q) => q.id === toSave.id);
  let updatedList: Quotation[];
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = toSave;
  } else {
    updatedList = [toSave, ...list];
  }

  saveToLocalStorage(STORAGE_KEYS.QUOTATIONS, updatedList);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('quotations').upsert(toSave), 1500);
    } catch (e) {
      console.warn('Supabase sync error (quotations):', e);
    }
  }
  return toSave;
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  const quotation = await getQuotationById(id);
  if (quotation) {
    await saveQuotation({ ...quotation, status });
  }
}

export async function deleteQuotation(id: string): Promise<void> {
  const list = getQuotationsSync();
  const updated = list.filter((q) => q.id !== id);
  saveToLocalStorage(STORAGE_KEYS.QUOTATIONS, updated);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('quotations').delete().eq('id', id), 1500);
    } catch (e) {
      console.warn('Supabase sync error (delete quotation):', e);
    }
  }
}

// ================= INVOICES =================
/**
 * Normalizes invoice calculations:
 * 1. Ensures that any initial advance booking payment (advance_amount > 0) is represented in payments[] with an official receipt.
 * 2. Re-calculates total paid amount = sum of all payments.
 * 3. Re-calculates balance_amount = Math.max(0, total_amount - totalPaid).
 * 4. Syncs payment_status (Paid when balance is 0, Partially Paid when totalPaid > 0, Unpaid when 0).
 */
export function normalizeInvoice(invoice: Invoice): Invoice {
  if (!invoice) return invoice;

  const payments = Array.isArray(invoice.payments) ? [...invoice.payments] : [];

  // Check if any payment represents the initial advance booking payment
  const hasAdvanceInPayments = payments.some(
    (p) =>
      p.receipt_number?.includes('ADV') ||
      p.transaction_reference?.toLowerCase().includes('advance') ||
      p.notes?.toLowerCase().includes('advance')
  );

  const advanceAmount = Number(invoice.advance_amount) || 0;

  if (!hasAdvanceInPayments && advanceAmount > 0) {
    const year = new Date(invoice.created_at || Date.now()).getFullYear();
    payments.unshift({
      id: `pay-adv-${invoice.id}`,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: advanceAmount,
      payment_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
      payment_method: invoice.payment_method || 'UPI',
      transaction_reference: 'Advance Payment Received',
      notes: 'Initial advance booking deposit',
      receipt_number: `RCP-${year}-ADV-001`,
      created_at: invoice.created_at || new Date().toISOString(),
    });
  }

  // Calculate true total paid across all payments (including advance)
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalAmount = Number(invoice.total_amount) || 0;
  const balance = Math.max(0, totalAmount - totalPaid);

  let status: InvoiceStatus = invoice.payment_status;
  if (balance <= 0) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  } else {
    status = 'Unpaid';
  }

  return {
    ...invoice,
    advance_amount: advanceAmount,
    payments,
    paid_amount: totalPaid,
    balance_amount: balance,
    payment_status: status,
  };
}

export function getInvoicesSync(): Invoice[] {
  const list = getFromLocalStorage<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  return list.map(normalizeInvoice);
}

export async function getInvoices(): Promise<Invoice[]> {
  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      const res = await withTimeout(
        supabase.from('invoices').select('*').order('created_at', { ascending: false })
      );
      if (res && !res.error && res.data && res.data.length > 0) {
        supabaseSchemaAvailable = true;
        return (res.data as Invoice[]).map(normalizeInvoice);
      }
      if (res?.error?.code === 'PGRST205') {
        supabaseSchemaAvailable = false;
      }
    } catch {
      supabaseSchemaAvailable = false;
    }
  }
  return getInvoicesSync();
}

export function getInvoiceByIdSync(id: string): Invoice | null {
  const list = getInvoicesSync();
  return list.find((i) => i.id === id) || null;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const list = await getInvoices();
  return list.find((i) => i.id === id) || null;
}

export async function generateNextInvoiceNumber(): Promise<string> {
  const list = await getInvoices();
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  let maxSeq = 0;

  list.forEach((i) => {
    if (i.invoice_number.startsWith(prefix)) {
      const parts = i.invoice_number.split('-');
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const normalized = normalizeInvoice(invoice);
  const list = getInvoicesSync();
  const now = new Date().toISOString();
  const toSave: Invoice = {
    ...normalized,
    created_at: normalized.created_at || now,
    updated_at: now,
  };

  const existingIdx = list.findIndex((i) => i.id === toSave.id);
  let updatedList: Invoice[];
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = toSave;
  } else {
    updatedList = [toSave, ...list];
  }

  saveToLocalStorage(STORAGE_KEYS.INVOICES, updatedList);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('invoices').upsert(toSave), 1500);
    } catch (e) {
      console.warn('Supabase sync error (invoices):', e);
    }
  }
  return toSave;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const invoice = await getInvoiceById(id);
  if (invoice) {
    await saveInvoice({ ...invoice, payment_status: status });
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const list = getInvoicesSync();
  const updated = list.filter((i) => i.id !== id);
  saveToLocalStorage(STORAGE_KEYS.INVOICES, updated);

  if (isSupabaseConfigured && supabase && supabaseSchemaAvailable !== false) {
    try {
      await withTimeout(supabase.from('invoices').delete().eq('id', id), 1500);
    } catch (e) {
      console.warn('Supabase sync error (delete invoice):', e);
    }
  }
}

// ================= RECORD PAYMENT =================
export async function recordPayment(
  invoiceId: string,
  paymentData: Omit<PaymentRecord, 'id' | 'invoice_id' | 'invoice_number' | 'receipt_number' | 'created_at'>
): Promise<Invoice> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const normalized = normalizeInvoice(invoice);

  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const receiptNumber = `RCP-${year}-${String(Math.floor(100 + Math.random() * 900))}`;

  const newPayment: PaymentRecord = {
    ...paymentData,
    id: `pay-${Date.now()}`,
    invoice_id: normalized.id,
    invoice_number: normalized.invoice_number,
    receipt_number: receiptNumber,
    created_at: now,
  };

  const updatedPayments = [...normalized.payments, newPayment];
  const totalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const newBalance = Math.max(0, normalized.total_amount - totalPaid);

  let newStatus: InvoiceStatus = normalized.payment_status;
  if (newBalance <= 0) {
    newStatus = 'Paid';
  } else if (totalPaid > 0) {
    newStatus = 'Partially Paid';
  } else {
    newStatus = 'Unpaid';
  }

  const updatedInvoice: Invoice = {
    ...normalized,
    paid_amount: totalPaid,
    balance_amount: newBalance,
    payment_status: newStatus,
    payment_method: newPayment.payment_method,
    payments: updatedPayments,
    updated_at: now,
  };

  await saveInvoice(updatedInvoice);
  return updatedInvoice;
}

// ================= 1-CLICK CONVERT QUOTATION TO INVOICE =================
export async function convertQuotationToInvoice(quotationId: string): Promise<Invoice> {
  const quotation = await getQuotationById(quotationId);
  if (!quotation) throw new Error('Quotation not found');

  const invoiceNumber = await generateNextInvoiceNumber();
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const initialPayments: PaymentRecord[] = [];
  let paidAmount = 0;

  if (quotation.advance_amount > 0) {
    const year = new Date().getFullYear();
    const receiptNumber = `RCP-${year}-ADV-${String(Math.floor(100 + Math.random() * 900))}`;
    paidAmount = quotation.advance_amount;
    initialPayments.push({
      id: `pay-adv-${Date.now()}`,
      invoice_id: `inv-${Date.now()}`,
      invoice_number: invoiceNumber,
      amount: quotation.advance_amount,
      payment_date: today,
      payment_method: 'UPI',
      transaction_reference: 'Advance deposit carried over from Quotation ' + quotation.quotation_number,
      notes: 'Initial advance booking payment',
      receipt_number: receiptNumber,
      created_at: new Date().toISOString(),
    });
  }

  const balanceAmount = Math.max(0, quotation.total_amount - paidAmount);
  let paymentStatus: InvoiceStatus = 'Unpaid';
  if (balanceAmount <= 0) {
    paymentStatus = 'Paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'Partially Paid';
  }

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoice_number: invoiceNumber,
    quotation_id: quotation.id,
    quotation_number: quotation.quotation_number,
    customer_id: quotation.customer_id,
    customer_name: quotation.customer_name,
    customer_phone: quotation.customer_phone,
    customer_email: quotation.customer_email,
    customer_address: quotation.customer_address,
    customer_gstin: quotation.customer_gstin,
    event_type: quotation.event_type,
    event_date: quotation.event_date,
    event_venue: quotation.event_venue,
    invoice_date: today,
    due_date: dueDate,
    items: JSON.parse(JSON.stringify(quotation.items)),
    subtotal: quotation.subtotal,
    discount_type: quotation.discount_type,
    discount_value: quotation.discount_value,
    discount_amount: quotation.discount_amount,
    tax_type: quotation.tax_type,
    tax_rate: quotation.tax_rate,
    tax_amount: quotation.tax_amount,
    cgst_amount: quotation.cgst_amount,
    sgst_amount: quotation.sgst_amount,
    igst_amount: quotation.igst_amount,
    total_amount: quotation.total_amount,
    advance_amount: quotation.advance_amount,
    paid_amount: paidAmount,
    balance_amount: balanceAmount,
    payment_status: paymentStatus,
    payment_method: paidAmount > 0 ? 'UPI' : undefined,
    payments: initialPayments,
    terms: quotation.terms,
    notes: `Converted from Quotation ${quotation.quotation_number}. ${quotation.notes || ''}`.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await saveInvoice(newInvoice);

  await saveQuotation({
    ...quotation,
    status: 'Accepted',
    converted_to_invoice_id: newInvoice.id,
  });

  return newInvoice;
}

// ================= DASHBOARD METRICS =================
export function calculateStats(quotations: Quotation[], invoices: Invoice[]): DashboardStats {
  const totalQuotations = quotations.length;
  const quotationsValue = quotations.reduce((sum, q) => sum + q.total_amount, 0);
  const acceptedQuotationsCount = quotations.filter((q) => q.status === 'Accepted').length;

  const totalInvoices = invoices.length;
  const invoicesValue = invoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + (i.balance_amount || 0), 0);

  const pendingInvoicesCount = invoices.filter(
    (i) => i.payment_status === 'Unpaid' || i.payment_status === 'Partially Paid'
  ).length;
  const paidInvoicesCount = invoices.filter((i) => i.payment_status === 'Paid').length;
  const overdueInvoicesCount = invoices.filter((i) => i.payment_status === 'Overdue').length;

  return {
    totalQuotations,
    quotationsValue,
    acceptedQuotationsCount,
    totalInvoices,
    invoicesValue,
    totalCollected,
    totalOutstanding,
    pendingInvoicesCount,
    paidInvoicesCount,
    overdueInvoicesCount,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [quotations, invoices] = await Promise.all([getQuotations(), getInvoices()]);
  return calculateStats(quotations, invoices);
}

// ================= BACKUP & RESET =================
export function resetToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SHOP_PROFILE, JSON.stringify(DEFAULT_SHOP_PROFILE));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
}
