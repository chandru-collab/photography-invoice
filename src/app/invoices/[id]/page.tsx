'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Invoice, PaymentRecord, ShopProfile } from '@/types';
import {
  getInvoiceById,
  getInvoiceByIdSync,
  getShopProfile,
  getShopProfileSync,
  initializeStorage,
} from '@/lib/storage';
import { ClassicDocumentTemplate } from '@/components/ClassicDocumentTemplate';
import { DocumentActions } from '@/components/DocumentActions';
import { PaymentModal } from '@/components/PaymentModal';

function InvoiceViewContent() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeStorage();
    if (!id) return;
    // 1. Instant local-first render
    const localInv = getInvoiceByIdSync(id);
    const localShop = getShopProfileSync();
    if (localInv) setInvoice(localInv);
    if (localShop) setShop(localShop);

    // 2. Background sync
    async function load() {
      const [invData, shopData] = await Promise.all([
        getInvoiceById(id),
        getShopProfile(),
      ]);
      if (invData) setInvoice(invData);
      if (shopData) setShop(shopData);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!invoice || !shop) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-zinc-200 rounded-xl text-center">
        <h2 className="text-lg font-bold text-zinc-900">Invoice Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-4">
          The requested invoice could not be found or may have been deleted.
        </p>
        <Link
          href="/invoices"
          className="inline-block px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg"
        >
          Back to Invoices List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4">
      {/* Action Toolbar */}
      <DocumentActions
        document={invoice}
        shop={shop}
        type="invoice"
        onRecordPaymentClick={() => {
          setSelectedReceipt(null);
          setIsPaymentModalOpen(true);
        }}
        onStatusChange={(newStatus) => {
          setInvoice({ ...invoice, payment_status: newStatus as any });
        }}
      />

      {/* Classic Professional Document Template */}
      <div className="overflow-x-auto pb-8">
        <ClassicDocumentTemplate
          document={invoice}
          shop={shop}
          type="invoice"
          onViewReceipt={(receipt) => {
            setSelectedReceipt(receipt);
            setIsPaymentModalOpen(true);
          }}
          onPayRemainingClick={() => {
            setSelectedReceipt(null);
            setIsPaymentModalOpen(true);
          }}
        />
      </div>

      {/* Record Payment Modal & Standalone Receipt Voucher */}
      <PaymentModal
        invoice={invoice}
        shop={shop}
        isOpen={isPaymentModalOpen}
        initialReceipt={selectedReceipt}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedReceipt(null);
        }}
        onPaymentRecorded={(updatedInvoice) => {
          setInvoice(updatedInvoice);
        }}
      />
    </div>
  );
}

export default function InvoiceViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <InvoiceViewContent />
    </Suspense>
  );
}
