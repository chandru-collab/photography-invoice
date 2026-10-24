'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Quotation, QuotationStatus } from '@/types';
import { deleteQuotation, getQuotations, getQuotationsSync, initializeStorage } from '@/lib/storage';
import { formatINR } from '@/lib/numberToWords';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';

export default function QuotationsListPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    initializeStorage();
    // 1. Instant render
    setQuotations(getQuotationsSync());
    setLoading(false);

    // 2. Background sync
    getQuotations().then((data) => {
      if (data) setQuotations(data);
    });
  }, []);

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      `${q.quotation_number} ${q.customer_name} ${q.event_type} ${q.event_venue}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || q.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;
    try {
      setIsDeleting(true);
      await deleteQuotation(quotationToDelete.id);
      setQuotations((prev) => prev.filter((q) => q.id !== quotationToDelete.id));
      setQuotationToDelete(null);
    } catch (err) {
      console.error('Failed to delete quotation:', err);
      alert('Failed to delete quotation. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-mono">Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">Photography Quotations</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Create, estimate, send via WhatsApp, and convert client proposals into active invoices
          </p>
        </div>
        <Link
          href="/quotations/new"
          className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition shadow-xs min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search quotation number, couple, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {/* Status Filter Tabs with horizontal smooth scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs w-full sm:w-auto">
          {['all', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map((st) => (
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
              {st === 'all' ? 'All Quotes' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations: Mobile Cards View & Desktop Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* 1. Mobile Cards View (md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-200">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-mono">
              Loading quotations...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 px-4 text-center text-zinc-500">
              <p className="font-semibold text-sm text-zinc-800">No quotations found</p>
              <p className="text-xs text-zinc-400 mt-1">
                Click the &quot;Create Quotation&quot; button to prepare your first client quote.
              </p>
            </div>
          ) : (
            filtered.map((q) => (
              <div key={q.id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-zinc-50/60 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-zinc-950">
                    {q.quotation_number}
                  </div>
                  <span
                    className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      q.status === 'Accepted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : q.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : q.status === 'Expired'
                        ? 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-sm text-zinc-900">{q.customer_name}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-0.5">
                    <span className="truncate max-w-[200px]">{q.event_type}</span>
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0">Date: {q.quotation_date}</span>
                  </div>
                  {q.validity_date && (
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Valid until: {q.validity_date}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs">
                    <span className="text-[10px] text-zinc-400 block uppercase">Estimate Total</span>
                    <span className="font-bold text-zinc-950">{formatINR(q.total_amount)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/quotations/${q.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-300 transition min-h-[36px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </Link>
                    <button
                      type="button"
                      onClick={() => setQuotationToDelete(q)}
                      className="inline-flex items-center justify-center text-rose-700 hover:text-rose-900 p-2 rounded-lg border border-rose-200 hover:bg-rose-50 transition min-h-[36px] min-w-[36px] cursor-pointer"
                      title={`Delete ${q.quotation_number}`}
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
                <th className="py-3 px-4">Quotation No.</th>
                <th className="py-3 px-4">Client / Event Details</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total (Inc. GST)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    Loading quotations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <p className="font-semibold text-sm text-zinc-800">No quotations found</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Click the &quot;Create Quotation&quot; button to prepare your first client quote.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-zinc-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-950">
                      {q.quotation_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900">{q.customer_name}</p>
                      <p className="text-[11px] text-zinc-500 truncate max-w-xs">{q.event_type}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600">{q.quotation_date}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500">{q.validity_date}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-700">
                      {formatINR(q.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950">
                      {formatINR(q.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                          q.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : q.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : q.status === 'Expired'
                            ? 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600 px-2.5 py-1 rounded border border-zinc-200 hover:bg-zinc-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </Link>
                        <button
                          type="button"
                          onClick={() => setQuotationToDelete(q)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                          title={`Delete ${q.quotation_number}`}
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
        isOpen={!!quotationToDelete}
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation ${quotationToDelete?.quotation_number}? This proposal will be permanently removed.`}
        docNumber={quotationToDelete?.quotation_number}
        docType="quotation"
        clientName={quotationToDelete?.customer_name}
        amount={quotationToDelete?.total_amount}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setQuotationToDelete(null);
        }}
      />
    </div>
  );
}
