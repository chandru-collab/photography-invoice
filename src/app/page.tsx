'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Customer,
  DashboardStats,
  Invoice,
  Quotation,
  ShopProfile,
} from '@/types';
import {
  calculateStats,
  deleteInvoice,
  deleteQuotation,
  getCustomers,
  getDashboardStats,
  getInvoices,
  getInvoicesSync,
  getQuotations,
  getQuotationsSync,
  getShopProfile,
  getShopProfileSync,
  initializeStorage,
} from '@/lib/storage';
import { formatINR } from '@/lib/numberToWords';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import {
  FileText,
  ReceiptText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  Camera,
  Calendar,
  Eye,
  CreditCard,
  Building2,
  Trash2,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'invoices' | 'quotations'>('all');
  const [loading, setLoading] = useState(true);
  const [docToDelete, setDocToDelete] = useState<CombinedDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    initializeStorage();
    // 1. Instant local-first load (0ms rendering!)
    const localShop = getShopProfileSync();
    const localQuotations = getQuotationsSync();
    const localInvoices = getInvoicesSync();
    setShop(localShop);
    setQuotations(localQuotations);
    setInvoices(localInvoices);
    setStats(calculateStats(localQuotations, localInvoices));
    setLoading(false);

    // 2. Background sync with Supabase (non-blocking)
    async function backgroundSync() {
      try {
        const [dashStats, shopData, qList, iList] = await Promise.all([
          getDashboardStats(),
          getShopProfile(),
          getQuotations(),
          getInvoices(),
        ]);
        if (shopData) setShop(shopData);
        if (qList) setQuotations(qList);
        if (iList) setInvoices(iList);
        if (dashStats) setStats(dashStats);
      } catch (err) {
        // Fallback already displayed
      }
    }
    backgroundSync();
  }, []);

  // Filter documents by search and tab
  const filteredQuotations = quotations.filter((q) =>
    `${q.quotation_number} ${q.customer_name} ${q.event_type} ${q.event_venue}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = invoices.filter((i) =>
    `${i.invoice_number} ${i.customer_name} ${i.event_type} ${i.event_venue}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  type CombinedDoc = {
    id: string;
    docNumber: string;
    type: 'quotation' | 'invoice';
    customerName: string;
    eventType: string;
    date: string;
    totalAmount: number;
    balance: number;
    status: string;
  };

  const combinedDocs: CombinedDoc[] = [
    ...filteredInvoices.map((i) => ({
      id: i.id,
      docNumber: i.invoice_number,
      type: 'invoice' as const,
      customerName: i.customer_name,
      eventType: i.event_type,
      date: i.invoice_date,
      totalAmount: i.total_amount,
      balance: i.balance_amount,
      status: i.payment_status,
    })),
    ...filteredQuotations.map((q) => ({
      id: q.id,
      docNumber: q.quotation_number,
      type: 'quotation' as const,
      customerName: q.customer_name,
      eventType: q.event_type,
      date: q.quotation_date,
      totalAmount: q.total_amount,
      balance: q.balance_amount,
      status: q.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedDocs =
    activeTab === 'invoices'
      ? combinedDocs.filter((d) => d.type === 'invoice')
      : activeTab === 'quotations'
      ? combinedDocs.filter((d) => d.type === 'quotation')
      : combinedDocs;

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      setIsDeleting(true);
      if (docToDelete.type === 'quotation') {
        await deleteQuotation(docToDelete.id);
        const updatedQ = quotations.filter((q) => q.id !== docToDelete.id);
        setQuotations(updatedQ);
        setStats(calculateStats(updatedQ, invoices));
      } else {
        await deleteInvoice(docToDelete.id);
        const updatedI = invoices.filter((i) => i.id !== docToDelete.id);
        setInvoices(updatedI);
        setStats(calculateStats(quotations, updatedI));
      }
      setDocToDelete(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-mono">Loading studio dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-950 tracking-tight">
              {shop?.shop_name || 'Photography Studio'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-white uppercase tracking-wider shrink-0">
              Studio Portal
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            Manage quotations, tax invoices, client event shoots, and real-time payment collections.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/quotations/new"
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-300 transition shadow-2xs min-h-[42px]"
          >
            <Plus className="w-4 h-4 text-zinc-600" />
            <span>New Quote</span>
          </Link>
          <Link
            href="/invoices/new"
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition shadow-xs min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* METRIC STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invoices & Billed */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Total Invoices
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-950">
              {stats?.totalInvoices || 0}
            </div>
            <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate">
              Value: <strong className="text-zinc-900">{formatINR(stats?.invoicesValue || 0)}</strong>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>{stats?.paidInvoicesCount || 0} Fully Paid</span>
            <span className="text-amber-700 font-medium">{stats?.pendingInvoicesCount || 0} Pending</span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Payments Received
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
              {formatINR(stats?.totalCollected || 0)}
            </div>
            <p className="text-xs text-zinc-600 font-mono mt-0.5">
              Realized studio income
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
            Cleared to bank & UPI
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Outstanding Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900">
              {formatINR(stats?.totalOutstanding || 0)}
            </div>
            <p className="text-xs text-zinc-600 font-mono mt-0.5">
              Receivables due from clients
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>{stats?.pendingInvoicesCount || 0} with balance</span>
            {stats?.overdueInvoicesCount ? (
              <span className="text-rose-600 font-bold">{stats.overdueInvoicesCount} Overdue</span>
            ) : (
              <span className="text-zinc-500 font-mono">0 Overdue</span>
            )}
          </div>
        </div>

        {/* Quotations Pipeline */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Quotations Pipeline
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-950">
              {stats?.totalQuotations || 0}
            </div>
            <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate">
              Pipeline: <strong className="text-zinc-900">{formatINR(stats?.quotationsValue || 0)}</strong>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>{stats?.acceptedQuotationsCount || 0} Accepted</span>
            <Link href="/quotations" className="text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
        </div>
      </div>

      {/* RECENT DOCUMENTS: TABLE (DESKTOP/TABLET) & CARDS (MOBILE) */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Top Controls */}
        <div className="p-3.5 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold font-serif text-zinc-950">Recent Documents</h2>
            <span className="text-xs text-zinc-500 font-mono">({displayedDocs.length})</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Tab switch */}
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-medium w-full sm:w-auto justify-center">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-md transition text-center ${
                  activeTab === 'all'
                    ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-md transition text-center ${
                  activeTab === 'invoices'
                    ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('quotations')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-md transition text-center ${
                  activeTab === 'quotations'
                    ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Quotations
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 sm:top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search client, number, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suppressHydrationWarning
                className="w-full pl-8 pr-3 py-2 sm:py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* 1. MOBILE CARDS VIEW (md:hidden) */}
        <div className="md:hidden divide-y divide-zinc-200">
          {displayedDocs.length === 0 ? (
            <div className="py-10 px-4 text-center text-zinc-500">
              <p className="text-sm font-medium">No documents match your filter.</p>
              <p className="text-xs text-zinc-400 mt-1">Create a new quotation or invoice to get started.</p>
            </div>
          ) : (
            displayedDocs.map((doc) => {
              const isInv = doc.type === 'invoice';
              return (
                <div key={doc.id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-zinc-50/60 transition">
                  {/* Top line: badge + number + status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-950">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isInv ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        {isInv ? 'INV' : 'QUO'}
                      </span>
                      <span>{doc.docNumber}</span>
                    </div>

                    <span
                      className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                        doc.status === 'Paid' || doc.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : doc.status === 'Partially Paid' || doc.status === 'Sent'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : doc.status === 'Overdue' || doc.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {/* Client & Event */}
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{doc.customerName}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-0.5">
                      <span className="truncate max-w-[200px]">{doc.eventType}</span>
                      <span className="font-mono text-[11px] text-zinc-500 shrink-0">{doc.date}</span>
                    </div>
                  </div>

                  {/* Financials & Quick Action buttons */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <div className="font-mono text-xs">
                      <span className="text-[10px] text-zinc-400 block uppercase">Total / Due</span>
                      <span className="font-bold text-zinc-950">{formatINR(doc.totalAmount)}</span>
                      {doc.balance > 0 ? (
                        <span className="ml-1.5 text-amber-900 font-semibold text-[11px]">
                          (Due: {formatINR(doc.balance)})
                        </span>
                      ) : (
                        <span className="ml-1.5 text-emerald-700 font-semibold text-[11px]">
                          (Paid)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={isInv ? `/invoices/${doc.id}` : `/quotations/${doc.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-300 transition min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="inline-flex items-center justify-center text-rose-700 hover:text-rose-900 p-2 rounded-lg border border-rose-200 hover:bg-rose-50 transition min-h-[36px] min-w-[36px] cursor-pointer"
                        title={`Delete ${doc.docNumber}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. DESKTOP & TABLET TABLE (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Doc Number</th>
                <th className="py-3 px-4">Client / Event</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {displayedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <p className="text-sm font-medium">No documents match your filter.</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Create a new quotation or invoice to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedDocs.map((doc) => {
                  const isInv = doc.type === 'invoice';
                  return (
                    <tr key={doc.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-950">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5 ${
                            isInv
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-200 text-zinc-800'
                          }`}
                        >
                          {isInv ? 'INV' : 'QUO'}
                        </span>
                        {doc.docNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-zinc-900">{doc.customerName}</p>
                        <p className="text-[11px] text-zinc-500 truncate max-w-xs">
                          {doc.eventType}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-600">{doc.date}</td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-950">
                        {formatINR(doc.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={
                            doc.balance > 0
                              ? 'font-bold text-zinc-950'
                              : 'font-semibold text-emerald-700'
                          }
                        >
                          {formatINR(doc.balance)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                            doc.status === 'Paid' || doc.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : doc.status === 'Partially Paid' || doc.status === 'Sent'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : doc.status === 'Overdue' || doc.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            href={isInv ? `/invoices/${doc.id}` : `/quotations/${doc.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600 px-2.5 py-1 rounded border border-zinc-200 hover:bg-zinc-100 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                            title={`Delete ${doc.docNumber}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!docToDelete}
        title={docToDelete?.type === 'quotation' ? 'Delete Quotation' : 'Delete Invoice'}
        message={`Are you sure you want to permanently delete ${
          docToDelete?.type === 'quotation' ? 'quotation' : 'tax invoice'
        } ${docToDelete?.docNumber}? All details and associated records will be removed.`}
        docNumber={docToDelete?.docNumber}
        docType={docToDelete?.type}
        clientName={docToDelete?.customerName}
        amount={docToDelete?.totalAmount}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setDocToDelete(null);
        }}
      />
    </div>
  );
}
