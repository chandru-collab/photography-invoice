'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Customer,
  DiscountType,
  DocumentLineItem,
  Invoice,
  InvoiceStatus,
  PaymentRecord,
  Quotation,
  QuotationStatus,
  ServiceItem,
  ShopProfile,
  TaxType,
} from '@/types';
import {
  deleteInvoice,
  deleteQuotation,
  getCustomers,
  getServices,
  getShopProfile,
  saveCustomer,
  saveInvoice,
  saveQuotation,
} from '@/lib/storage';
import { formatINR } from '@/lib/numberToWords';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import {
  Plus,
  Trash2,
  Calendar,
  User,
  MapPin,
  Sparkles,
  Camera,
  Percent,
  Calculator,
  ArrowLeft,
  Save,
} from 'lucide-react';

interface DocumentFormProps {
  type: 'quotation' | 'invoice';
  initialData?: Quotation | Invoice;
  isEditing?: boolean;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  type,
  initialData,
  isEditing = false,
}) => {
  const router = useRouter();
  const isQuotation = type === 'quotation';

  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialData?.customer_id || ''
  );
  const [customerName, setCustomerName] = useState<string>(initialData?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initialData?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(initialData?.customer_email || '');
  const [customerAddress, setCustomerAddress] = useState<string>(initialData?.customer_address || '');
  const [customerGstin, setCustomerGstin] = useState<string>(initialData?.customer_gstin || '');

  // Event Details
  const [eventType, setEventType] = useState<string>(initialData?.event_type || 'Wedding & Reception');
  const [eventDate, setEventDate] = useState<string>(initialData?.event_date || '');
  const [eventVenue, setEventVenue] = useState<string>(initialData?.event_venue || '');

  // Dates & Document Number
  const today = new Date().toISOString().split('T')[0];
  const [docNumber, setDocNumber] = useState<string>(
    isQuotation
      ? (initialData as Quotation)?.quotation_number || ''
      : (initialData as Invoice)?.invoice_number || ''
  );
  const [docDate, setDocDate] = useState<string>(
    isQuotation
      ? (initialData as Quotation)?.quotation_date || today
      : (initialData as Invoice)?.invoice_date || today
  );

  const defaultValidity = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [secondaryDate, setSecondaryDate] = useState<string>(
    isQuotation
      ? (initialData as Quotation)?.validity_date || defaultValidity
      : (initialData as Invoice)?.due_date || defaultDueDate
  );

  const [referenceQuotationNumber, setReferenceQuotationNumber] = useState<string>(
    !isQuotation ? (initialData as Invoice)?.quotation_number || '' : ''
  );

  // Status
  const [quotationStatus, setQuotationStatus] = useState<QuotationStatus>(
    isQuotation ? (initialData as Quotation)?.status || 'Draft' : 'Draft'
  );
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(
    !isQuotation ? (initialData as Invoice)?.payment_status || 'Unpaid' : 'Unpaid'
  );

  // Line items
  const [items, setItems] = useState<DocumentLineItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            id: `item-${Date.now()}`,
            description: 'Candid Wedding Photography (Full Day Coverage)',
            quantity: 1,
            unit_price: 35000,
            total_price: 35000,
          },
        ]
  );

  // Discount & Taxes
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialData?.discount_type || 'fixed'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.discount_value || 0
  );
  const [taxType, setTaxType] = useState<TaxType>(
    initialData?.tax_type || 'intra' // Default CGST + SGST (18%)
  );
  const [taxRate, setTaxRate] = useState<number>(initialData?.tax_rate || 18);
  const [advanceAmount, setAdvanceAmount] = useState<number>(
    initialData?.advance_amount || 0
  );

  // Terms and Notes
  const [terms, setTerms] = useState<string>(initialData?.terms || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingModal, setIsDeletingModal] = useState(false);

  // Load shop profile, customers, services on mount
  useEffect(() => {
    async function loadData() {
      const [shopData, customerList, serviceList] = await Promise.all([
        getShopProfile(),
        getCustomers(),
        getServices(),
      ]);
      setShop(shopData);
      setCustomers(customerList);
      setServices(serviceList);

      if (!initialData?.terms && shopData?.default_terms) {
        setTerms(shopData.default_terms);
      }
    }
    loadData();
  }, [initialData]);

  // When customer is selected from dropdown, populate details
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerEmail(found.email || '');
      setCustomerAddress(found.billing_address || `${found.city}, ${found.state}`);
      setCustomerGstin(found.gstin || '');
      if (found.event_type) setEventType(found.event_type);
      if (found.event_date) setEventDate(found.event_date);
      if (found.event_venue) setEventVenue(found.event_venue);
    }
  };

  // Add Item from Catalogue
  const handleAddFromCatalogue = (serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;
    const newItem: DocumentLineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      service_id: srv.id,
      description: `${srv.name} - ${srv.description}`,
      quantity: 1,
      unit_price: srv.default_price,
      total_price: srv.default_price,
    };
    setItems([...items, newItem]);
  };

  // Add Custom Item Row
  const handleAddCustomRow = () => {
    const newItem: DocumentLineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    setItems([...items, newItem]);
  };

  // Update item field
  const handleItemChange = (
    index: number,
    field: keyof DocumentLineItem,
    value: string | number
  ) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'quantity') {
      const q = Math.max(1, Number(value) || 1);
      current.quantity = q;
      current.total_price = q * current.unit_price;
    } else if (field === 'unit_price') {
      const p = Math.max(0, Number(value) || 0);
      current.unit_price = p;
      current.total_price = current.quantity * p;
    } else if (field === 'description') {
      current.description = String(value);
    }

    updated[index] = current;
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Documents must have at least one line item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = Math.round((subtotal * (discountValue || 0)) / 100);
  } else {
    discountAmount = Math.min(subtotal, discountValue || 0);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (taxType === 'intra') {
    taxAmount = Math.round((taxableAmount * taxRate) / 100);
    cgstAmount = Math.round(taxAmount / 2);
    sgstAmount = taxAmount - cgstAmount;
  } else if (taxType === 'inter') {
    taxAmount = Math.round((taxableAmount * taxRate) / 100);
    igstAmount = taxAmount;
  } else {
    taxAmount = 0;
  }

  const totalAmount = taxableAmount + taxAmount;
  const balanceAmount = Math.max(0, totalAmount - (advanceAmount || 0));

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide the Customer Name and Contact Phone Number.');
      return;
    }

    if (items.some((it) => !it.description.trim())) {
      alert('Please fill descriptions for all service items.');
      return;
    }

    try {
      setIsSaving(true);

      // Save customer to reusable directory if not already linked
      let customerId = selectedCustomerId;
      if (!customerId) {
        const createdCustomer = await saveCustomer({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          billing_address: customerAddress,
          city: shop?.city || 'Mumbai',
          state: shop?.state || 'Maharashtra',
          gstin: customerGstin,
          event_type: eventType,
          event_date: eventDate,
          event_venue: eventVenue,
        });
        customerId = createdCustomer.id;
      }

      if (isQuotation) {
        // Generate or retain quotation number
        let qNumber = docNumber;
        if (!qNumber) {
          const { generateNextQuotationNumber } = await import('@/lib/storage');
          qNumber = await generateNextQuotationNumber();
        }

        const quotationToSave: Quotation = {
          id: initialData?.id || `quo-${Date.now()}`,
          quotation_number: qNumber,
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: customerAddress,
          customer_gstin: customerGstin || undefined,
          event_type: eventType,
          event_date: eventDate,
          event_venue: eventVenue,
          quotation_date: docDate,
          validity_date: secondaryDate,
          items,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          tax_type: taxType,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          balance_amount: balanceAmount,
          terms,
          notes,
          status: quotationStatus,
          converted_to_invoice_id: (initialData as Quotation)?.converted_to_invoice_id,
        };

        const saved = await saveQuotation(quotationToSave);
        router.push(`/quotations/${saved.id}`);
      } else {
        // Generate or retain invoice number
        let invNumber = docNumber;
        if (!invNumber) {
          const { generateNextInvoiceNumber } = await import('@/lib/storage');
          invNumber = await generateNextInvoiceNumber();
        }

        const existingInvoice = initialData as Invoice | undefined;
        let invoicePayments: PaymentRecord[] = existingInvoice?.payments
          ? [...existingInvoice.payments]
          : [];

        // Check if an advance booking payment already exists in invoicePayments
        const advIndex = invoicePayments.findIndex(
          (p) =>
            p.receipt_number?.includes('ADV') ||
            p.transaction_reference?.toLowerCase().includes('advance') ||
            p.notes?.toLowerCase().includes('advance')
        );

        if (advanceAmount > 0) {
          if (advIndex >= 0) {
            // Update the existing advance payment record with new amount
            invoicePayments[advIndex] = {
              ...invoicePayments[advIndex],
              amount: advanceAmount,
            };
          } else {
            // Create official advance receipt record
            const year = new Date().getFullYear();
            const receiptNumber = `RCP-${year}-ADV-${String(Math.floor(100 + Math.random() * 900))}`;
            invoicePayments.unshift({
              id: `pay-adv-${Date.now()}`,
              invoice_id: invNumber,
              invoice_number: invNumber,
              amount: advanceAmount,
              payment_date: docDate,
              payment_method: 'UPI',
              transaction_reference: 'Advance Payment Received',
              notes: 'Initial advance booking deposit',
              receipt_number: receiptNumber,
              created_at: new Date().toISOString(),
            });
          }
        } else if (advIndex >= 0) {
          invoicePayments.splice(advIndex, 1);
        }

        const totalPaid = invoicePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const invBalance = Math.max(0, totalAmount - totalPaid);

        let pStatus = invoiceStatus;
        if (invBalance <= 0) {
          pStatus = 'Paid';
        } else if (totalPaid > 0) {
          pStatus = 'Partially Paid';
        } else {
          pStatus = 'Unpaid';
        }

        const invoiceToSave: Invoice = {
          id: initialData?.id || `inv-${Date.now()}`,
          invoice_number: invNumber,
          quotation_id: existingInvoice?.quotation_id,
          quotation_number: referenceQuotationNumber || existingInvoice?.quotation_number,
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: customerAddress,
          customer_gstin: customerGstin || undefined,
          event_type: eventType,
          event_date: eventDate,
          event_venue: eventVenue,
          invoice_date: docDate,
          due_date: secondaryDate,
          items,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          tax_type: taxType,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          paid_amount: totalPaid,
          balance_amount: invBalance,
          payment_status: pStatus,
          payments: invoicePayments,
          terms,
          notes,
        };

        const saved = await saveInvoice(invoiceToSave);
        router.push(`/invoices/${saved.id}`);
      }
    } catch (err) {
      console.error('Error saving document:', err);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialData?.id) return;
    try {
      setIsDeletingModal(true);
      if (isQuotation) {
        await deleteQuotation(initialData.id);
        router.push('/quotations');
      } else {
        await deleteInvoice(initialData.id);
        router.push('/invoices');
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
    } finally {
      setIsDeletingModal(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-950 font-serif">
              {isEditing ? `Edit ${isQuotation ? 'Quotation' : 'Invoice'}` : `Create New ${isQuotation ? 'Quotation' : 'Invoice'}`}
            </h1>
            <p className="text-xs text-zinc-500">
              Classic Professional document format for photography shoots & productions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 hover:text-rose-900 transition shadow-xs cursor-pointer min-h-[38px]"
              title={`Delete ${isQuotation ? 'Quotation' : 'Invoice'}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-initial text-center justify-center px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition min-h-[38px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition shadow-xs disabled:opacity-50 min-h-[38px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Update & View' : 'Save & Preview'}
          </button>
        </div>
      </div>

      {/* Section 1: Customer Details & Event Particulars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs">
        {/* Customer Information */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-zinc-500" /> Customer Information
            </h2>
            {customers.length > 0 && (
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 w-full sm:max-w-[200px]"
              >
                <option value="">-- Choose Existing Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Client / Couple Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rohan Deshmukh & Priya Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="+91 98200 12345"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="client@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Billing Address</label>
            <textarea
              rows={2}
              placeholder="Flat 1402, Signature Heights, Andheri West, Mumbai"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Client GSTIN (Optional, for Corporate / Commercial Shoots)
            </label>
            <input
              type="text"
              placeholder="27AABCU9603R1ZM"
              value={customerGstin}
              onChange={(e) => setCustomerGstin(e.target.value)}
              className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 uppercase"
            />
          </div>
        </div>

        {/* Event Details & Dates */}
        <div className="space-y-4">
          <div className="border-b border-zinc-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-zinc-500" /> Shoot & Event Particulars
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Event Type</label>
              <input
                type="text"
                placeholder="e.g. Wedding & Reception, Pre-Wedding"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Shoot Date(s)</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Venue & City</label>
            <input
              type="text"
              placeholder="e.g. The Taj Mahal Palace, Colaba, Mumbai"
              value={eventVenue}
              onChange={(e) => setEventVenue(e.target.value)}
              className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {isQuotation ? 'Quotation Date' : 'Invoice Date'}
              </label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {isQuotation ? 'Valid Until' : 'Payment Due Date'}
              </label>
              <input
                type="date"
                value={secondaryDate}
                onChange={(e) => setSecondaryDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {isQuotation ? 'Quotation No. (Auto)' : 'Invoice No. (Auto)'}
              </label>
              <input
                type="text"
                placeholder={isQuotation ? 'QUO-2026-001' : 'INV-2026-001'}
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {!isQuotation ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Quotation Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="QUO-2026-001"
                  value={referenceQuotationNumber}
                  onChange={(e) => setReferenceQuotationNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Initial Status</label>
                <select
                  value={quotationStatus}
                  onChange={(e) => setQuotationStatus(e.target.value as QuotationStatus)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Structured Service Items Table & Mobile Cards */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Photography Services & Deliverables
            </h2>
            <p className="text-[11px] text-zinc-500">
              Select standard packages from your catalogue or enter custom shoot deliverables
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {services.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddFromCatalogue(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-2 text-zinc-800 font-medium min-h-[38px]"
                defaultValue=""
              >
                <option value="" disabled>
                  + Add from Photography Catalogue
                </option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} ({formatINR(srv.default_price)})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleAddCustomRow}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-300 transition min-h-[38px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Row
            </button>
          </div>
        </div>

        {/* 1. Mobile Item Card Editor (md:hidden) */}
        <div className="md:hidden space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="font-mono text-xs font-bold text-zinc-700">Item #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded transition min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Candid Photography, Cinematic Highlight"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded text-xs font-mono text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded text-xs font-mono text-right text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Item Total:</span>
                <span className="font-mono font-bold text-sm text-zinc-950">{formatINR(item.total_price)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Desktop Items Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border border-zinc-300">
            <thead>
              <tr className="bg-zinc-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Service Description</th>
                <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                <th className="py-2.5 px-3 w-32 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-3 w-32 text-right">Total (₹)</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 1 ? 'bg-zinc-50/60' : 'bg-white'}>
                  <td className="py-2 px-3 text-center text-zinc-500 font-mono">{index + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Candid Photography, 4K Cinematic Highlight Reel"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded text-xs font-mono text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      required
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full px-2 py-1.5 border border-zinc-300 rounded text-xs font-mono text-right text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-zinc-950">
                    {formatINR(item.total_price)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Financial Calculations (Discounts, Tax, Advance, Total) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-zinc-200">
          {/* Notes & Terms */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Special Notes & Deliverable Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Includes drone permissions, high-res web link, and 1 complimentary framed print."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Payment Terms & Conditions
              </label>
              <textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Right Calculations Card */}
          <div className="md:col-span-5 bg-zinc-50 p-4 rounded-lg border border-zinc-300 space-y-3 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between items-center py-1 border-b border-zinc-200">
              <span className="text-zinc-600 font-medium">Subtotal</span>
              <span className="font-bold font-mono text-zinc-950 text-sm">{formatINR(subtotal)}</span>
            </div>

            {/* Discount Configuration */}
            <div className="space-y-1.5 py-1 border-b border-zinc-200">
              <div className="flex justify-between items-center">
                <span className="text-zinc-700 font-medium">Apply Discount:</span>
                <div className="flex items-center gap-1">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-xs font-medium"
                  >
                    <option value="fixed">Fixed (₹)</option>
                    <option value="percentage">Percent (%)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : subtotal}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-20 px-2 py-0.5 border border-zinc-300 rounded text-right font-mono font-bold text-xs"
                  />
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-700 text-xs">
                  <span>Discount Deducted</span>
                  <span className="font-mono font-semibold">-{formatINR(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Tax Settings */}
            <div className="space-y-1.5 py-1 border-b border-zinc-200">
              <div className="flex justify-between items-center">
                <span className="text-zinc-700 font-medium">Taxation (GST):</span>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as TaxType)}
                  className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-medium"
                >
                  <option value="intra">Intra-State (CGST 9% + SGST 9%)</option>
                  <option value="inter">Inter-State (IGST 18%)</option>
                  <option value="none">Non-GST / Exempt (0%)</option>
                </select>
              </div>

              {taxType !== 'none' && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-zinc-500">Tax Rate (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-16 px-2 py-0.5 border border-zinc-300 rounded text-right font-mono text-xs"
                  />
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-zinc-800 text-xs pt-1">
                  <span>Calculated Tax</span>
                  <span className="font-mono font-semibold">+{formatINR(taxAmount)}</span>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center py-2 bg-zinc-900 text-white px-3 rounded font-bold text-sm">
              <span>Total Document Amount</span>
              <span className="font-mono">{formatINR(totalAmount)}</span>
            </div>

            {/* Advance Amount & 50/50 Split Feature */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between items-center">
                <span className="text-zinc-700 font-medium">
                  {isQuotation ? 'Advance Deposit Required:' : 'Advance Payment Received:'}
                </span>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-28 px-2 py-1 border border-zinc-300 rounded text-right font-mono font-bold text-xs"
                />
              </div>

              {/* Quick Split / Installment Option Buttons */}
              <div className="pt-0.5">
                <span className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  ⚡ Quick Payment Split Options:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(totalAmount / 2);
                      setAdvanceAmount(half);
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-bold border transition text-center cursor-pointer ${
                      advanceAmount === Math.round(totalAmount / 2) && totalAmount > 0
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    50% Half Now
                    <span className="block text-[9px] opacity-85 font-mono font-normal">
                      {formatINR(Math.round(totalAmount / 2))}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const token = Math.round(totalAmount * 0.25);
                      setAdvanceAmount(token);
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-bold border transition text-center cursor-pointer ${
                      advanceAmount === Math.round(totalAmount * 0.25) && totalAmount > 0
                        ? 'bg-zinc-800 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    25% Token
                    <span className="block text-[9px] opacity-85 font-mono font-normal">
                      {formatINR(Math.round(totalAmount * 0.25))}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(0)}
                    className={`px-2 py-1.5 rounded text-[11px] font-bold border transition text-center cursor-pointer ${
                      advanceAmount === 0
                        ? 'bg-zinc-800 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    Pay Later (0%)
                    <span className="block text-[9px] opacity-85 font-mono font-normal">₹0 advance</span>
                  </button>
                </div>

                {/* Informative 50/50 Half Payment Plan Banner */}
                {advanceAmount > 0 && advanceAmount === Math.round(totalAmount / 2) && (
                  <div className="mt-2 p-2 bg-indigo-50/80 border border-indigo-200 rounded text-[11px] text-indigo-950 space-y-0.5">
                    <p className="font-bold flex items-center gap-1 text-indigo-900">
                      <span>✨ 50 / 50 Half Payment Plan Active:</span>
                    </p>
                    <p className="text-zinc-600">
                      • <strong>1st Half (Paid Now):</strong> {formatINR(advanceAmount)}
                    </p>
                    <p className="text-zinc-600">
                      • <strong>2nd Half (Pay Later):</strong> {formatINR(balanceAmount)}{' '}
                      <span className="text-zinc-500 text-[10px]">(Due by {secondaryDate})</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-300 font-bold text-xs">
              <span className="text-zinc-900">
                {isQuotation ? 'Estimated Balance Payable' : 'Balance Outstanding (Pay Later)'}
              </span>
              <span className="font-mono text-sm text-zinc-950">{formatINR(balanceAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal for Editing Mode */}
      {isEditing && initialData && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          title={isQuotation ? 'Delete Quotation' : 'Delete Invoice'}
          message={`Are you sure you want to delete ${
            isQuotation ? 'quotation' : 'tax invoice'
          } ${docNumber}? All data will be permanently removed.`}
          docNumber={docNumber}
          docType={type}
          clientName={customerName}
          amount={totalAmount}
          isDeleting={isDeletingModal}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            if (!isDeletingModal) setShowDeleteModal(false);
          }}
        />
      )}
    </form>
  );
};
