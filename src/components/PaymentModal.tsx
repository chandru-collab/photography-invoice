'use client';

import React, { useState } from 'react';
import { Invoice, PaymentMethod, PaymentRecord, ShopProfile } from '@/types';
import { formatINR, numberToIndianWords } from '@/lib/numberToWords';
import { recordPayment } from '@/lib/storage';
import { printStandaloneReceipt, downloadReceiptPdf, generateReceiptPdfFile } from '@/lib/receiptPrinter';
import { generatePaymentReceiptWhatsAppText, generatePaymentReceiptWhatsAppUrl } from '@/lib/whatsapp';
import { sharePdfToWhatsApp } from '@/lib/pdfShare';
import { X, Check, Printer, Receipt, CreditCard, Download, MessageCircle, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  invoice: Invoice;
  shop: ShopProfile;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: (updatedInvoice: Invoice) => void;
  initialReceipt?: PaymentRecord | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  shop,
  isOpen,
  onClose,
  onPaymentRecorded,
  initialReceipt = null,
}) => {
  const [amount, setAmount] = useState<number>(invoice.balance_amount || 0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isSharingReceiptPdf, setIsSharingReceiptPdf] = useState<boolean>(false);
  const [receiptShareFeedback, setReceiptShareFeedback] = useState<string | null>(null);

  // When modal is opened fresh from outside with no initialReceipt, ensure we show payment form
  React.useEffect(() => {
    if (isOpen && !initialReceipt) {
      setLastReceipt(null);
      setAmount(invoice.balance_amount || 0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setTransactionRef('');
      if (invoice.paid_amount > 0 && invoice.balance_amount > 0) {
        setNotes('Final settlement (2nd payment / balance cleared)');
      } else {
        setNotes('');
      }
    }
  }, [isOpen, initialReceipt, invoice.balance_amount, invoice.paid_amount]);

  if (!isOpen) return null;

  const activeReceipt = initialReceipt || lastReceipt;

  const handleClose = () => {
    setLastReceipt(null);
    setReceiptShareFeedback(null);
    onClose();
  };

  const handlePayRemaining = () => {
    setLastReceipt(null);
    setAmount(invoice.balance_amount || 0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTransactionRef('');
    setNotes(
      invoice.payments && invoice.payments.length >= 1
        ? `Second installment / Final settlement (Clearing balance of ₹${invoice.balance_amount})`
        : 'Final Settlement'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await recordPayment(invoice.id, {
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: transactionRef || 'DIRECT-PAY',
        notes: notes || undefined,
      });

      // Find the latest payment record added
      const latest = updated.payments[updated.payments.length - 1];
      setLastReceipt(latest);
      onPaymentRecorded(updated);
    } catch (err) {
      console.error('Failed to record payment:', err);
      alert('Error recording payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!activeReceipt) return;
    printStandaloneReceipt({ payment: activeReceipt, invoice, shop });
  };

  const handleDownloadPdf = async () => {
    if (!activeReceipt) return;
    try {
      setIsDownloadingPdf(true);
      await downloadReceiptPdf({ payment: activeReceipt, invoice, shop });
    } catch (err) {
      console.error('Failed to export receipt PDF:', err);
      alert('Could not generate PDF. Please try printing directly.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleWhatsAppReceiptPdf = async () => {
    if (!activeReceipt) return;
    try {
      setIsSharingReceiptPdf(true);
      setReceiptShareFeedback(null);

      const pdfFile = await generateReceiptPdfFile({
        payment: activeReceipt,
        invoice,
        shop,
      });

      const text = generatePaymentReceiptWhatsAppText(activeReceipt, invoice, shop);
      const phone = invoice.customer_phone;
      const title = `Payment Receipt ${activeReceipt.receipt_number} - ${shop.shop_name}`;

      const result = await sharePdfToWhatsApp({
        file: pdfFile,
        phone,
        title,
        text,
      });

      if (result.method === 'download_and_web' && result.message) {
        setReceiptShareFeedback(result.message);
        setTimeout(() => setReceiptShareFeedback(null), 8000);
      }
    } catch (e) {
      console.error('Failed to share receipt PDF to WhatsApp:', e);
      const url = generatePaymentReceiptWhatsAppUrl(activeReceipt, invoice, shop);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsSharingReceiptPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {activeReceipt ? 'Payment Receipt Voucher' : 'Record Payment & Receipt'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition p-1.5 rounded-full hover:bg-zinc-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Receipt exists, show receipt voucher view */}
        {activeReceipt ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {!initialReceipt && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 mb-4 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1.5">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-emerald-950 text-sm">Payment Recorded Successfully!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Receipt No: <span className="font-mono font-bold">{activeReceipt.receipt_number}</span>
                </p>
              </div>
            )}

            {/* Printable Mini Receipt Card */}
            <div
              id="payment-receipt-preview"
              className="border-2 border-zinc-900 rounded p-4 bg-white text-xs space-y-2.5 mb-4 shadow-sm"
            >
              <div className="flex justify-between items-start pb-2 border-b border-zinc-300">
                <div>
                  <h5 className="font-bold text-sm uppercase text-zinc-950">{shop.shop_name}</h5>
                  <p className="text-[10px] text-zinc-500">{shop.address}, {shop.city}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Receipt
                  </span>
                  <p className="font-mono font-bold text-xs text-zinc-900 mt-0.5">{activeReceipt.receipt_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-zinc-500 block">Received From:</span>
                  <span className="font-bold text-zinc-900">{invoice.customer_name}</span>
                  <span className="text-zinc-500 block text-[10px]">{invoice.customer_phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block">Invoice Reference:</span>
                  <span className="font-mono font-bold text-zinc-900">{invoice.invoice_number}</span>
                  <span className="text-zinc-500 block text-[10px]">Date: {activeReceipt.payment_date}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-emerald-50 border border-emerald-300 rounded p-2.5 my-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-[11px] text-emerald-900">Amount Received:</span>
                  <span className="font-bold font-mono text-lg text-emerald-950">{formatINR(activeReceipt.amount)}</span>
                </div>
                <p className="text-[10px] text-emerald-800 italic pt-1 border-t border-emerald-200/70 mt-1">
                  In words: {numberToIndianWords(activeReceipt.amount)}
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-700 pt-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment Mode:</span>
                  <span className="font-semibold text-zinc-900">{activeReceipt.payment_method}</span>
                </div>
                {activeReceipt.transaction_reference && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ref / UTR:</span>
                    <span className="font-mono text-zinc-800">{activeReceipt.transaction_reference}</span>
                  </div>
                )}
                {activeReceipt.notes && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Remarks:</span>
                    <span className="text-zinc-800 italic">{activeReceipt.notes}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-zinc-200 text-xs">
                  <span className="text-zinc-600 font-medium">Remaining Invoice Balance:</span>
                  <span className={`font-mono font-bold ${invoice.balance_amount === 0 ? 'text-emerald-700' : 'text-zinc-950'}`}>
                    {invoice.balance_amount === 0 ? '₹0 (Fully Paid)' : formatINR(invoice.balance_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Pay Remaining Balance / 2nd Installment Card */}
            {invoice.balance_amount > 0 ? (
              <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border-2 border-indigo-200 rounded-lg p-3.5 mb-4 text-xs shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wide">
                      Pending Balance
                    </span>
                    <span className="font-bold text-zinc-900 text-xs">
                      Remaining Bill to Pay:
                    </span>
                  </div>
                  <span className="font-mono font-black text-sm text-amber-950">
                    {formatINR(invoice.balance_amount)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 mb-3 leading-relaxed">
                  Client has an outstanding balance of <strong>{formatINR(invoice.balance_amount)}</strong>. You can record the second installment / remaining bill now:
                </p>
                <button
                  type="button"
                  onClick={handlePayRemaining}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-md flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-indigo-200" />
                  Pay Remaining Bill (2nd Payment: {formatINR(invoice.balance_amount)}) →
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-4 text-xs text-emerald-950 flex items-center justify-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                This invoice is 100% fully paid and settled! No remaining balance.
              </div>
            )}

            {/* Dedicated Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-200">
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full sm:w-auto justify-center px-3.5 py-2.5 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Print only this receipt voucher without the invoice"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="w-full sm:w-auto justify-center px-3 py-2.5 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  title="Download receipt as PDF"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                  PDF
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppReceiptPdf}
                  disabled={isSharingReceiptPdf}
                  className="w-full sm:w-auto justify-center px-3 py-2.5 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 hover:bg-emerald-700 disabled:opacity-60 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Share payment receipt voucher PDF directly on WhatsApp"
                >
                  {isSharingReceiptPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-3.5 h-3.5" />
                  )}
                  {isSharingReceiptPdf ? 'Generating PDF...' : 'WhatsApp PDF'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Desktop Fallback Guidance Toast Banner */}
            {receiptShareFeedback && (
              <div className="mt-3 bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 text-xs text-emerald-950 flex items-center justify-between shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{receiptShareFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptShareFeedback(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : invoice.balance_amount === 0 ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-950 text-base">Invoice Fully Paid & Settled</h4>
              <p className="text-xs text-zinc-500 mt-1">
                All installments and balances for this invoice have been paid in full.
              </p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-left space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                Recorded Receipts ({invoice.payments?.length || 0}):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {invoice.payments?.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center text-xs bg-white p-2.5 rounded border border-zinc-200"
                  >
                    <div>
                      <span className="font-mono font-bold text-zinc-900">{p.receipt_number}</span>
                      <span className="text-zinc-500 text-[10px] block">
                        {p.payment_date} via {p.payment_method}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-emerald-700">{formatINR(p.amount)}</span>
                      <button
                        type="button"
                        onClick={() => setLastReceipt(p)}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition cursor-pointer"
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* Installment Context Banner if subsequent payment */}
            {invoice.paid_amount > 0 && invoice.balance_amount > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Recording 2nd / Final Payment
                  </span>
                  <span className="text-[11px] text-indigo-800 block mt-0.5">
                    1st payment of <strong>{formatINR(invoice.paid_amount)}</strong> received. Remaining balance: <strong>{formatINR(invoice.balance_amount)}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAmount(invoice.balance_amount);
                    setNotes('Final settlement (2nd payment / balance cleared)');
                  }}
                  className="shrink-0 px-2.5 py-1 text-[11px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition cursor-pointer"
                >
                  Clear Full Balance ({formatINR(invoice.balance_amount)})
                </button>
              </div>
            )}

            {/* Invoice Overview Pill */}
            <div className="bg-zinc-50 p-3 rounded border border-zinc-200 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-zinc-900">{invoice.invoice_number}</p>
                <p className="text-zinc-500 text-[11px]">{invoice.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-[11px]">Outstanding Balance:</p>
                <p className="font-bold font-mono text-sm text-zinc-950">
                  {formatINR(invoice.balance_amount)}
                </p>
              </div>
            </div>

            {/* Payment Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                {invoice.balance_amount > 1 && (
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Half: <strong>{formatINR(Math.round(invoice.balance_amount / 2))}</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  max={invoice.balance_amount || 9999999}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-zinc-300 rounded text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {/* Quick Installment Selection Pills: Pay Half vs Full */}
              <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Quick Installment:
                </span>
                {invoice.balance_amount > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(invoice.balance_amount / 2);
                      setAmount(half);
                      if (!notes) {
                        setNotes(
                          invoice.paid_amount > 0
                            ? 'Intermediate installment payment'
                            : '1st Installment (50% Half Payment) - Remaining 50% payable later'
                        );
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded border transition cursor-pointer ${
                      amount === Math.round(invoice.balance_amount / 2)
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    Pay Half 50% ({formatINR(Math.round(invoice.balance_amount / 2))})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAmount(invoice.balance_amount);
                    if (!notes) {
                      setNotes(
                        invoice.paid_amount > 0
                          ? 'Final settlement (2nd Half / Remaining balance cleared)'
                          : 'Full invoice settlement'
                      );
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded border transition cursor-pointer ${
                    amount === invoice.balance_amount
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Pay Full 100% ({formatINR(invoice.balance_amount)})
                </button>
              </div>

              {/* Installment Plan Banner if Half/Partial Amount is entered */}
              {amount > 0 && amount < invoice.balance_amount && (
                <div className="mt-2 bg-amber-50 border border-amber-200/80 rounded p-2 text-[11px] text-amber-950 flex items-center justify-between shadow-2xs">
                  <span>
                    💳 <strong>Half / Partial Payment:</strong> Paying {formatINR(amount)} now.
                  </span>
                  <span className="font-bold font-mono text-amber-900">
                    Remaining {formatINR(invoice.balance_amount - amount)} payable later
                  </span>
                </div>
              )}

              {amount > 0 && (
                <p className="text-[11px] text-zinc-500 italic mt-1 font-serif">
                  {numberToIndianWords(amount)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit / Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Transaction Reference / Note */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Transaction / UTR / Cheque Ref No.
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/HDFC/604928172901 or Cheque #49201"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Remarks / Payment Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Second installment paid after teaser delivery"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-zinc-200 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-2 min-h-[40px] sm:min-h-0 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording...
                  </>
                ) : invoice.paid_amount > 0 ? (
                  `Record 2nd Payment & Generate Receipt (${formatINR(amount)})`
                ) : (
                  'Record Payment & Generate Receipt'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
