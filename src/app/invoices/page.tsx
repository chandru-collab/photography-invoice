'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Invoice, InvoiceStatus } from '@/types';
import { deleteInvoice, getInvoices, getInvoicesSync, initializeStorage } from '@/lib/storage';
import { formatINR } from '@/lib/numberToWords';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import {
  ReceiptText,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Trash2,
} from 'lucide-react';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    initializeStorage();
    // 1. Instant render
    setInvoices(getInvoicesSync());
    setLoading(false);

    // 2. Background sync
    getInvoices().then((data) => {
      if (data) setInvoices(data);
    });
  }, []);

  const filtered = invoices.filter((i) => {
    const matchesSearch =
      `${i.invoice_number} ${i.customer_name} ${i.event_type} ${i.event_venue} ${i.quotation_number || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || i.payment_status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      setIsDeleting(true);
      await deleteInvoice(invoiceToDelete.id);
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-mono">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">Photography Tax Invoices</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track billed client events, payment installments, GST compliance, and outstanding dues
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition shadow-xs min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search invoice number, client, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {/* Status Filter Tabs with smooth scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs w-full sm:w-auto">
          {['all', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              suppressHydrationWarning
              className={`px-3 py-1.5 sm:py-1 rounded-md text-xs font-medium transition shrink-0 cursor-pointer ${
                statusFilter.toLowerCase() === st.toLowerCase()
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices: Mobile Cards View & Desktop Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* 1. Mobile Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-200">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-mono">
              Loading invoices...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-4 text-center text-zinc-500">
              <p className="font-semibold text-sm text-zinc-800">No invoices found</p>
              <p className="text-xs text-zinc-400 mt-1">
                Create an invoice directly or convert an accepted quotation.
              </p>
            </div>
          ) : (
            filtered.map((inv) => (
              <div key={inv.id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-zinc-50/60 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-zinc-950">
                    <div>{inv.invoice_number}</div>
                    {inv.quotation_number && (
                      <span className="text-[10px] text-zinc-400 font-normal">
                        Ref: {inv.quotation_number}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      inv.payment_status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : inv.payment_status === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : inv.payment_status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                    }`}
                  >
                    {inv.payment_status}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-sm text-zinc-900">{inv.customer_name}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-0.5">
                    <span className="truncate max-w-[200px]">{inv.event_type}</span>
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0">Date: {inv.invoice_date}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs">
                    <span className="text-[10px] text-zinc-400 block uppercase">Total / Due</span>
                    <span className="font-bold text-zinc-950">{formatINR(inv.total_amount)}</span>
                    {inv.balance_amount > 0 ? (
                      <span className="ml-1.5 text-amber-900 font-semibold text-[11px]">
                        (Due: {formatINR(inv.balance_amount)})
                      </span>
                    ) : (
                      <span className="ml-1.5 text-emerald-700 font-semibold text-[11px]">
                        (Paid)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-300 transition min-h-[36px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </Link>
                    <button
                      type="button"
                      onClick={() => setInvoiceToDelete(inv)}
                      className="inline-flex items-center justify-center text-rose-700 hover:text-rose-900 p-2 rounded-lg border border-rose-200 hover:bg-rose-50 transition min-h-[36px] min-w-[36px] cursor-pointer"
                      title={`Delete ${inv.invoice_number}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Client / Event</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <p className="font-semibold text-sm text-zinc-800">No invoices found</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Create an invoice directly or convert an accepted quotation.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-950">
                      <div>{inv.invoice_number}</div>
                      {inv.quotation_number && (
                        <div className="text-[10px] text-zinc-400 font-normal">
                          Ref: {inv.quotation_number}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900">{inv.customer_name}</p>
                      <p className="text-[11px] text-zinc-500 truncate max-w-xs">{inv.event_type}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-600">{inv.invoice_date}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500">{inv.due_date}</td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950">
                      {formatINR(inv.total_amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {formatINR(inv.paid_amount || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950">
                      <span className={inv.balance_amount > 0 ? 'text-amber-900' : 'text-emerald-700'}>
                        {formatINR(inv.balance_amount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : inv.payment_status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : inv.payment_status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600 px-2.5 py-1 rounded border border-zinc-200 hover:bg-zinc-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </Link>
                        <button
                          type="button"
                          onClick={() => setInvoiceToDelete(inv)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                          title={`Delete ${inv.invoice_number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!invoiceToDelete}
        title="Delete Tax Invoice"
        message={`Are you sure you want to delete tax invoice ${invoiceToDelete?.invoice_number}? All payment and billing records for this invoice will be permanently removed.`}
        docNumber={invoiceToDelete?.invoice_number}
        docType="invoice"
        clientName={invoiceToDelete?.customer_name}
        amount={invoiceToDelete?.total_amount}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setInvoiceToDelete(null);
        }}
      />
    </div>
  );
}
