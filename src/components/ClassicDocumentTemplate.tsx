'use client';

import React from 'react';
import { Invoice, PaymentRecord, Quotation, ShopProfile } from '@/types';
import { formatINR, numberToIndianWords } from '@/lib/numberToWords';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Calendar, MapPin, Phone, Mail, Globe, CheckCircle2, Clock, Receipt, CreditCard } from 'lucide-react';

interface ClassicDocumentTemplateProps {
  document: Quotation | Invoice;
  shop: ShopProfile;
  type: 'quotation' | 'invoice';
  onViewReceipt?: (payment: PaymentRecord) => void;
  onPayRemainingClick?: () => void;
}

export const ClassicDocumentTemplate: React.FC<ClassicDocumentTemplateProps> = ({
  document,
  shop,
  type,
  onViewReceipt,
  onPayRemainingClick,
}) => {
  const isQuotation = type === 'quotation';
  const quotation = isQuotation ? (document as Quotation) : null;
  const invoice = !isQuotation ? (document as Invoice) : null;

  const docTitle = isQuotation
    ? 'QUOTATION'
    : document.customer_gstin || shop.gstin
    ? 'TAX INVOICE'
    : 'INVOICE';

  const docNumber = isQuotation
    ? quotation?.quotation_number
    : invoice?.invoice_number;

  const docDate = isQuotation
    ? quotation?.quotation_date
    : invoice?.invoice_date;

  const secondaryDateLabel = isQuotation ? 'Valid Until' : 'Payment Due Date';
  const secondaryDate = isQuotation
    ? quotation?.validity_date
    : invoice?.due_date;

  // Payments breakdown for Invoices
  const invoicePayments = (!isQuotation ? invoice?.payments : []) || [];
  const advancePaymentRecord = invoicePayments.find(
    (p) =>
      p.receipt_number?.includes('ADV') ||
      p.transaction_reference?.toLowerCase().includes('advance') ||
      p.notes?.toLowerCase().includes('advance')
  );
  const displayAdvanceAmount = advancePaymentRecord?.amount ?? document.advance_amount ?? 0;
  const subsequentPayments = invoicePayments.filter((p) => p !== advancePaymentRecord);
  const subsequentPaidAmount = subsequentPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  const totalAmountPaid =
    (!isQuotation ? invoice?.paid_amount : 0) || (displayAdvanceAmount + subsequentPaidAmount);

  // Calculate amount for UPI QR code
  const targetPaymentAmount = isQuotation
    ? quotation?.advance_amount || quotation?.total_amount || 0
    : invoice?.balance_amount || 0;

  const upiPayString = `upi://pay?pa=${encodeURIComponent(shop.upi_id)}&pn=${encodeURIComponent(
    shop.shop_name
  )}&am=${targetPaymentAmount}&cu=INR&tn=${encodeURIComponent(docNumber || 'Photography Services')}`;

  return (
    <div
      id="classic-document-a4"
      className="a4-document-container mx-auto bg-white text-zinc-900 border border-zinc-200 shadow-xl print:shadow-none print:border-none rounded-sm transition-all p-3.5 sm:p-7 md:p-10 w-full max-w-[820px] box-border min-h-auto md:min-h-[1120px]"
      style={{
        backgroundColor: '#ffffff',
      }}
    >
      {/* HEADER SECTION: Business details & Document Type */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-zinc-900 pb-5 gap-4">
        <div className="flex items-start gap-4">
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.logo_url}
              alt={shop.shop_name}
              className="w-16 h-16 object-contain rounded border border-zinc-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-md bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Camera className="w-7 h-7" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 uppercase font-serif">
              {shop.shop_name}
            </h1>
            {shop.tagline && (
              <p className="text-xs text-zinc-600 font-medium tracking-wide italic">
                {shop.tagline}
              </p>
            )}
            <p className="text-xs text-zinc-700 mt-1 max-w-sm leading-relaxed">
              {shop.address}, {shop.city}, {shop.state} - {shop.pincode}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 mt-1 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-zinc-400" /> {shop.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-zinc-400" /> {shop.email}
              </span>
              {shop.website && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-zinc-400" /> {shop.website.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>
            {shop.gstin && (
              <p className="text-xs text-zinc-900 font-semibold mt-1">
                GSTIN: <span className="font-mono">{shop.gstin}</span> | State Code: {shop.state_code || '27'}
              </p>
            )}
          </div>
        </div>

        {/* DOCUMENT TITLE & IDENTIFIERS */}
        <div className="text-right sm:self-start w-full sm:w-auto">
          <div className="inline-block bg-zinc-900 text-white font-bold px-4 py-1 text-lg tracking-wider rounded-xs">
            {docTitle}
          </div>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex sm:justify-end justify-between gap-3">
              <span className="text-zinc-500 font-medium">Document No:</span>
              <span className="font-bold text-zinc-950 font-mono text-sm">{docNumber}</span>
            </div>
            <div className="flex sm:justify-end justify-between gap-3">
              <span className="text-zinc-500 font-medium">Date:</span>
              <span className="font-semibold text-zinc-800 font-mono">{docDate}</span>
            </div>
            <div className="flex sm:justify-end justify-between gap-3">
              <span className="text-zinc-500 font-medium">{secondaryDateLabel}:</span>
              <span className="font-semibold text-zinc-800 font-mono">{secondaryDate}</span>
            </div>
            {!isQuotation && invoice?.quotation_number && (
              <div className="flex sm:justify-end justify-between gap-3">
                <span className="text-zinc-500 font-medium">Quotation Ref:</span>
                <span className="font-medium text-zinc-700 font-mono">{invoice.quotation_number}</span>
              </div>
            )}
            {!isQuotation && (
              <div className="flex sm:justify-end justify-between gap-3 pt-1">
                <span className="text-zinc-500 font-medium">Payment Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                    invoice?.payment_status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : invoice?.payment_status === 'Partially Paid'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : invoice?.payment_status === 'Overdue'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                  }`}
                >
                  {invoice?.payment_status}
                </span>
              </div>
            )}
            {isQuotation && (
              <div className="flex sm:justify-end justify-between gap-3 pt-1">
                <span className="text-zinc-500 font-medium">Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                    quotation?.status === 'Accepted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : quotation?.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : quotation?.status === 'Expired'
                      ? 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {quotation?.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BILLED TO & EVENT PARTICULARS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-5 py-3 border-b border-zinc-200 text-xs">
        {/* Customer Details */}
        <div className="bg-zinc-50/80 p-3.5 rounded border border-zinc-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
            Customer / Client Details
          </p>
          <p className="text-sm font-bold text-zinc-950 font-serif">{document.customer_name}</p>
          <p className="text-zinc-700 mt-1 leading-relaxed">{document.customer_address}</p>
          <div className="mt-2 space-y-0.5 text-zinc-600 font-mono text-[11px]">
            <p className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-zinc-400" />
              <span>{document.customer_phone}</span>
            </p>
            {document.customer_email && (
              <p className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-zinc-400" />
                <span>{document.customer_email}</span>
              </p>
            )}
            {document.customer_gstin && (
              <p className="font-semibold text-zinc-900 pt-0.5">
                Client GSTIN: {document.customer_gstin}
              </p>
            )}
          </div>
        </div>

        {/* Event Particulars */}
        <div className="bg-zinc-50/80 p-3.5 rounded border border-zinc-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
            Photography Event Details
          </p>
          <div className="space-y-1.5 text-zinc-800">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-zinc-900 w-24 shrink-0">Event Type:</span>
              <span className="font-bold text-zinc-950">{document.event_type || 'Wedding & Reception'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-zinc-900 w-24 shrink-0 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-400" /> Shoot Date:
              </span>
              <span className="font-mono font-bold text-zinc-900">{document.event_date || 'As scheduled'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-zinc-900 w-24 shrink-0 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-400" /> Venue / City:
              </span>
              <span className="leading-snug">{document.event_venue || 'Studio / On-Location'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE ITEMS TABLE - Classic Professional with subtle borders & alternating rows */}
      <div className="mt-4 mb-6 overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full text-left text-xs border border-zinc-300 min-w-[480px] sm:min-w-full">
          <thead>
            <tr className="bg-zinc-900 text-white font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center border-r border-zinc-700">#</th>
              <th className="py-2.5 px-3 border-r border-zinc-700">Service Description & Deliverables</th>
              <th className="py-2.5 px-3 w-16 text-center border-r border-zinc-700">Qty</th>
              <th className="py-2.5 px-3 w-28 text-right border-r border-zinc-700">Rate (₹)</th>
              <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {document.items.map((item, index) => (
              <tr
                key={item.id || index}
                className={index % 2 === 1 ? 'bg-zinc-50/70' : 'bg-white'}
              >
                <td className="py-3 px-3 text-center text-zinc-500 font-mono border-r border-zinc-200">
                  {index + 1}
                </td>
                <td className="py-3 px-3 border-r border-zinc-200">
                  <p className="font-semibold text-zinc-950 text-xs">{item.description}</p>
                </td>
                <td className="py-3 px-3 text-center text-zinc-700 font-mono border-r border-zinc-200">
                  {item.quantity}
                </td>
                <td className="py-3 px-3 text-right text-zinc-800 font-mono border-r border-zinc-200">
                  {formatINR(item.unit_price)}
                </td>
                <td className="py-3 px-3 text-right font-bold text-zinc-950 font-mono">
                  {formatINR(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FINANCIAL SUMMARY & AMOUNT IN WORDS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-4 page-break-avoid">
        {/* Left Side: Amount in Words & Notes */}
        <div className="sm:col-span-7 flex flex-col justify-between text-xs space-y-3">
          <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Amount in Words
            </p>
            <p className="font-semibold text-zinc-900 mt-1 italic font-serif leading-relaxed">
              {numberToIndianWords(document.total_amount)}
            </p>
          </div>

          {document.notes && (
            <div className="bg-amber-50/60 border border-amber-200/70 p-2.5 rounded text-zinc-800 text-[11px]">
              <span className="font-bold text-amber-950 block mb-0.5">Special Notes & Instructions:</span>
              <p className="leading-relaxed">{document.notes}</p>
            </div>
          )}

          {/* Payment History if Invoice */}
          {!isQuotation && invoice?.payments && invoice.payments.length > 0 && (
            <div className="border border-zinc-200 rounded p-2.5 bg-zinc-50/50">
              <p className="font-bold text-zinc-900 text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Recorded Payments
              </p>
              <div className="space-y-1">
                {invoice.payments.map((p, pIdx) => (
                  <div
                    key={p.id || pIdx}
                    className="flex justify-between items-center text-[11px] text-zinc-700 border-b border-zinc-200/60 pb-1"
                  >
                    <span className="flex items-center gap-2">
                      <strong className="font-mono">{p.payment_date}</strong> via {p.payment_method}{' '}
                      <span className="text-zinc-500 font-mono text-[10px]">({p.receipt_number})</span>
                      {onViewReceipt && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(p)}
                          className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition shadow-2xs cursor-pointer"
                          title="Print or view receipt voucher"
                        >
                          <Receipt className="w-2.5 h-2.5" />
                          Receipt
                        </button>
                      )}
                    </span>
                    <span className="font-bold font-mono text-emerald-800">
                      +{formatINR(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Installment Milestone Plan: Half Paid / Half Due Later */}
          {!isQuotation && invoice && invoice.paid_amount > 0 && invoice.balance_amount > 0 && (
            <div className="bg-gradient-to-r from-indigo-50/80 to-emerald-50/80 border border-indigo-200/90 rounded p-2.5 text-[11px] text-zinc-800 space-y-1.5 shadow-2xs">
              <div className="flex justify-between items-center font-bold text-zinc-900">
                <span className="flex items-center gap-1.5 text-indigo-950">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Payment Installment Schedule
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">
                  {Math.round((invoice.paid_amount / invoice.total_amount) * 100)}% Received •{' '}
                  {100 - Math.round((invoice.paid_amount / invoice.total_amount) * 100)}% Later
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5">
                <div className="bg-white/90 p-1.5 rounded border border-emerald-200 shadow-2xs">
                  <span className="text-emerald-800 font-bold block">✓ Paid / Received:</span>
                  <span className="font-mono font-bold text-xs text-emerald-950">
                    {formatINR(invoice.paid_amount)}
                  </span>
                </div>
                <div className="bg-white/90 p-1.5 rounded border border-amber-300 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-amber-900 font-bold block">⏳ Payable Later (2nd Payment):</span>
                    <span className="font-mono font-bold text-xs text-amber-950">
                      {formatINR(invoice.balance_amount)}
                    </span>
                    <span className="block text-[9px] text-zinc-500 mt-0.5 font-mono">
                      Due: {invoice.due_date}
                    </span>
                  </div>
                  {onPayRemainingClick && (
                    <button
                      type="button"
                      onClick={onPayRemainingClick}
                      className="no-print mt-2 w-full py-1 px-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <CreditCard className="w-3 h-3 text-indigo-200" />
                      Pay 2nd Installment ({formatINR(invoice.balance_amount)}) →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quotation Installment Milestones */}
          {isQuotation && quotation && quotation.advance_amount > 0 && (
            <div className="bg-gradient-to-r from-indigo-50/80 to-sky-50/80 border border-indigo-200/90 rounded p-2.5 text-[11px] text-zinc-800 space-y-1.5 shadow-2xs">
              <div className="flex justify-between items-center font-bold text-zinc-900">
                <span className="flex items-center gap-1.5 text-indigo-950">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Proposed Payment Split Milestones
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">
                  {Math.round((quotation.advance_amount / quotation.total_amount) * 100)}% Advance Plan
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5">
                <div className="bg-white/90 p-1.5 rounded border border-indigo-200 shadow-2xs">
                  <span className="text-indigo-800 font-bold block">1st Half (Booking Deposit):</span>
                  <span className="font-mono font-bold text-xs text-indigo-950">
                    {formatINR(quotation.advance_amount)}
                  </span>
                </div>
                <div className="bg-white/90 p-1.5 rounded border border-zinc-200 shadow-2xs">
                  <span className="text-zinc-700 font-bold block">2nd Half (Payable on Event):</span>
                  <span className="font-mono font-bold text-xs text-zinc-950">
                    {formatINR(quotation.balance_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Structured Totals Breakdown */}
        <div className="sm:col-span-5 text-xs">
          <div className="bg-zinc-50 border border-zinc-300 rounded overflow-hidden">
            <div className="divide-y divide-zinc-200">
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-zinc-600 font-medium">Subtotal</span>
                <span className="font-semibold font-mono text-zinc-950">{formatINR(document.subtotal)}</span>
              </div>

              {document.discount_amount > 0 && (
                <div className="flex justify-between px-3.5 py-2 text-rose-700 bg-rose-50/50">
                  <span className="font-medium">
                    Discount {document.discount_type === 'percentage' ? `(${document.discount_value}%)` : ''}
                  </span>
                  <span className="font-semibold font-mono">-{formatINR(document.discount_amount)}</span>
                </div>
              )}

              {/* Tax Calculations */}
              {document.tax_type === 'intra' && (
                <>
                  <div className="flex justify-between px-3.5 py-1.5 text-zinc-700">
                    <span className="text-zinc-600">CGST ({document.tax_rate / 2}%)</span>
                    <span className="font-mono">{formatINR(document.cgst_amount || document.tax_amount / 2)}</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-1.5 text-zinc-700">
                    <span className="text-zinc-600">SGST ({document.tax_rate / 2}%)</span>
                    <span className="font-mono">{formatINR(document.sgst_amount || document.tax_amount / 2)}</span>
                  </div>
                </>
              )}

              {document.tax_type === 'inter' && (
                <div className="flex justify-between px-3.5 py-2 text-zinc-700">
                  <span className="text-zinc-600">IGST ({document.tax_rate}%)</span>
                  <span className="font-mono">{formatINR(document.tax_amount)}</span>
                </div>
              )}

              {document.tax_type === 'none' && (
                <div className="flex justify-between px-3.5 py-1.5 text-zinc-500 text-[11px]">
                  <span>Tax (Non-GST / Exempt)</span>
                  <span className="font-mono">₹0</span>
                </div>
              )}

              {/* Final Document Total */}
              <div className="flex justify-between px-3.5 py-2.5 bg-zinc-900 text-white font-bold text-sm">
                <span>{isQuotation ? 'Total Quotation Amount' : 'Total Amount'}</span>
                <span className="font-mono">{formatINR(document.total_amount)}</span>
              </div>

              {/* Quotation: Advance Deposit Required */}
              {isQuotation && document.advance_amount > 0 && (
                <div className="flex justify-between px-3.5 py-2 text-zinc-800 bg-zinc-100/70">
                  <span className="font-medium">Advance Deposit Required</span>
                  <span className="font-semibold font-mono text-zinc-900">
                    -{formatINR(document.advance_amount)}
                  </span>
                </div>
              )}

              {/* Invoice: Advance Payment Received */}
              {!isQuotation && displayAdvanceAmount > 0 && (
                <div className="flex justify-between px-3.5 py-2 text-zinc-800 bg-zinc-100/70">
                  <span className="font-medium">Advance Payment Received</span>
                  <span className="font-semibold font-mono text-emerald-800">
                    -{formatINR(displayAdvanceAmount)}
                  </span>
                </div>
              )}

              {/* Invoice: Subsequent / Installment Payments Received */}
              {!isQuotation && subsequentPaidAmount > 0 && (
                <div className="flex justify-between px-3.5 py-2 text-zinc-800 bg-zinc-100/70">
                  <span className="font-medium">
                    {displayAdvanceAmount > 0 ? 'Subsequent Payment(s) Received' : 'Payment(s) Received'}
                  </span>
                  <span className="font-semibold font-mono text-emerald-800">
                    -{formatINR(subsequentPaidAmount)}
                  </span>
                </div>
              )}

              {/* Invoice: Total Received summary when multiple payments exist */}
              {!isQuotation && displayAdvanceAmount > 0 && subsequentPaidAmount > 0 && (
                <div className="flex justify-between px-3.5 py-1.5 text-zinc-600 text-xs bg-zinc-50 border-t border-zinc-200">
                  <span className="font-medium">Total Amount Received</span>
                  <span className="font-bold font-mono text-emerald-950">
                    {formatINR(totalAmountPaid)}
                  </span>
                </div>
              )}

              {/* Outstanding Balance or Estimated Balance */}
              <div className="flex justify-between px-3.5 py-2.5 bg-zinc-200/90 font-bold border-t border-zinc-300">
                <span className="text-zinc-900">
                  {isQuotation ? 'Estimated Balance Payable' : 'Balance Outstanding'}
                </span>
                <span
                  className={`font-mono text-sm ${
                    document.balance_amount > 0 ? 'text-zinc-950' : 'text-emerald-700 font-bold'
                  }`}
                >
                  {document.balance_amount === 0 ? '₹0 (Paid in Full)' : formatINR(document.balance_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: BANK & UPI DETAILS, TERMS & CONDITIONS, SIGNATURE */}
      <div className="mt-6 pt-4 border-t-2 border-zinc-900 page-break-avoid">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 text-xs">
          {/* Bank & UPI Details with Live QR Code */}
          <div className="sm:col-span-5 bg-zinc-50 p-3 rounded border border-zinc-200">
            <p className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
              Bank & Instant UPI Payment Details
            </p>
            <div className="flex gap-3 items-center">
              <div className="bg-white p-1.5 rounded border border-zinc-300 shrink-0">
                <QRCodeSVG value={upiPayString} size={72} level="M" />
                <span className="block text-[8px] text-center font-bold text-zinc-500 mt-0.5">
                  Scan to Pay
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-zinc-700 leading-snug">
                <p>
                  <span className="font-semibold text-zinc-900">Bank:</span> {shop.bank_name}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">A/C:</span>{' '}
                  <span className="font-mono font-bold text-zinc-950">{shop.account_number}</span>
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">IFSC:</span>{' '}
                  <span className="font-mono font-bold text-zinc-950">{shop.ifsc_code}</span>
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">UPI ID:</span>{' '}
                  <span className="font-mono font-bold text-zinc-950">{shop.upi_id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="sm:col-span-4 text-[10px] text-zinc-600 leading-relaxed">
            <p className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider mb-1.5">
              Terms & Conditions
            </p>
            <div className="space-y-1 whitespace-pre-line text-zinc-600 max-h-32 overflow-hidden text-[10px]">
              {document.terms || shop.default_terms}
            </div>
          </div>

          {/* Signature Block */}
          <div className="sm:col-span-3 flex flex-col justify-between items-center sm:items-end text-center sm:text-right pt-2">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-zinc-800">
                For <span className="font-bold uppercase">{shop.shop_name}</span>
              </p>
              {shop.signature_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.signature_url}
                  alt="Authorized Signature"
                  className="h-12 w-auto object-contain my-1"
                />
              ) : (
                <div className="h-12 flex items-center justify-center italic text-zinc-400 font-serif text-sm">
                  {shop.owner_name}
                </div>
              )}
            </div>
            <div className="border-t border-zinc-400 pt-1 w-36 text-center">
              <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider">
                Authorized Signatory
              </p>
              <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{docDate}</p>
            </div>
          </div>
        </div>

        {/* Studio Disclaimer Footer */}
        <div className="mt-4 pt-2 border-t border-zinc-200 text-center text-[9px] text-zinc-400 tracking-wide font-mono">
          This is a computer-generated {docTitle.toLowerCase()} issued by {shop.shop_name}. Valid without physical signature if digitally verified.
        </div>
      </div>
    </div>
  );
};
